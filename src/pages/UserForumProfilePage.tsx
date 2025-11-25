// src/pages/UserProfilePage.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Container, Button, Spinner, Alert } from "react-bootstrap";
import { motion } from "framer-motion";

import Navbar from "../components/Navbar";
import { useMeAuth } from "../hooks/useMeAuth";
import { usePersonalPosts } from "../hooks/usePersonalPosts";
import { getUser } from "../api/userApi";
import type { GetUserResp } from "../types/user";
import type { Post } from "../types/post";
import GopherLoader from "../components/GopherLoader";
import PostList from "../components/PostList";

// --------------------- 通用壳子 ---------------------
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />
      <main className="flex-grow-1 py-4">
        <Container className="max-w-3xl">{children}</Container>
      </main>
    </div>
  );
}

// --------------------- 页面主体 ---------------------
export default function UserProfilePage() {
  // URL: /user/:id
  const { id } = useParams<{ id: string }>();
  const targetUserId = id ? Number(id) : NaN;

  const { authLoading, authError, userId: viewerId, username } = useMeAuth();

  // URL 参数非法
  if (Number.isNaN(targetUserId)) {
    return (
      <PageShell>
        <Alert variant="danger">Invalid user id in URL.</Alert>
      </PageShell>
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

  const enabled = !userLoading && !userError && profileUser != null;

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
    quotedPosts,
  } = usePersonalPosts(targetUserId, enabled);

  // 用户不存在
  if (!userLoading && userError) {
    return (
      <PageShell>
        <Alert variant="danger">{userError}</Alert>
      </PageShell>
    );
  }

  // 用户信息正在加载 → 显示 gopher
  if (userLoading && posts.length === 0) {
    return (
      <PageShell>
        <header className="mb-4">
          <h1 className="fw-bold">User Profile</h1>
        </header>

        <div className="d-flex justify-content-center py-5">
          <GopherLoader />
        </div>
      </PageShell>
    );
  }

  const isSelf = viewerId === targetUserId;
  const displayName = profileUser?.userName || `User #${targetUserId}`;

  // 帖子首次加载中（用户信息已加载完成）
  if (!userLoading && profileUser && loadingPosts && posts.length === 0) {
    return (
      <PageShell>
        <header className="mb-4">
          <h1 className="fw-bold">
            {isSelf ? "My Public Profile" : `${displayName}'s Posts`}
          </h1>
        </header>

        <div className="d-flex justify-content-center py-5">
          <GopherLoader />
        </div>
      </PageShell>
    );
  }

  // ======= 正常渲染 =======
  return (
    <PageShell>
      {/* Header */}
      <header className="mb-4">
        {/* 第一行：标题 + 小按钮（仅自己时） */}
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
        viewerId={viewerId ?? null}
        enableEdit={false}
        disableLoadMore={!enabled}
        onReport={handleReportPost}
        quotedPosts={quotedPosts}
      />
    </PageShell>
  );
}
