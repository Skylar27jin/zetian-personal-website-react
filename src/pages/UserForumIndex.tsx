import React, { useEffect, useState, useCallback } from "react";
import { me } from "../api/meApi";
import {
  getPersonalRecentPosts,
  likePost,
  unlikePost,
  favPost,
  unfavPost,
} from "../api/postApi";

import type { Post } from "../types/post";

import Navbar from "../components/Navbar";

import { Container, Row, Col, Card, Button, Spinner, Alert } from "react-bootstrap";
import { motion } from "framer-motion";

const LS_KEYS = {
  userId: "me:id",
  email: "me:email",
  username: "me:username",
} as const;

function saveMeToLocalStorage(id: number, email: string, username: string) {
  localStorage.setItem(LS_KEYS.userId, String(id));
  localStorage.setItem(LS_KEYS.email, email);
  localStorage.setItem(LS_KEYS.username, username);
}

function readUserId(): number | null {
  const v = localStorage.getItem(LS_KEYS.userId);
  return v ? Number(v) : null;
}

export default function UserForumIndex() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // ---------- 验证用户 ----------
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await me();
        if (!mounted) return;
        if (resp.is_successful) {
          saveMeToLocalStorage(resp.id, resp.email, resp.username);
          setAuthError(null);
        } else {
          setAuthError(resp.error_message || "Unauthorized");
        }
      } catch (e: any) {
        setAuthError(e?.message || "Failed to call /me");
      } finally {
        setAuthLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ---------- 拉取帖子 ----------
  const loadMore = useCallback(async () => {
    const uid = readUserId();
    if (!uid) {
      setPostsError("No user id in localStorage. Please login first.");
      return;
    }
    if (loadingPosts || !hasMore) return;

    setLoadingPosts(true);
    setPostsError(null);

    const before =
      posts.length > 0
        ? posts[posts.length - 1].created_at
        : new Date().toISOString();

    try {
      const resp = await getPersonalRecentPosts({
        user_id: uid,
        before,
        limit: 10,
      });

      if (!resp.isSuccessful) {
        setPostsError(resp.errorMessage || "Fetch failed");
        setHasMore(false);
        return;
      }

      const list = resp.posts ?? [];
      setPosts((prev) => [...prev, ...list]);
      if (list.length < 10) setHasMore(false);
    } catch (e: any) {
      setPostsError(e?.message || "Network error");
    } finally {
      setLoadingPosts(false);
    }
  }, [posts, loadingPosts, hasMore]);

  useEffect(() => {
    if (!authLoading && !authError && posts.length === 0) {
      loadMore();
    }
  }, [authLoading, authError, posts.length, loadMore]);

  const username = localStorage.getItem(LS_KEYS.username) || "";
  const email = localStorage.getItem(LS_KEYS.email) || "";

  // ---------- 操作函数 ----------
  const updatePostState = (
    postId: number,
    updates: Partial<Post>
  ) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, ...updates } : p))
    );
  };

  const handleLike = async (postId: number) => {
    try {
      const resp = await likePost(postId);
      if (!resp.isSuccessful) {
        alert(resp.errorMessage || "Failed to like");
        return;
      }
      updatePostState(postId, {
        is_liked_by_user: true,
        like_count: (posts.find((p) => p.id === postId)?.like_count || 0) + 1,
      });
    } catch (e: any) {
      alert(e?.message || "Network error");
    }
  };

  const handleUnlike = async (postId: number) => {
    try {
      const resp = await unlikePost(postId);
      if (!resp.isSuccessful) {
        alert(resp.errorMessage || "Failed to unlike");
        return;
      }
      updatePostState(postId, {
        is_liked_by_user: false,
        like_count: (posts.find((p) => p.id === postId)?.like_count || 1) - 1,
      });
    } catch (e: any) {
      alert(e?.message || "Network error");
    }
  };

  const handleFav = async (postId: number) => {
    try {
      const resp = await favPost(postId);
      if (!resp.isSuccessful) {
        alert(resp.errorMessage || "Failed to favorite");
        return;
      }
      updatePostState(postId, {
        is_fav_by_user: true,
        fav_count: (posts.find((p) => p.id === postId)?.fav_count || 0) + 1,
      });
    } catch (e: any) {
      alert(e?.message || "Network error");
    }
  };

  const handleUnfav = async (postId: number) => {
    try {
      const resp = await unfavPost(postId);
      if (!resp.isSuccessful) {
        alert(resp.errorMessage || "Failed to unfavorite");
        return;
      }
      updatePostState(postId, {
        is_fav_by_user: false,
        fav_count: (posts.find((p) => p.id === postId)?.fav_count || 1) - 1,
      });
    } catch (e: any) {
      alert(e?.message || "Network error");
    }
  };

  function formatTime(isoString: string): string {
    try {
      const date = new Date(isoString);
      // 格式化为 YYYY-MM-DD HH:mm:ss
      return date.toISOString().slice(0, 19).replace("T", " ");
    } catch {
      return isoString;
    }
  }

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

          {!authLoading && authError && (
            <Alert variant="danger">Auth failed: {authError}</Alert>
          )}

          {!authLoading && !authError && (
            <>
              <div className="text-muted small mb-2">
                Signed in as <b>{username}</b> ({email})
              </div>

              {/* Create New Post 按钮加动画 */}
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

        {/* 帖子列表 */}
        <Row className="gy-4">
          {posts.map((p) => (
            <Col key={p.id} xs={12}>
              <Card className="shadow-sm border-0">
                <Card.Body>
                  <Card.Title className="fw-semibold">{p.title}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted small">
                    🏫 {p.school_name} · 👁 {p.view_count} · 📅{" "}
                    {formatTime(p.created_at)}
                  </Card.Subtitle>
                  <Card.Text>{p.content}</Card.Text>

                  <hr />

                  <Row className="align-items-center text-muted small">
                    <Col xs="auto">
                      👍 {p.like_count} · ⭐ {p.fav_count}
                    </Col>

                    <Col className="text-end">
                      <div className="d-inline-flex gap-3">
                        {/* Like：点击切换 like / unlike */}
                        <motion.div
                          whileTap={{ scale: 1.15 }}
                          transition={{ duration: 0.12 }}
                        >
                          <Button
                            size="sm"
                            variant={
                              p.is_liked_by_user
                                ? "primary"
                                : "outline-secondary"
                            }
                            onClick={() =>
                              p.is_liked_by_user
                                ? handleUnlike(p.id)
                                : handleLike(p.id)
                            }
                          >
                            {p.is_liked_by_user ? "💙 Liked" : "👍 Like"}
                          </Button>
                        </motion.div>

                        {/* Fav：点击切换 fav / unfav */}
                        <motion.div
                          whileTap={{ scale: 1.15 }}
                          transition={{ duration: 0.12 }}
                        >
                          <Button
                            size="sm"
                            variant={
                              p.is_fav_by_user
                                ? "warning"
                                : "outline-secondary"
                            }
                            onClick={() =>
                              p.is_fav_by_user
                                ? handleUnfav(p.id)
                                : handleFav(p.id)
                            }
                          >
                            {p.is_fav_by_user ? "🌟 Favorited" : "⭐ Fav"}
                          </Button>
                        </motion.div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          ))}

          {postsError && <Alert variant="danger">{postsError}</Alert>}
        </Row>

        {/* 分页 & 加载 */}
        <div className="text-center mt-5">
          <div className="d-flex justify-content-center align-items-center gap-3 flex-wrap">
            {/* Load more 按钮加动画 */}
            <motion.div
              whileTap={{ scale: 1.08 }}
              transition={{ duration: 0.12 }}
            >
              <Button
                variant="dark"
                disabled={loadingPosts || !hasMore || !!authError}
                onClick={loadMore}
              >
                {loadingPosts
                  ? "Loading…"
                  : hasMore
                  ? "Load more"
                  : "No more"}
              </Button>
            </motion.div>

            {/* Refresh 按钮加动画 */}
            {!authLoading &&
              !authError &&
              posts.length === 0 &&
              !loadingPosts && (
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
  </div>
);

}