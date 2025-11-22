// src/pages/PostDetailPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Spinner,
  Alert,
  Button,
  Modal,
  Form,
  Badge,
} from "react-bootstrap";
import { motion } from "framer-motion";

import Navbar from "../components/Navbar";
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

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toISOString().slice(0, 19).replace("T", " ");
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

  // edit 相关
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // 操作错误（like/fav/edit/delete）
  const [actionError, setActionError] = useState<string | null>(null);

  // 删除中 loading
  const [deleting, setDeleting] = useState(false);

  // URL 参数非法
  if (Number.isNaN(postId)) {
    return (
      <div className="bg-light min-vh-100 d-flex flex-column">
        <Navbar />
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

  // ====================
  // like / unlike / fav / unfav
  // ====================
  const ensureLogin = () => {
    if (!viewerId || authError) {
      setActionError("Please log in to like / favorite this post.");
      return false;
    }
    return true;
  };

  const handleLike = async (pid: number) => {
    if (!ensureLogin() || !post || post.id !== pid) return;
    setActionError(null);
    try {
      const resp = await likePost(pid);
      if (!resp.isSuccessful) {
        setActionError(resp.errorMessage || "Failed to like.");
        return;
      }
      setPost((prev) =>
        prev
          ? {
              ...prev,
              is_liked_by_user: true,
              like_count: prev.like_count + 1,
            }
          : prev
      );
    } catch (e: any) {
      setActionError(e?.message || "Network error while liking.");
    }
  };

  const handleUnlike = async (pid: number) => {
    if (!ensureLogin() || !post || post.id !== pid) return;
    setActionError(null);
    try {
      const resp = await unlikePost(pid);
      if (!resp.isSuccessful) {
        setActionError(resp.errorMessage || "Failed to unlike.");
        return;
      }
      setPost((prev) =>
        prev
          ? {
              ...prev,
              is_liked_by_user: false,
              like_count: Math.max(prev.like_count - 1, 0),
            }
          : prev
      );
    } catch (e: any) {
      setActionError(e?.message || "Network error while unliking.");
    }
  };

  const handleFav = async (pid: number) => {
    if (!ensureLogin() || !post || post.id !== pid) return;
    setActionError(null);
    try {
      const resp = await favPost(pid);
      if (!resp.isSuccessful) {
        setActionError(resp.errorMessage || "Failed to favorite.");
        return;
      }
      setPost((prev) =>
        prev
          ? {
              ...prev,
              is_fav_by_user: true,
              fav_count: prev.fav_count + 1,
            }
          : prev
      );
    } catch (e: any) {
      setActionError(e?.message || "Network error while favoriting.");
    }
  };

  const handleUnfav = async (pid: number) => {
    if (!ensureLogin() || !post || post.id !== pid) return;
    setActionError(null);
    try {
      const resp = await unfavPost(pid);
      if (!resp.isSuccessful) {
        setActionError(resp.errorMessage || "Failed to unfavorite.");
        return;
      }
      setPost((prev) =>
        prev
          ? {
              ...prev,
              is_fav_by_user: false,
              fav_count: Math.max(prev.fav_count - 1, 0),
            }
          : prev
      );
    } catch (e: any) {
      setActionError(e?.message || "Network error while unfavoriting.");
    }
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
      <Navbar />

      <main className="flex-grow-1 py-4">
        <Container style={{ maxWidth: "1200px" }}>
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
                  {authError
                    ? "Viewing as guest."
                    : `Viewing as ${username}.`}
                </span>
              )}
            </div>
          </header>

          {/* loading / error */}
          {loading && (
            <div className="my-4 text-center">
              <Spinner animation="border" /> Loading post…
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

          {/* 主体：左内容 + 右评论占位 */}
          {!loading && !error && post && (
            <div className="d-flex flex-column flex-lg-row gap-4 mt-3">
              {/* 左侧：正文区域 */}
              <section className="flex-grow-1">
                {/* 标题行 */}
                <div className="d-flex align-items-center gap-2 mb-2">
                  <h2 className="fw-bold mb-0">{post.title}</h2>
                  {isOwner && <Badge bg="secondary">Me</Badge>}
                </div>

                {/* meta 信息 */}
                <div className="text-muted small mb-2">
                  🏫 {post.school_name} · 👁 {post.view_count} · 📅{" "}
                  {formatTime(post.created_at)}
                  {post.location && <> · 📍 {post.location}</>}
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
                    <div className="mb-4">
                      {post.media_type === "image" ? (
                        <img
                          src={post.media_urls[0]}
                          alt="post media"
                          className="img-fluid rounded-3"
                        />
                      ) : post.media_type === "video" ? (
                        <video
                          controls
                          className="w-100 rounded-3"
                          src={post.media_urls[0]}
                        />
                      ) : null}
                    </div>
                  )}

                {/* 正文：整屏展开，不用 Card 包围 */}
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: "1.05rem",
                    lineHeight: 1.7,
                  }}
                >
                  {post.content}
                </div>

                {/* 底部统计 */}
                <hr className="my-4" />
                <div className="text-muted small">
                  👍 {post.like_count} · ⭐ {post.fav_count} · 💬{" "}
                  {post.comment_count} · 🔁 {post.share_count}
                </div>

                {deleting && (
                  <div className="text-danger small mt-2">
                    <Spinner animation="border" size="sm" /> Deleting…
                  </div>
                )}
              </section>

              {/* 右侧：评论区域占位 */}
              <aside
                className="flex-shrink-0"
                style={{ width: "100%", maxWidth: "360px" }}
              >
                <div className="bg-white rounded-4 shadow-sm p-3 p-md-4">
                  <h5 className="fw-semibold mb-3">Comments</h5>
                  <p className="text-muted small mb-0">
                    Comment system coming soon.
                    <br />
                    This area is reserved for threaded discussions / replies.
                  </p>
                </div>
              </aside>
            </div>
          )}
        </Container>
      </main>

      {/* 固定在页面左下角的操作栏 */}
      {post && (
        <div
          className="position-fixed d-flex flex-wrap gap-2 align-items-center"
          style={{
            left: "24px",
            bottom: "24px",
            zIndex: 1050,
          }}
        >
          <motion.div whileTap={{ scale: 1.08 }}>
            <Button
              size="sm"
              variant={
                post.is_liked_by_user ? "primary" : "outline-secondary"
              }
              onClick={() =>
                post.is_liked_by_user
                  ? handleUnlike(post.id)
                  : handleLike(post.id)
              }
            >
              {post.is_liked_by_user ? "💙 Liked" : "👍 Like"}
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 1.08 }}>
            <Button
              size="sm"
              variant={
                post.is_fav_by_user ? "warning" : "outline-secondary"
              }
              onClick={() =>
                post.is_fav_by_user
                  ? handleUnfav(post.id)
                  : handleFav(post.id)
              }
            >
              {post.is_fav_by_user ? "🌟 Favorited" : "⭐ Fav"}
            </Button>
          </motion.div>

          {isOwner && (
            <>
              <motion.div whileTap={{ scale: 1.08 }}>
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={openEditModal}
                  disabled={deleting}
                >
                  ✏️ Edit
                </Button>
              </motion.div>

              <motion.div whileTap={{ scale: 1.08 }}>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={handleDeletePost}
                  disabled={deleting}
                >
                  {deleting ? "Deleting…" : "🗑 Delete"}
                </Button>
              </motion.div>
            </>
          )}
        </div>
      )}

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
              <Form.Control
                as="textarea"
                rows={5}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
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
    </div>
  );
}
