// src/pages/UserProfilePage.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import { motion } from "framer-motion";

import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import { useMeAuth } from "../hooks/useMeAuth";
import { usePersonalPosts } from "../hooks/usePersonalPosts";
import { getUser } from "../api/userApi";
import type { GetUserResp } from "../types/user";

export default function UserProfilePage() {
  // URL: /users/:id
  const { id } = useParams<{ id: string }>();
  const targetUserId = id ? Number(id) : NaN;

  const { authLoading, authError, userId: viewerId } = useMeAuth();

  // URL 参数本身非法，直接返回错误页，不要再调接口了
  if (Number.isNaN(targetUserId)) {
    return (
      <div className="bg-light min-vh-100 d-flex flex-column">
        <Navbar />
        <main className="flex-grow-1 py-4">
          <Container className="max-w-3xl">
            <Alert variant="danger">Invalid user id in URL.</Alert>
          </Container>
        </main>
      </div>
    );
  }

  // 被访问的这个用户的信息
  const [profileUser, setProfileUser] = useState<GetUserResp | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);

  // 先调用 /user/get，确认这个人存在，并拿到 userName
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setUserLoading(true);
      setUserError(null);
      try {
        const resp = await getUser({ id: targetUserId });
        if (cancelled) return;

        if (!resp.isSuccessful) {
          setUserError(resp.errorMessage || "User not found");
          setProfileUser(null);
        } else {
          setProfileUser(resp);
        }
      } catch (e: any) {
        if (cancelled) return;
        setUserError(e?.message || "Network error");
        setProfileUser(null);
      } finally {
        if (!cancelled) {
          setUserLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [targetUserId]);

  // 只有在：用户存在 + user 请求完成 时，才去拉帖子
  const enabled =
    !userLoading &&
    !userError &&
    profileUser != null;

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
  } = usePersonalPosts(targetUserId, enabled);

  

  // 用户不存在 / /user/get 失败
  if (!userLoading && userError) {
    return (
      <div className="bg-light min-vh-100 d-flex flex-column">
        <Navbar />
        <main className="flex-grow-1 py-4">
          <Container className="max-w-3xl">
            <Alert variant="danger">{userError}</Alert>
          </Container>
        </main>
      </div>
    );
  }

  const isSelf = viewerId === targetUserId;
  const displayName =
    profileUser?.userName || `User #${targetUserId}`;

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />

      <main className="flex-grow-1 py-4">
        <Container className="max-w-3xl">
          {/* Header */}
          <header className="mb-4">
            <h1 className="fw-bold">
              {isSelf ? "My Public Profile" : `${displayName}'s Posts`}
            </h1>

            {(authLoading || userLoading) && (
              <p className="text-secondary">
                <Spinner animation="border" size="sm" /> Loading…
              </p>
            )}

            {!authLoading && !userLoading && (
              <p className="text-muted small mb-0">
                {isSelf
                  ? "You are viewing your own public posts."
                  : `You are viewing ${displayName}'s posts.`}
              </p>
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
                  disabled={loadingPosts || !hasMore || !enabled}
                  onClick={loadMore}
                >
                  {loadingPosts ? "Loading…" : hasMore ? "Load more" : "No more"}
                </Button>
              </motion.div>

              {!authLoading &&
                !userLoading &&
                posts.length === 0 &&
                !loadingPosts &&
                enabled && (
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
