// src/pages/UserForumIndex.tsx
import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Spinner,
  Alert,
  Modal,
  Form,
} from "react-bootstrap";
import { motion } from "framer-motion";

import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import { useMeAuth } from "../hooks/useMeAuth";
import { usePersonalPosts } from "../hooks/usePersonalPosts";
import { deletePost, editPost } from "../api/postApi";
import type { Post } from "../types/post";

export default function MyForumProfilePage() {
  const { authLoading, authError, userId, username, email } = useMeAuth();

  const enabled = !authLoading && !authError && !!userId;

  const {
    posts,
    loadingPosts,
    postsError,
    hasMore,
    loadMore,
    handleLike,
    handleUnlike,
    handleFav,
    handleUnfav,
    setPosts,
    setHasMore,
  } = usePersonalPosts(userId, enabled);

  // 统一的 action 错误反馈（edit/delete）
  const [actionError, setActionError] = useState<string | null>(null);

  // 编辑相关状态
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // 删除相关状态：要删除哪一篇 + 倒计时
  const [confirmDeletePost, setConfirmDeletePost] = useState<Post | null>(null);
  const [deleteCountdown, setDeleteCountdown] = useState(5);
  const [deleteButtonEnabled, setDeleteButtonEnabled] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

  // 验证失败：显示错误 + 跳转按钮
  if (!authLoading && authError) {
    return (
      <div className="bg-light min-vh-100 d-flex flex-column">
        <Navbar />
        <main className="flex-grow-1 py-4">
          <Container className="max-w-3xl">
            <header className="text-center mb-4">
              <h1 className="fw-bold">My Forum</h1>
              <Alert variant="danger" className="mt-3">
                Auth failed: {authError}
              </Alert>
              <motion.div
                whileTap={{ scale: 1.08 }}
                transition={{ duration: 0.12 }}
              >
                <Button
                  variant="primary"
                  onClick={() => (window.location.href = "/login")}
                >
                  Go to Login
                </Button>
              </motion.div>
            </header>
          </Container>
        </main>
      </div>
    );
  }

  // 打开编辑弹窗
  const openEditModal = (post: Post) => {
    if (!userId || userId !== post.user_id) return;
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setActionError(null);
  };

  // 保存编辑
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

      const updated = resp.post;
      setPosts((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );

      setEditingPost(null);
    } catch (e: any) {
      setActionError(e?.message || "Network error while editing.");
    } finally {
      setEditSaving(false);
    }
  };

  // 点击 Delete（来自卡片上的菜单），只是打开确认 Modal
  const requestDeletePost = (post: Post) => {
    if (!userId || userId !== post.user_id) return;
    setActionError(null);
    setConfirmDeletePost(post);
  };

  // 当 confirmDeletePost 变化（打开弹窗）时，启动 5 秒倒计时
  useEffect(() => {
    if (!confirmDeletePost) return;

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
  }, [confirmDeletePost]);

  // 真正执行删除
  const handleConfirmDeletePost = async () => {
    if (!confirmDeletePost || !userId || userId !== confirmDeletePost.user_id) {
      return;
    }

    setActionError(null);

    try {
      setDeletingPostId(confirmDeletePost.id);
      const resp = await deletePost({ id: confirmDeletePost.id });

      if (!resp.isSuccessful) {
        setActionError(resp.errorMessage || "Failed to delete post.");
        return;
      }

      setPosts((prev) => prev.filter((p) => p.id !== confirmDeletePost.id));
      setConfirmDeletePost(null);
    } catch (e: any) {
      setActionError(e?.message || "Network error while deleting.");
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleCloseDeleteModal = () => {
    if (deletingPostId !== null) return; // 正在删的时候不要关
    setConfirmDeletePost(null);
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />

      <main className="flex-grow-1 py-4">
        <Container className="max-w-3xl">
          {/* Header */}
          <header className="text-center mb-4">
            <h1 className="fw-bold">My Forum</h1>

            {authLoading && (
              <p className="text-secondary">
                <Spinner animation="border" size="sm" /> Verifying session…
              </p>
            )}

            {!authLoading && (
              <>
                <div className="text-muted small mb-2">
                  Signed in as <b>{username}</b> ({email})
                </div>

                <motion.div
                  whileTap={{ scale: 1.08 }}
                  transition={{ duration: 0.12 }}
                >
                  <Button
                    variant="primary"
                    onClick={() => (window.location.href = "/post/create")}
                  >
                    + Create New Post
                  </Button>
                </motion.div>
              </>
            )}
          </header>

          {/* action 错误提示（edit/delete） */}
          {actionError && (
            <Alert variant="danger" className="py-2">
              {actionError}
            </Alert>
          )}

          {/* 帖子列表 */}
          <Row className="gy-4">
            {posts.map((p) => (
              <Col key={p.id} xs={12}>
                <PostCard
                  post={p}
                  viewerId={userId ?? null}
                  onLike={handleLike}
                  onUnlike={handleUnlike}
                  onFav={handleFav}
                  onUnfav={handleUnfav}
                  onEdit={openEditModal}
                  onDelete={requestDeletePost}
                />
              </Col>
            ))}

            {postsError && <Alert variant="danger">{postsError}</Alert>}
          </Row>

          {/* 分页 & 加载 */}
          <div className="text-center mt-5">
            <div className="d-flex justify-content-center align-items-center gap-3 flex-wrap">
              <motion.div
                whileTap={{ scale: 1.08 }}
                transition={{ duration: 0.12 }}
              >
                <Button
                  variant="dark"
                  disabled={loadingPosts || !hasMore || authLoading}
                  onClick={loadMore}
                >
                  {loadingPosts ? "Loading…" : hasMore ? "Load more" : "No more"}
                </Button>
              </motion.div>

              {!authLoading && posts.length === 0 && !loadingPosts && (
                <motion.div
                  whileTap={{ scale: 1.08 }}
                  transition={{ duration: 0.12 }}
                >
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setPosts([]);
                      setHasMore(true);
                      setTimeout(() => loadMore(), 0);
                    }}
                  >
                    Refresh
                  </Button>
                </motion.div>
              )}

              <div className="text-secondary small">
                Loaded <b>{posts.length}</b> post
                {posts.length !== 1 ? "s" : ""}
                {hasMore ? "" : " (all loaded)"}
              </div>
            </div>
          </div>
        </Container>
      </main>

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

      {/* Cute Delete Modal with 5s countdown */}
      <Modal
        show={!!confirmDeletePost}
        onHide={handleCloseDeleteModal}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete this post?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>🗑️ This will permanently remove the post:</p>
          <p className="fw-semibold">
            “{confirmDeletePost ? confirmDeletePost.title : ""}”
          </p>
          <p className="small text-muted mb-2">
            Hint: Do you really want to say good bye to the post? 🐈‍⬛
          </p>
          <p className="small">
            {deleteButtonEnabled
              ? "If you're sure, click the delete button below."
              : `wait for  ${deleteCountdown}s~ 👀`}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseDeleteModal}
            disabled={deletingPostId !== null}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDeletePost}
            disabled={!deleteButtonEnabled || deletingPostId !== null}
          >
            {deletingPostId !== null ? (
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
    </div>
  );
}
