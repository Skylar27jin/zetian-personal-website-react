import React, { useEffect, useState } from "react";
import { Alert, Button, Spinner, Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Editor from "./Editor";
import RichContent from "./RichContent";
import formatTime from "../pkg/TimeFormatter";
import "./CommentSection.css";

import type { Comment, CommentThread } from "../types/comment";
import GopherLoader from "./GopherLoader";
import LoginRequiredModal from "./LoginRequiredModal";
import { useComments } from "../hooks/useComments";

const MAX_COMMENT_LEN = 500;

type ReplyTarget = {
  commentId: number; // parent_id
  rootId: number;    // thread root id
  userId: number;
  userName: string;
};

function clampLen(s: string, max: number): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) : s;
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
  const { postId, viewerId, canComment, onRequireLogin, showHeader = false } = props;

  const navigate = useNavigate();
  const DEFAULT_AVATAR = "../gopher_front.png";

  const {
    threads,
    loadingThreads,
    threadsErr,
    clearError,
    hasMore,
    repliesMap,
    loadMoreThreads,
    loadMoreReplies,
    createTopComment,
    createReply,
    softDelete,
    toggleLike,
    refresh,
  } = useComments(postId);

  const [showLoginModal, setShowLoginModal] = useState(false);

  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  const canPost = draft.trim().length > 0;

  const ensureLogin = (): boolean => {
    if (!canComment) {
      onRequireLogin();
      return false;
    }
    return true;
  };

  const ensureLoginForLike = (): boolean => {
    // 点 like 才弹 modal（你的要求）
    if (!viewerId || !canComment) {
      setShowLoginModal(true);
      return false;
    }
    return true;
  };

  const goUser = (uid: number) => navigate(`/user/${uid}`);

  // beginReply 必须显式拿 rootId
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

  useEffect(() => {
    // postId 变动时，清理输入框（数据由 hook 缓存/加载）
    setReplyTarget(null);
    setReplyDraft("");
    setDraft("");
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handlePostTop = async () => {
    if (!ensureLogin()) return;
    const content = draft.trim();
    if (!content) return;

    setPosting(true);
    clearError();

    try {
      await createTopComment(content);
      setDraft("");
    } catch (e: any) {
      // hook 会写 threadsErr；这里不额外处理也行
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
      await createReply(commentId, rootId, content);
      setReplyDraft("");
      setReplyTarget(null);
    } catch (e: any) {
      // hook 会写 threadsErr；这里不额外处理也行
    }
  };

  const handleDelete = async (c: Comment, rootId: number) => {
    if (!viewerId || viewerId !== c.user_id) return;

    const ok = window.confirm("Delete this comment?");
    if (!ok) return;

    try {
      await softDelete(c, rootId);

      if (replyTarget?.commentId === c.id) {
        setReplyTarget(null);
        setReplyDraft("");
      }
    } catch (e: any) {
      // hook 会写 threadsErr
    }
  };

  const handleLikeClick = async (c: Comment, rootId: number) => {
    if (!ensureLoginForLike()) return;
    await toggleLike(rootId, c.id);
  };

  const renderActions = (c: Comment, rootId: number) => {
    const isMine = !!viewerId && viewerId === c.user_id;
    const liked = Boolean((c as any).liked_by_viewer);

    return (
      <div className="d-flex align-items-center comment-actions">
        {/* Like */}
        <button
          type="button"
          className="btn btn-link p-0 d-flex align-items-center"
          style={{ textDecoration: "none" }}
          onClick={(e) => {
            e.stopPropagation();
            handleLikeClick(c, rootId);
          }}
          aria-label={liked ? "unlike comment" : "like comment"}
        >
          <img
            src={liked ? "/hearted.png" : "/heart.png"}
            alt={liked ? "hearted" : "heart"}
            style={{ width: 18, height: 18 }}
          />
        </button>
        <span className="text-muted ms-1">{c.like_count ?? 0}</span>

        {c.parent_id == null && (
          <span className="text-muted ms-3">{c.reply_count ?? 0} replies</span>
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
          <Button size="sm" variant="outline-secondary" onClick={refresh}>
            Refresh
          </Button>
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
      {threads.map((t: CommentThread) => {
        const root = t.root;
        const rootId = root.id;

        const rs = repliesMap[rootId] ?? { items: t.replies_preview ?? [], has_more: false, next_cursor: null, loading: false, error: null };

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
                      {rs.items.map((r: Comment) => {
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
            onClick={loadMoreThreads}
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

      {/* 只在点 like 时弹 */}
      <LoginRequiredModal
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
        message="Please log in first to like this comment."
      />
    </div>
  );
}
