// src/pages/UserForumIndex.tsx
import { useEffect, useState } from "react";
import { Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import { motion } from "framer-motion";

import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import { useMeAuth } from "../hooks/useMeAuth";
import { usePersonalPosts } from "../hooks/usePersonalPosts";


export default function MyForumProfilePage() {
  const { authLoading, authError, userId, username, email } = useMeAuth();

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
  } = usePersonalPosts(userId, !authLoading && !authError);

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
              <motion.div whileTap={{ scale: 1.08 }} transition={{ duration: 0.12 }}>
                <Button variant="primary" onClick={() => (window.location.href = "/login")}>
                  Go to Login
                </Button>
              </motion.div>
            </header>
          </Container>
        </main>
      </div>
    );
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

            {!authLoading && (
              <>
                <div className="text-muted small mb-2">
                  Signed in as <b>{username}</b> ({email})
                </div>

                <motion.div whileTap={{ scale: 1.08 }} transition={{ duration: 0.12 }}>
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
                <PostCard
                  post={p}
                  onLike={handleLike}
                  onUnlike={handleUnlike}
                  onFav={handleFav}
                  onUnfav={handleUnfav}
                />
              </Col>
            ))}

            {postsError && <Alert variant="danger">{postsError}</Alert>}
          </Row>


          {/* 分页 & 加载 */}
          <div className="text-center mt-5">
            <div className="d-flex justify-content-center align-items-center gap-3 flex-wrap">
              <motion.div whileTap={{ scale: 1.08 }} transition={{ duration: 0.12 }}>
                <Button
                  variant="dark"
                  disabled={loadingPosts || !hasMore || authLoading}
                  onClick={loadMore}
                >
                  {loadingPosts ? "Loading…" : hasMore ? "Load more" : "No more"}
                </Button>
              </motion.div>

              {!authLoading && posts.length === 0 && !loadingPosts && (
                <motion.div whileTap={{ scale: 1.08 }} transition={{ duration: 0.12 }}>
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
