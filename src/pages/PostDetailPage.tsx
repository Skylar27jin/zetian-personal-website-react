// src/pages/PostDetailPage.tsx

import RichContent from "../components/RichContent";
import Editor from "../components/Editor";
import React, { useEffect, useState} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Spinner,
  Alert,
  Button,
  Modal,
  Form,
  Badge,
  Dropdown,
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

import { Link } from "react-router-dom";
import { getUser } from "../api/userApi";
import GopherLoader from "../components/GopherLoader";
import PostMediaDisplay from "../components/PostMediaDisplay";
import ScrollablePanel from "../components/ScrollPanel";


function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).replace(",", "");
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


  // ========= reply_to 原帖信息 =========
  interface ParentMeta {
    post: Post;
    authorName?: string;
  }

  const [parentMeta, setParentMeta] = useState<ParentMeta | null>(null);
  const [parentLoading, setParentLoading] = useState(false);
  const [parentExpanded, setParentExpanded] = useState(false);

  const MAX_PARENT_LINES = 3;



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


  // if 当前 post 有 reply_to 时，懒加载原帖信息
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

        // 2) 顺手拉一下作者名（失败就算了，用 user_id 兜底）
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
                  {" "}
                  <Link
                    to={`/user/${post.user_id}`}
                    className="text-decoration-none"
                    style={{ fontWeight: 500 }}
                  >
                    {post.user_name ? `@${post.user_name}` : `User #${post.user_id}`}
                  </Link>
                  {" · "}
                  {formatTime(post.created_at)}
                  {" · "}
                  {post.school_name}
                  {post.location && <> ·  {post.location}</>}
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

                {/* media：多图轮播 */}
                {post.media_type !== "text" &&
                  post.media_urls &&
                  post.media_urls.length > 0 && (
                    <PostMediaDisplay
                      mediaType={post.media_type}
                      mediaUrls={post.media_urls}
                    />
                )}


              {/* 正文：可滚动 + 进度条 */}
              <ScrollablePanel maxHeight="70vh">
                <RichContent content={post.content} />
              </ScrollablePanel>


               {/* 底部统计 + 操作区 */}
              <hr className="my-4" />

              <div className="d-flex align-items-center text-muted small">

                {/* 左侧统计 */}
                <div>
                  💬 {post.comment_count} · 🔁 {post.share_count} · 👁 {post.view_count}
                </div>

                {/* 右侧按钮组 —— 用 ms-auto 推到最右边 */}
                <div className="d-inline-flex gap-2 ms-auto align-items-center">

                  {/* Like */}
                  <motion.div whileTap={{ scale: 1.08 }}>
                    <Button
                      size="sm"
                      variant={post.is_liked_by_user ? "primary" : "outline-secondary"}
                      onClick={() =>
                        post.is_liked_by_user ? handleUnlike(post.id) : handleLike(post.id)
                      }
                    >
                      {post.is_liked_by_user ? "💙" : "👍"} {post.like_count}
                    </Button>
                  </motion.div>

                  {/* Fav */}
                  <motion.div whileTap={{ scale: 1.08 }}>
                    <Button
                      size="sm"
                      variant={post.is_fav_by_user ? "warning" : "outline-secondary"}
                      onClick={() =>
                        post.is_fav_by_user ? handleUnfav(post.id) : handleFav(post.id)
                      }
                    >
                      {post.is_fav_by_user ? "🌟" : "⭐"} {post.fav_count}
                    </Button>
                  </motion.div>

                  {/* 三点菜单 */}
                  {isOwner && (
                    <Dropdown align="end">
                      <Dropdown.Toggle
                        as="span"
                        bsPrefix="post-detail-toggle"
                        className="text-muted"
                        style={{
                          cursor: "pointer",
                          padding: "2px 6px",
                          fontSize: "20px",
                          lineHeight: "1",
                          background: "none",
                          border: "none",
                          boxShadow: "none",
                        }}
                      >
                        ...
                      </Dropdown.Toggle>

                      <Dropdown.Menu>
                        <Dropdown.Item onClick={openEditModal}>
                          ✏️ Edit
                        </Dropdown.Item>
                        <Dropdown.Item
                          className="text-danger"
                          onClick={handleDeletePost}
                          disabled={deleting}
                        >
                          🗑 Delete
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  )}
                </div>
              </div>


                {/* 如果是 reply 帖，展示原帖预览 */}
                {post.reply_to && (
                <div className="mb-3">

                    <Link
                    to={`/post/${post.reply_to}`}
                    className="text-decoration-none text-reset"
                    >
                    <div
                        className="p-3 rounded-3"
                        style={{
                        backgroundColor: "#f5f5f5",
                        borderLeft: "3px solid #d0d0d0",
                        }}
                    >
                        {parentLoading && !parentMeta && (
                          <div className="text-muted small d-flex align-items-center gap-2">
                            <GopherLoader size={40} />
                            <span>Loading original post…</span>
                          </div>
                        )}
                        <div className="text-muted small mb-1 text-uppercase">
                            Replying to
                        </div>
                        {!parentLoading && parentMeta && (
                        <>
                            {/* 作者 + 时间 */}
                            <div className="d-flex justify-content-between align-items-center mb-1">
                            <div className="fw-semibold">
                                {parentMeta.authorName
                                ? `@${parentMeta.authorName}`
                                : `User #${parentMeta.post.user_id}`}
                            </div>
                            <div className="text-muted small">
                                {formatTime(parentMeta.post.created_at)}
                            </div>
                            </div>

                            {/* 标题 */}
                            <div className="fw-semibold mb-1">
                            {parentMeta.post.title}
                            </div>

                            {/* 正文（最多 3 行，可展开） */}
                            <div className="text-muted" style={{ fontSize: "0.9rem" }}>
                              {parentExpanded ? (
                                <RichContent content={parentMeta.post.content || ""} />
                              ) : (
                                <RichContent content={parentMeta.post.content || ""} clampLines={MAX_PARENT_LINES} />
                              )}
                            </div>

                            {/* 展开/收起按钮 */}
                            {(() => {
                              const full = parentMeta.post.content || "";
                              const isLong = full.split("\n").length > MAX_PARENT_LINES;
                              return (
                                isLong && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 mt-1"
                                    onClick={(e) => {
                                      e.preventDefault(); // 不触发 Link 跳转
                                      setParentExpanded((v) => !v);
                                    }}
                                  >
                                    {parentExpanded ? "Show less" : "Show full original post"}
                                  </Button>
                                )
                              );
                            })()}


                            {(() => {
                            const full = parentMeta.post.content || "";
                            const lines = full.split("\n");
                            const isLong = lines.length > MAX_PARENT_LINES;

                            return (
                                isLong && (
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 mt-1"
                                    onClick={(e) => {
                                    e.preventDefault(); // 展开时不要触发 Link 跳转
                                    setParentExpanded((v) => !v);
                                    }}
                                >
                                    {parentExpanded ? "Show less" : "Show full original post"}
                                </Button>
                                )
                            );
                            })()}
                        </>
                        )}

                        {/* 原帖没拉到的兜底文案 */}
                        {!parentLoading && !parentMeta && (
                        <div className="text-muted small fst-italic">
                            Original post not found (maybe deleted).
                        </div>
                        )}
                    </div>
                    </Link>
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


