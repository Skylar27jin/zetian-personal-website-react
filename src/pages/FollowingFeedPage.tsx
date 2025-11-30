// src/pages/FollowingFeedPage.tsx
import React from "react";
import { Container, Alert } from "react-bootstrap";

import Navbar from "../components/Navbar";
import { useMeAuth } from "../hooks/useMeAuth";
import { useFollowingPosts } from "../hooks/useFollowingPosts";
import PostList from "../components/PostList";
import GopherLoader from "../components/GopherLoader";
import type { Post } from "../types/post";
import { likePost, unlikePost, favPost, unfavPost } from "../api/postApi";

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

export default function FollowingFeedPage() {
  const { authLoading, authError, userId: viewerId, username } = useMeAuth();
  const isLoggedIn = !!viewerId && !authError;
  const enabled = !authLoading && isLoggedIn;

  const {
    posts,
    quotedPosts,
    loadingPosts,
    postsError,
    hasMore,
    loadMore,
    setPosts,
    setHasMore,
    setOldestTime,
  } = useFollowingPosts(viewerId ?? null, enabled);

  // 本地更新某个 post 的 helper（和 SchoolFeedPage 一样）
  const updatePostLocal = (postId: number, patch: (p: Post) => Post): void => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? patch(p) : p)));
  };

  const handleLike = async (postId: number) => {
    updatePostLocal(postId, (p) =>
      p.is_liked_by_user
        ? p
        : {
            ...p,
            is_liked_by_user: true,
            like_count: (p.like_count ?? 0) + 1,
          }
    );
    try {
      await likePost(postId);
    } catch {
      updatePostLocal(postId, (p) => ({
        ...p,
        is_liked_by_user: false,
        like_count: Math.max(0, (p.like_count ?? 1) - 1),
      }));
    }
  };

  const handleUnlike = async (postId: number) => {
    updatePostLocal(postId, (p) =>
      !p.is_liked_by_user
        ? p
        : {
            ...p,
            is_liked_by_user: false,
            like_count: Math.max(0, (p.like_count ?? 1) - 1),
          }
    );
    try {
      await unlikePost(postId);
    } catch {
      updatePostLocal(postId, (p) => ({
        ...p,
        is_liked_by_user: true,
        like_count: (p.like_count ?? 0) + 1,
      }));
    }
  };

  const handleFav = async (postId: number) => {
    updatePostLocal(postId, (p) =>
      p.is_fav_by_user
        ? p
        : {
            ...p,
            is_fav_by_user: true,
            fav_count: (p.fav_count ?? 0) + 1,
          }
    );
    try {
      await favPost(postId);
    } catch {
      updatePostLocal(postId, (p) => ({
        ...p,
        is_fav_by_user: false,
        fav_count: Math.max(0, (p.fav_count ?? 1) - 1),
      }));
    }
  };

  const handleUnfav = async (postId: number) => {
    updatePostLocal(postId, (p) =>
      !p.is_fav_by_user
        ? p
        : {
            ...p,
            is_fav_by_user: false,
            fav_count: Math.max(0, (p.fav_count ?? 1) - 1),
          }
    );
    try {
      await unfavPost(postId);
    } catch {
      updatePostLocal(postId, (p) => ({
        ...p,
        is_fav_by_user: true,
        fav_count: (p.fav_count ?? 0) + 1,
      }));
    }
  };

  const handleReportPost = (post: Post) => {
    alert(`Report feature coming soon for post #${post.id}`);
  };

  // 未登录视图
  if (!authLoading && !isLoggedIn) {
    return (
      <PageShell>
        <header className="mb-3">
          <h1 className="fw-bold mb-1">Following Feed</h1>
          <p className="text-muted small mb-0">
            Please log in to see posts from people you follow.
          </p>
        </header>
        <Alert variant="info" className="mt-3">
          You need to sign in to view your following feed.
        </Alert>
      </PageShell>
    );
  }

  // 首屏加载中
  if (loadingPosts && posts.length === 0) {
    return (
      <PageShell>
        <header className="mb-3">
          <h1 className="fw-bold mb-1">Following Feed</h1>
          <p className="text-muted small mb-0">
            Posts from people you follow will appear here.
          </p>
        </header>

        <div className="d-flex justify-content-center py-5">
          <GopherLoader />
        </div>
      </PageShell>
    );
  }

  // 错误 + 无数据
  if (postsError && posts.length === 0) {
    return (
      <PageShell>
        <header className="mb-3">
          <h1 className="fw-bold mb-1">Following Feed</h1>
        </header>

        <Alert variant="danger" className="mt-3">
          {postsError}
        </Alert>
      </PageShell>
    );
  }

  // 正常渲染
  return (
    <PageShell>
      <header className="mb-3">
        <h1 className="fw-bold mb-1">Following Feed</h1>
        <p className="text-muted small mb-0">
          {username
            ? `Hi ${username}, here are the latest posts from people you follow.`
            : "Latest posts from people you follow."}
        </p>
      </header>

      <PostList
        posts={posts}
        loadingPosts={loadingPosts}
        postsError={postsError}
        hasMore={hasMore}
        loadMore={loadMore}
        onRefresh={() => {
          if (!enabled) return;
          // 手动刷新：清空本地 + 游标，重新拉一页
          setPosts([]);
          setHasMore(true);
          setOldestTime(undefined);
          loadMore();
        }}
        canRefresh={enabled}
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
