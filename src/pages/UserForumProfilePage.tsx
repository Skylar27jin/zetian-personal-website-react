// src/pages/UserProfilePage.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";

import Navbar from "../components/Navbar";
import { useMeAuth } from "../hooks/useMeAuth";
import { usePersonalPosts } from "../hooks/usePersonalPosts";
import { getUser } from "../api/userApi";
import type { GetUserResp } from "../types/user";
import GopherLoader from "../components/GopherLoader";
import PostList from "../components/PostList";
import { Post } from "../types/post";
import { motion } from "framer-motion";

export default function UserProfilePage() {
  // URL: /users/:id
  const { id } = useParams<{ id: string }>();
  const targetUserId = id ? Number(id) : NaN;

  const {
    authLoading,
    authError,
    userId: viewerId,
    username,
    } = useMeAuth();

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
  
  const handleReportPost = (post: Post) => {
    alert(`Report feature coming soon for post #${post.id}`);
  };
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
    // 用户信息正在加载 → 显示内容区 gopher
  if (userLoading && posts.length === 0) {
    return (
      <div className="bg-light min-vh-100 d-flex flex-column">
        <Navbar />
        <main className="flex-grow-1 py-4">
          <Container className="max-w-3xl">
            <header className="mb-4">
              <h1 className="fw-bold">User Profile</h1>
            </header>

            <div className="d-flex justify-content-center py-5">
              <GopherLoader />
            </div>
          </Container>
        </main>
      </div>
    );
  }

  const isSelf = viewerId === targetUserId;
  const displayName =
    profileUser?.userName || `User #${targetUserId}`;


    // 帖子首次加载中（用户信息已加载完成）
  if (!userLoading && profileUser && loadingPosts && posts.length === 0) {
    return (
      <div className="bg-light min-vh-100 d-flex flex-column">
        <Navbar />
        <main className="flex-grow-1 py-4">
          <Container className="max-w-3xl">
            <header className="mb-4">
              <h1 className="fw-bold">
                {viewerId === targetUserId
                  ? "My Public Profile"
                  : `${displayName}'s Posts`}
              </h1>
            </header>

            <div className="d-flex justify-content-center py-5">
              <GopherLoader />
            </div>
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
          <header className="mb-4">
            {/* 第一行：标题 + 紧挨着的小按钮（仅自己时） */}
            <div className="d-flex align-items-center gap-2 mb-1">
              <h1 className="fw-bold mb-0">
                {isSelf ? "My Public Profile" : `${displayName}'s Posts`}
              </h1>

              {isSelf && (
                <motion.div
                  whileTap={{ scale: 1.05 }}
                  transition={{ duration: 0.12 }}
                >
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="py-0 px-2 small-button"
                    onClick={() => (window.location.href = "/me")}
                  >
                    Back to My Forum
                  </Button>
                </motion.div>
              )}
            </div>

            {/* 第二行：下面的小说明文字 / loading */}
            {(authLoading || userLoading) && (
              <p className="text-secondary mb-0">
                <Spinner animation="border" size="sm" /> Loading…
              </p>
            )}

            {!authLoading && !userLoading && (
              <p className="text-muted small mb-0">
                {isSelf ? (
                  "You are viewing your own public posts."
                ) : authError ? (
                  `You are viewing ${displayName}'s posts as a guest.`
                ) : (
                  `You are viewing ${displayName}'s posts as ${username}.`
                )}
              </p>
            )}
          </header>

          {/* 帖子列表 */}
          <PostList
            posts={posts}
            loadingPosts={loadingPosts}
            postsError={postsError}
            hasMore={hasMore}
            loadMore={loadMore}
            onRefresh={() => {
              setPosts([]);
              setHasMore(true);
              setTimeout(() => loadMore(), 0);
            }}
            canRefresh={!authLoading && !userLoading && enabled}

            onLike={handleLike}
            onUnlike={handleUnlike}
            onFav={handleFav}
            onUnfav={handleUnfav}

            // 当前 viewer（可能是自己，也可能是别人，或未登录）
            viewerId={viewerId ?? null}

            // ❗ 这里我们先不开放编辑入口
            enableEdit={false}
            disableLoadMore={!enabled}

            // ✅ 所有人都可以举报别人（具体行为我们先用 alert 占坑）
            onReport={handleReportPost}
          />



        </Container>
      </main>
    </div>



  );
  
}
