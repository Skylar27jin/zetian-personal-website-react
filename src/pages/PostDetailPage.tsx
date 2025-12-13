// src/pages/PostDetailPage.tsx

import RichContent from "../components/RichContent";
import Editor from "../components/Editor";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./PostDetailPage.css";
import {
  Container,
  Spinner,
  Alert,
  Button,
  Modal,
  Form,
  Badge,
  Dropdown,
  Tab,
  Tabs,
} from "react-bootstrap";
import { useMeAuth } from "../hooks/useMeAuth";
import {
  getPostByID,
  likePost,
  unlikePost,
  favPost,
  unfavPost,
  editPost,
  deletePost,
} from "../api/postApi";
import type { Post, GetPostByIDResp } from "../types/post";
import PostActionsDropdown from "../components/PostActionsDropDown";

import {
  getUser,
  getUserProfile,
  followUser,
  unfollowUser,
} from "../api/userApi";
import type { UserProfile } from "../types/user";
import GopherLoader from "../components/GopherLoader";
import PostMediaDisplay from "../components/PostMediaDisplay";
import ScrollablePanel from "../components/ScrollPanel";
import ReplyPreview from "../components/ReplyPreview";
import PostReactionButtons from "../components/PostReactionButtons";
import LoginRequiredModal from "../components/LoginRequiredModal";
import { PostUpdater, usePostReactions } from "../hooks/usePostReactions";
import CommentSection from "../components/CommentSection";


const ICON_SIZE = 28;

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date
      .toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      .replace(",", "");
  } catch {
    return isoString;
  }
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const postId = id ? Number(id) : NaN;
  const navigate = useNavigate();

  const { authLoading, authError, userId: viewerId, username } = useMeAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const postUrl =
  typeof window !== "undefined"
    ? `${window.location.origin}/post/${postId}`
    : `/post/${postId}`;

  // ========= reply_to 原帖信息 =========
  interface ParentMeta {
    post: Post;
    authorName?: string;
  }

  const [parentMeta, setParentMeta] = useState<ParentMeta | null>(null);
  const [parentLoading, setParentLoading] = useState(false);

  const DEFAULT_AVATAR = "../gopher_front.png";

  // edit 相关
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // 操作错误（like/fav/edit/delete/follow）
  const [actionError, setActionError] = useState<string | null>(null);

  // 删除中 loading
  const [deleting, setDeleting] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(5);
  const [deleteButtonEnabled, setDeleteButtonEnabled] = useState(false);

  // 举报 Modal
  const [showReportModal, setShowReportModal] = useState(false);

  // ========= 作者 follow 状态 =========
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [authorProfileLoading, setAuthorProfileLoading] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const [showLoginRequired, setShowLoginRequired] = useState(false);

  const [detailTab, setDetailTab] = useState<"comments" | "foryou">("comments");


  // URL 参数非法
  if (Number.isNaN(postId)) {
    return (
      <div className="bg-light min-vh-100 d-flex flex-column">
        <main className="flex-grow-1 py-4">
          <Container style={{ maxWidth: "960px" }}>
            <Alert variant="danger">Invalid post id in URL.</Alert>
          </Container>
        </main>
      </div>
    );
  }

  // 拉取帖子详情
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setActionError(null);
      try {
        const resp: GetPostByIDResp = await getPostByID({ id: postId });
        if (cancelled) return;

        if (!resp.isSuccessful || !resp.post) {
          setError(resp.errorMessage || "Post not found");
          setPost(null);
        } else {
          setPost(resp.post);
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Network error");
        setPost(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [postId]);

  const isOwner = !!post && !!viewerId && post.user_id === viewerId;

  // 拉取作者 profile（用于 isFollowing 状态）
  useEffect(() => {
    if (!post || !viewerId || authError) {
      setAuthorProfile(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setAuthorProfileLoading(true);
      try {
        const resp = await getUserProfile(post.user_id);
        if (cancelled) return;

        if (!resp.isSuccessful) {
          console.error(resp.errorMessage);
          setAuthorProfile(null);
        } else {
          setAuthorProfile(resp.user);
        }
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setAuthorProfile(null);
      } finally {
        if (!cancelled) {
          setAuthorProfileLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [post?.user_id, viewerId, authError]);

  // 当前 post 有 reply_to 时，懒加载原帖信息
  useEffect(() => {
    let cancelled = false;

    if (!post || !post.reply_to) {
      setParentMeta(null);
      setParentLoading(false);
      return;
    }

    (async () => {
      try {
        setParentLoading(true);
        setParentMeta(null);

        // 1) 拉原帖
        const resp = await getPostByID({ id: post.reply_to! });
        if (cancelled) return;

        if (!resp.isSuccessful || !resp.post) {
          setParentMeta(null);
          return;
        }

        const parentPost = resp.post;
        const meta: ParentMeta = { post: parentPost };

        // 2) 拉作者名（失败就算了）
        try {
          const userResp = await getUser({ id: parentPost.user_id });
          if (!cancelled && userResp.isSuccessful) {
            meta.authorName = userResp.userName;
          }
        } catch {
          // ignore
        }

        if (!cancelled) {
          setParentMeta(meta);
        }
      } catch {
        if (!cancelled) {
          setParentMeta(null);
        }
      } finally {
        if (!cancelled) {
          setParentLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [post?.reply_to, post?.id]);

  // delete countdown
  useEffect(() => {
    if (!showDeleteModal) return;

    setDeleteCountdown(5);
    setDeleteButtonEnabled(false);

    const timerId = window.setInterval(() => {
      setDeleteCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerId);
          setDeleteButtonEnabled(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [showDeleteModal]);


  // ====================
  // like / unlike / fav / unfav
  // ====================
  const ensureLogin = () => {
    if (!viewerId || authError) {
      setActionError(null);
      setShowLoginRequired(true);
      return false;
    }
    return true;
  };

  const updatePostLocal: PostUpdater = (pid, patch) => {
    setPost((prev) => (prev && prev.id === pid ? patch(prev) : prev));
  };

  const { handleLike, handleUnlike, handleFav, handleUnfav } =
    usePostReactions(updatePostLocal, {
      ensureLogin,
      setActionError,
    });

  // ====================
  // Comment / Share on detail
  // ====================
  const handleCommentJump = () => {
    setDetailTab("comments");
    if (typeof window === "undefined") return;
    const el = document.getElementById("post-comments-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSharePost = () => {
    setShowShareModal(true);
  };

  const handleCopyPostLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1500);
    } catch (e) {
      console.error("copy failed", e);
    }
  };

  async function handleFollow() {
    if (followBusy) return;
    if (!ensureLogin()) return;
    if (!authorProfile || authorProfile.isFollowing) return;

    setFollowBusy(true);
    try {
      const resp = await followUser(authorProfile.id);
      if (!resp.isSuccessful) {
        setActionError(resp.errorMessage || "Failed to follow user.");
        return;
      }
      const updated = {
        ...authorProfile,
        isFollowing: true,
        followersCount: authorProfile.followersCount + 1,
      };
      setAuthorProfile(updated);
    } catch (e: any) {
      setActionError(e?.message || "Network error while following.");
    } finally {
      setFollowBusy(false);
    }
  }

  async function handleUnfollow() {
    if (followBusy) return;
    if (!ensureLogin()) return;
    if (!authorProfile || !authorProfile.isFollowing) return;

    setFollowBusy(true);
    try {
      const resp = await unfollowUser(authorProfile.id);
      if (!resp.isSuccessful) {
        setActionError(resp.errorMessage || "Failed to unfollow user.");
        return;
      }
      const updated = {
        ...authorProfile,
        isFollowing: false,
        followersCount: Math.max(0, authorProfile.followersCount - 1),
      };
      setAuthorProfile(updated);
    } catch (e: any) {
      setActionError(e?.message || "Network error while unfollowing.");
    } finally {
      setFollowBusy(false);
    }
  }


  // ====================
  // Reply：跳到发帖页，并带上 reply_to 信息
  // ====================
  const handleReply = () => {
    if (!post) return;
    if (!viewerId || authError) {
      setActionError("Please log in to reply to this post.");
      return;
    }

    navigate("/post/create", {
      state: {
        replyToPost: {
          id: post.id,
          title: post.title,
          userName: post.user_name,
        },
      },
    });
  };

  // ====================
  // Edit
  // ====================
  const openEditModal = () => {
    if (!isOwner || !post) return;
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setActionError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    setActionError(null);

    try {
      setEditSaving(true);
      const resp = await editPost({
        id: editingPost.id,
        title: editTitle,
        content: editContent,
      });

      if (!resp.isSuccessful || !resp.post) {
        setActionError(resp.errorMessage || "Failed to edit post.");
        return;
      }

      setPost(resp.post);
      setEditingPost(null);
    } catch (e: any) {
      setActionError(e?.message || "Network error while editing.");
    } finally {
      setEditSaving(false);
    }
  };

  // ====================
  // Delete
  // ====================
  const handleDeletePost = async () => {
    if (!isOwner || !post) return;
    setActionError(null);

    try {
      setDeleting(true);
      const resp = await deletePost({ id: post.id });
      if (!resp.isSuccessful) {
        setActionError(resp.errorMessage || "Failed to delete post.");
        return;
      }
      setShowDeleteModal(false);
      navigate(-1);
    } catch (e: any) {
      setActionError(e?.message || "Network error while deleting.");
    } finally {
      setDeleting(false);
    }
  };


  // ====================
  // 渲染
  // ====================
  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <main className="flex-grow-1 py-4">
        <Container fluid style={{ maxWidth: "1200px" }}>
          {/* 顶部：返回 + 当前身份 */}
          <header className="mb-3 d-flex justify-content-between align-items-center">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => navigate(-1)}
            >
              ← Back
            </Button>

            <div className="text-end">
              {authLoading ? (
                <span className="text-secondary small">
                  <Spinner animation="border" size="sm" /> Verifying session…
                </span>
              ) : (
                <span className="text-muted small">
                </span>
              )}
            </div>
          </header>

          {/* loading / error */}
          {loading && (
            <div className="my-4 d-flex justify-content-center py-5">
              <GopherLoader />
            </div>
          )}

          {!loading && error && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}

          {/* action 错误 */}
          {actionError && (
            <Alert variant="danger" className="mt-3 py-2">
              {actionError}
            </Alert>
          )}

        {/* 主体 */}
        {!loading && !error && post && (
          <div className="mt-3">
            {/* 正文（单列） */}
            <div className="d-flex flex-column">
              <section className="w-100">
                {/* 标题行 */}
                <div className="d-flex align-items-center gap-2 mb-2">
                  <h2 className="fw-bold mb-0">{post.title}</h2>
                  {isOwner && <Badge bg="secondary">Me</Badge>}
                </div>

                {/* meta + avatar + follow */}
                <div className="d-flex align-items-center gap-2 mb-2">
                  {/* avatar */}
                  <img
                    src={
                      post.user_avatar_url && post.user_avatar_url.trim().length > 0
                        ? post.user_avatar_url
                        : DEFAULT_AVATAR
                    }
                    alt={post.user_name || `user${post.user_id}`}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid #ddd",
                      cursor: "pointer",
                    }}
                    onClick={() => navigate(`/user/${post.user_id}`)}
                  />

                  {/* text meta + follow button */}
                  <div className="text-muted small">
                    <div className="d-flex align-items-center gap-2">
                      <Link
                        to={`/user/${post.user_id}`}
                        className="text-decoration-none"
                        style={{ fontWeight: 500 }}
                      >
                        {post.user_name ? `${post.user_name}` : `User #${post.user_id}`}
                      </Link>

                      {/* 作者是否关注了当前 viewer：Followed you */}
                      {!isOwner &&
                        authorProfile &&
                        !authorProfileLoading &&
                        !authError &&
                        authorProfile.followedYou && (
                          <span className="badge bg-light text-muted border rounded-pill small">
                            Followed you
                          </span>
                        )}

                      {/* Follow 按钮（不是自己 + 已登录） */}
                      {!isOwner &&
                        authorProfile &&
                        !authorProfileLoading &&
                        !authError && (
                          <div className="d-inline-flex align-items-center gap-1">
                            {authorProfile.isFollowing ? (
                              <Dropdown align="end">
                                <Dropdown.Toggle
                                  variant="outline-primary"
                                  size="sm"
                                  id="followed-dropdown"
                                  className="py-0 px-2 d-inline-flex align-items-center"
                                  disabled={followBusy}
                                >
                                  <span>Followed</span>
                                  <span className="ms-1 small">
                                    · {authorProfile.followersCount}
                                  </span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                  <Dropdown.Item
                                    onClick={handleUnfollow}
                                    disabled={followBusy}
                                  >
                                    Unfollow
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            ) : (
                              <Button
                                variant="primary"
                                size="sm"
                                className="py-0 px-2 d-inline-flex align-items-center"
                                disabled={followBusy}
                                onClick={handleFollow}
                              >
                                <span>Follow</span>
                                <span className="ms-1 small">
                                  · {authorProfile.followersCount}
                                </span>
                              </Button>
                            )}
                          </div>
                        )}
                    </div>

                    <div>
                      {formatTime(post.created_at)}
                      {" · "}
                      {post.school_name}
                      {post.category_name && <> · {post.category_name}</>}
                      {post.location && <> · {post.location}</>}
                    </div>
                  </div>
                </div>

                {/* tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="mb-3 d-flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge
                        key={tag}
                        bg="light"
                        text="dark"
                        className="border rounded-pill px-3 py-1"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* media */}
                {post.media_type !== "text" &&
                  post.media_urls &&
                  post.media_urls.length > 0 && (
                    <PostMediaDisplay
                      mediaType={post.media_type}
                      mediaUrls={post.media_urls}
                    />
                  )}

                {/* 正文 */}
                <ScrollablePanel maxHeight="70vh">
                  <RichContent content={post.content} />
                </ScrollablePanel>

                {/* 底部统计 + 操作区 */}
                <br />

                <div className="d-flex align-items-center text-muted small">
                  <div>view: {post.view_count}</div>

                  <div className="d-flex align-items-center gap-2 ms-auto">
                    <PostActionsDropdown
                      onEdit={isOwner ? openEditModal : undefined}
                      onDelete={
                        isOwner ? () => setShowDeleteModal(true) : undefined
                      }
                      onReport={
                        !isOwner ? () => setShowReportModal(true) : undefined
                      }
                      onReply={viewerId ? handleReply : undefined}
                      deleting={isOwner ? deleting : false}
                    />

                    <PostReactionButtons
                      post={post}
                      viewerId={viewerId}
                      onLike={handleLike}
                      onUnlike={handleUnlike}
                      onFav={handleFav}
                      onUnfav={handleUnfav}
                      iconSize={ICON_SIZE}
                      onRequireLogin={() => setShowLoginRequired(true)}
                      stopPropagation={false}
                      showComment
                      showShare
                      onCommentClick={handleCommentJump}
                      onShareClick={() => handleSharePost()}
                    />
                  </div>
                </div>

                {/* reply preview */}
                {post.reply_to && (
                  <div className="mb-3 mt-3">
                    <ReplyPreview
                      replyToPostId={post.reply_to}
                      parentPost={parentMeta?.post}
                      parentAuthorName={parentMeta?.authorName}
                      parentLoading={parentLoading}
                      maxLines={3}
                    />
                  </div>
                )}
              </section>
            </div>

            {/* Comments / For you（无边界，无外框） */}
            <section id="post-comments-section" className="mt-4 w-100">
              {/* Tabs：复用 Navbar feed-tabs/feed-tab 体系 */}
              <nav className="feed-tabs post-detail-tabs">
                <button
                  type="button"
                  className={
                    "feed-tab post-detail-tab" +
                    (detailTab === "comments" ? " active" : "")
                  }
                  onClick={() => setDetailTab("comments")}
                >
                  Comments
                </button>

                <button
                  type="button"
                  className={
                    "feed-tab post-detail-tab" +
                    (detailTab === "foryou" ? " active" : "")
                  }
                  onClick={() => setDetailTab("foryou")}
                >
                  For you
                </button>
              </nav>

              {/* 内容区域：不加 border/card，只留顶部间距 */}
              <div className="mt-3">
                {detailTab === "comments" ? (
                  <CommentSection
                    postId={postId}
                    viewerId={viewerId ?? null}
                    canComment={!!viewerId && !authError}
                    onRequireLogin={() => setShowLoginRequired(true)}
                  />
                ) : (
                  <div className="text-muted small">
                    For you is coming soon. This will show recommended posts related to
                    this one.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}


        </Container>
      </main>

      {/* Delete Confirm Modal with 5s countdown */}
      <Modal
        show={showDeleteModal}
        onHide={() => {
          if (!deleting) {
            setShowDeleteModal(false);
          }
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete this post?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>🗑️ This will permanently remove the post:</p>
          <p className="fw-semibold">“{post?.title ?? ""}”</p>
          <p className="small text-muted mb-2">
            Hint: Do you really want to say good bye to the post? 🐈‍⬛
          </p>
          <p className="small">
            {deleteButtonEnabled
              ? "If you're sure, click the delete button below."
              : `wait for ${deleteCountdown}s~ 👀`}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeletePost}
            disabled={!deleteButtonEnabled || deleting}
          >
            {deleting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting…
              </>
            ) : (
              "Yes, delete it"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Report Modal */}
      <Modal
        show={showReportModal}
        onHide={() => setShowReportModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Report this post</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-2">🚩 Thanks for helping keep the community safe.</p>
          <p className="small text-muted mb-3">
            Reporting system is not fully implemented yet.
            For now this is just a placeholder UI.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowReportModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal
        show={!!editingPost}
        onHide={() => setEditingPost(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Post</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Content</Form.Label>
              <Editor
                value={editContent}
                onChange={setEditContent}
                placeholder="Edit your post... You can use gopher emojis!"
                minRows={5}
              />
            </Form.Group>
          </Form>
          {editSaving && (
            <div className="text-muted small">
              <Spinner animation="border" size="sm" /> Saving…
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setEditingPost(null)}
            disabled={editSaving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveEdit}
            disabled={editSaving}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      <LoginRequiredModal
        show={showLoginRequired}
        onHide={() => setShowLoginRequired(false)}
      />
      {/* Share Post Modal */}
      <Modal
        show={showShareModal}
        onHide={() => setShowShareModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Share this post</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted mb-1">Post link</p>
          <div className="d-flex align-items-center gap-2">
            <Form.Control type="text" value={postUrl} readOnly />
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleCopyPostLink}
            >
              Copy
            </Button>
          </div>
          {shareCopied && (
            <div className="small text-success mt-2">
              Copied to clipboard.
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
