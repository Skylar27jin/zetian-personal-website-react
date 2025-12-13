import React, { useEffect, useState } from "react";
import { Alert, Button, Spinner, Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Editor from "./Editor";
import RichContent from "./RichContent";
import formatTime from "../pkg/TimeFormatter";
import "./CommentSection.css";

import {
  createComment,
  deleteComment,
  listCommentReplies,
  listPostCommentThreads,
} from "../api/commentApi";

import type { Comment, CommentThread } from "../types/comment";
import { CommentOrder } from "../types/comment";
import GopherLoader from "./GopherLoader";

const MAX_COMMENT_LEN = 500;
const THREAD_PAGE_SIZE = 20;
const REPLIES_PREVIEW_LIMIT = 2;
const REPLIES_PAGE_SIZE = 20;

type RepliesState = {
  items: Comment[];
  next_cursor: string | null;
  has_more: boolean;
  loading: boolean;
  error: string | null;
};

type ReplyTarget = {
  commentId: number; // parent_id
  rootId: number;    // thread root id
  userId: number;
  userName: string;
};

function makeCursorFromLast(list: Comment[]): string | null {
  if (!list || list.length === 0) return null;
  const last = list[list.length - 1];
  if (!last?.created_at || !last?.id) return null;
  return `${last.created_at}|${last.id}`;
}

function clampLen(s: string, max: number): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) : s;
}

function emptyRepliesState(): RepliesState {
  return {
    items: [],
    next_cursor: null,
    has_more: false,
    loading: false,
    error: null,
  };
}

// 3-dots toggle（阻止冒泡）
const KebabToggle = React.forwardRef<HTMLButtonElement, any>(
  ({ onClick }, ref) => (
    <button
      ref={ref}
      className="btn btn-link p-0 text-muted"
      style={{ textDecoration: "none", lineHeight: 1 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(e);
      }}
      aria-label="comment actions"
      type="button"
    >
      ···
    </button>
  )
);
KebabToggle.displayName = "KebabToggle";

export default function CommentSection(props: {
  postId: number;
  viewerId: number | null;
  canComment: boolean;
  onRequireLogin: () => void;
  /** 默认 false：因为 PostDetail 已经有 Comments tab 了 */
  showHeader?: boolean;
}) {
  const { postId, viewerId, canComment, onRequireLogin, showHeader = false } =
    props;

  const navigate = useNavigate();
  const DEFAULT_AVATAR = "../gopher_front.png";

  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [threadsErr, setThreadsErr] = useState<string | null>(null);

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  const [repliesMap, setRepliesMap] = useState<Record<number, RepliesState>>({});

  const canPost = draft.trim().length > 0;

  const ensureLogin = (): boolean => {
    if (!canComment) {
      onRequireLogin();
      return false;
    }
    return true;
  };

  const goUser = (uid: number) => navigate(`/user/${uid}`);

  const initRepliesStateFromThread = (t: CommentThread): RepliesState => {
    const preview = t.replies_preview ?? [];
    return {
      items: preview,
      next_cursor: makeCursorFromLast(preview),
      has_more: (t.root?.reply_count ?? 0) > preview.length,
      loading: false,
      error: null,
    };
  };

  // 关键修复：beginReply 必须显式拿到 rootId（渲染时就有），不要扫 threads 反查
  const beginReply = (c: Comment, rootId: number) => {
    if (!ensureLogin()) return;

    setReplyTarget({
      commentId: c.id,
      rootId,
      userId: c.user_id,
      userName: c.user_name || `User #${c.user_id}`,
    });
    setReplyDraft("");
  };

  const loadThreads = async (reset: boolean) => {
    setThreadsErr(null);
    setLoadingThreads(true);

    try {
      const resp = await listPostCommentThreads({
        post_id: postId,
        cursor: reset ? "" : nextCursor ?? "",
        limit: THREAD_PAGE_SIZE,
        replies_preview_limit: REPLIES_PREVIEW_LIMIT,
        order: CommentOrder.NEW_TO_OLD,
      });

      if (!resp.isSuccessful) {
        throw new Error(resp.errorMessage || "Load comments failed");
      }

      const newThreads = resp.threads ?? [];
      setThreads((prev) => (reset ? newThreads : [...prev, ...newThreads]));

      setRepliesMap((prev) => {
        const copy = { ...prev };
        newThreads.forEach((t) => {
          const rid = t?.root?.id;
          if (rid && copy[rid] === undefined) {
            copy[rid] = initRepliesStateFromThread(t);
          }
        });
        return copy;
      });

      setNextCursor(resp.next_cursor ?? null);
      setHasMore(!!resp.has_more);
    } catch (e: any) {
      setThreadsErr(e?.message || "Network error");
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    setThreads([]);
    setRepliesMap({});
    setNextCursor(null);
    setHasMore(false);
    setReplyTarget(null);
    setReplyDraft("");
    setDraft("");
    loadThreads(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handlePostTop = async () => {
    if (!ensureLogin()) return;
    const content = draft.trim();
    if (!content) return;

    setPosting(true);
    setThreadsErr(null);

    try {
      const resp = await createComment({ post_id: postId, content });
      if (!resp.isSuccessful || !resp.comment) {
        throw new Error(resp.errorMessage || "Create failed");
      }

      const newThread: CommentThread = {
        root: resp.comment,
        replies_preview: [],
      };
      setThreads((prev) => [newThread, ...prev]);

      setRepliesMap((prev) => ({
        ...prev,
        [resp.comment!.id]: emptyRepliesState(),
      }));

      setDraft("");
    } catch (e: any) {
      setThreadsErr(e?.message || "Network error while creating comment");
    } finally {
      setPosting(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!ensureLogin()) return;
    if (!replyTarget) return;

    const content = replyDraft.trim();
    if (!content) return;

    const { commentId, rootId } = replyTarget;

    try {
      const resp = await createComment({
        post_id: postId,
        content,
        parent_id: commentId,
      });

      if (!resp.isSuccessful || !resp.comment) {
        throw new Error(resp.errorMessage || "Reply failed");
      }

      setRepliesMap((prev) => {
        const cur = prev[rootId] ?? emptyRepliesState();
        const merged = [resp.comment!, ...cur.items]; // NEW_TO_OLD
        return {
          ...prev,
          [rootId]: {
            ...cur,
            items: merged,
            next_cursor: makeCursorFromLast(merged),
          },
        };
      });

      setThreads((prev) =>
        prev.map((t) =>
          t.root.id !== rootId
            ? t
            : {
                ...t,
                root: {
                  ...t.root,
                  reply_count: (t.root.reply_count ?? 0) + 1,
                },
              }
        )
      );

      setReplyDraft("");
      setReplyTarget(null);
    } catch (e: any) {
      setRepliesMap((prev) => ({
        ...prev,
        [rootId]: {
          ...(prev[rootId] ?? emptyRepliesState()),
          error: e?.message || "Network error while replying",
        },
      }));
    }
  };

  const loadMoreReplies = async (rootId: number) => {
    const st = repliesMap[rootId];
    if (!st || st.loading || !st.has_more) return;

    setRepliesMap((prev) => ({
      ...prev,
      [rootId]: { ...prev[rootId], loading: true, error: null },
    }));

    try {
      const resp = await listCommentReplies({
        root_id: rootId,
        cursor: st.next_cursor ?? "",
        limit: REPLIES_PAGE_SIZE,
        order: CommentOrder.NEW_TO_OLD,
      });

      if (!resp.isSuccessful) {
        throw new Error(resp.errorMessage || "Load replies failed");
      }

      const newRows = resp.replies ?? [];
      setRepliesMap((prev) => {
        const cur = prev[rootId];
        const merged = [...cur.items, ...newRows]; // NEW_TO_OLD
        return {
          ...prev,
          [rootId]: {
            ...cur,
            items: merged,
            next_cursor: resp.next_cursor ?? makeCursorFromLast(merged),
            has_more: !!resp.has_more,
            loading: false,
            error: null,
          },
        };
      });
    } catch (e: any) {
      setRepliesMap((prev) => ({
        ...prev,
        [rootId]: {
          ...prev[rootId],
          loading: false,
          error: e?.message || "Network error",
        },
      }));
    }
  };

  const handleDelete = async (c: Comment, rootId: number) => {
    if (!viewerId || viewerId !== c.user_id) return;

    const ok = window.confirm("Delete this comment?");
    if (!ok) return;

    try {
      const resp = await deleteComment({ comment_id: c.id });
      if (!resp?.isSuccessful) {
        throw new Error(resp?.errorMessage || "Delete failed");
      }

      if (c.parent_id == null) {
        setThreads((prev) =>
          prev.map((t) =>
            t.root.id !== c.id
              ? t
              : {
                  ...t,
                  root: { ...t.root, is_deleted: true, content: "[deleted]" },
                }
          )
        );
      } else {
        setRepliesMap((prev) => {
          const st = prev[rootId];
          if (!st) return prev;
          return {
            ...prev,
            [rootId]: {
              ...st,
              items: st.items.map((x) =>
                x.id !== c.id ? x : { ...x, is_deleted: true, content: "[deleted]" }
              ),
            },
          };
        });

        setThreads((prev) =>
          prev.map((t) =>
            t.root.id !== rootId
              ? t
              : {
                  ...t,
                  root: {
                    ...t.root,
                    reply_count: Math.max(0, (t.root.reply_count ?? 0) - 1),
                  },
                }
          )
        );
      }

      if (replyTarget?.commentId === c.id) {
        setReplyTarget(null);
        setReplyDraft("");
      }
    } catch (e: any) {
      setThreadsErr(e?.message || "Network error while deleting");
    }
  };

  const renderActions = (c: Comment, rootId: number) => {
    const isMine = !!viewerId && viewerId === c.user_id;

    return (
      <div className="d-flex align-items-center comment-actions">

        {c.parent_id == null && (
          <span className="text-muted">{c.reply_count ?? 0} replies</span>
        )}

        <div className="ms-auto" onClick={(e) => e.stopPropagation()}>
          <Dropdown align="end">
            <Dropdown.Toggle as={KebabToggle} />
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => alert("Report is not implemented yet.")}>
                Report
              </Dropdown.Item>

              {isMine && (
                <Dropdown.Item
                  className="text-danger"
                  onClick={() => handleDelete(c, rootId)}
                >
                  Delete
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    );
  };

  const renderReplyBox = (c: Comment) => {
    if (!replyTarget || replyTarget.commentId !== c.id) return null;

    return (
      <div className="reply-composer">
        <Editor
          value={replyDraft}
          onChange={(v) => setReplyDraft(clampLen(v, MAX_COMMENT_LEN))}
          placeholder={`Reply to ${replyTarget.userName}...`}
          minRows={1}
        />

        <div className="d-flex gap-2 mt-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setReplyTarget(null);
              setReplyDraft("");
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={replyDraft.trim().length === 0}
            onClick={handleReplySubmit}
          >
            Reply
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-100 comment-section">
      {showHeader && (
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h5 className="fw-semibold mb-0">Comments</h5>
        </div>
      )}

      {threadsErr && (
        <Alert variant="danger" className="py-2">
          {threadsErr}
        </Alert>
      )}

      {/* 顶层评论输入 */}
      <div className="mb-3">
        <Editor
          value={draft}
          onChange={(v) => setDraft(clampLen(v, MAX_COMMENT_LEN))}
          placeholder={canComment ? "Write a comment..." : "Login required to comment"}
          minRows={2}
        />

        <div className="d-flex justify-content-end mt-2">
          {canPost && (
            <Button
              size="sm"
              variant="primary"
              onClick={handlePostTop}
              disabled={posting}
            >
              {posting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Posting…
                </>
              ) : (
                "Post"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* loading */}
      {loadingThreads && threads.length === 0 && (
        <div className="text-muted small d-flex align-items-center gap-2">
          <GopherLoader />
        </div>
      )}

      {/* empty */}
      {!loadingThreads && threads.length === 0 && (
        <div className="text-muted small">No comments yet.</div>
      )}

      {/* threads list */}
      {threads.map((t) => {
        const root = t.root;
        const rootId = root.id;

        const rs = repliesMap[rootId] ?? initRepliesStateFromThread(t);

        const rootUserName = root.user_name || `User #${root.user_id}`;
        const rootAvatar =
          root.user_avatar_url && root.user_avatar_url.trim()
            ? root.user_avatar_url
            : DEFAULT_AVATAR;

        return (
          <div key={rootId} className="comment-item py-2">
            <div className="d-flex gap-2">
              <img
                src={rootAvatar}
                alt={rootUserName}
                className="comment-avatar"
                style={{ width: 34, height: 34 }}
                onClick={() => goUser(root.user_id)}
              />

              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="comment-author" onClick={() => goUser(root.user_id)}>
                    {rootUserName}
                  </div>
                  <div className="text-muted comment-meta">
                    {formatTime(root.created_at)}
                  </div>
                </div>

                <div
                  className="mt-1 comment-body"
                  style={{ cursor: canComment ? "text" : "default" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    beginReply(root, rootId);
                  }}
                >
                  <RichContent content={root.is_deleted ? "[deleted]" : root.content} />
                </div>

                {renderActions(root, rootId)}
                {renderReplyBox(root)}

                {/* replies */}
                {rs.items.length > 0 && (
                  <div className="replies-wrap">
                    <div className="replies-box">
                      {rs.items.map((r) => {
                        const rUserName = r.user_name || `User #${r.user_id}`;
                        const rAvatar =
                          r.user_avatar_url && r.user_avatar_url.trim()
                            ? r.user_avatar_url
                            : DEFAULT_AVATAR;

                        return (
                          <div key={r.id} className="reply-item">
                            <div className="d-flex gap-2">
                              <img
                                src={rAvatar}
                                alt={rUserName}
                                className="comment-avatar"
                                style={{ width: 26, height: 26 }}
                                onClick={() => goUser(r.user_id)}
                              />

                              <div className="flex-grow-1">
                                <div className="d-flex justify-content-between">
                                  <div className="small" style={{ fontWeight: 600 }}>
                                    <span
                                      style={{ cursor: "pointer" }}
                                      onClick={() => goUser(r.user_id)}
                                    >
                                      {rUserName}
                                    </span>

                                    {r.reply_to_user_name ? (
                                      <span className="text-muted reply-to">
                                        → {r.reply_to_user_name}
                                      </span>
                                    ) : null}
                                  </div>

                                  <div className="text-muted comment-meta">
                                    {formatTime(r.created_at)}
                                  </div>
                                </div>

                                <div
                                  className="mt-1 comment-body"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    beginReply(r, rootId);
                                  }}
                                >
                                  <RichContent
                                    content={r.is_deleted ? "[deleted]" : r.content}
                                  />
                                </div>

                                {renderActions(r, rootId)}
                                {renderReplyBox(r)}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {rs.error && <div className="text-danger small">{rs.error}</div>}

                      {rs.has_more && (
                        <Button
                          size="sm"
                          variant="link"
                          className="p-0 text-decoration-none comment-action-btn"
                          onClick={() => loadMoreReplies(rootId)}
                          disabled={rs.loading}
                        >
                          {rs.loading ? <GopherLoader /> : "Load more replies"}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* load more threads */}
      <div className="mt-2 d-flex justify-content-center">
        {hasMore ? (
          <Button
            size="sm"
            variant="link"
            className="text-decoration-none comment-action-btn"
            onClick={() => loadThreads(false)}
            disabled={loadingThreads}
          >
            {loadingThreads ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Loading…
              </>
            ) : (
              "Load more comments"
            )}
          </Button>
        ) : (
          <div className="text-muted small">No more comments.</div>
        )}
      </div>
    </div>
  );
}
