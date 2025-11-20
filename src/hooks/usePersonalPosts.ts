// src/hooks/usePersonalPosts.ts
import { useCallback, useEffect, useState } from "react";
import {
  getPersonalRecentPosts,
  likePost,
  unlikePost,
  favPost,
  unfavPost,
} from "../api/postApi";
import type { Post } from "../types/post";

export function usePersonalPosts(userId: number | null, enabled: boolean) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // ✅ 只自动尝试加载一次
  const [hasTriedInitialLoad, setHasTriedInitialLoad] = useState(false);

  // 当 userId 变化时，重置列表状态（比如从 /users/1 切到 /users/2）
  useEffect(() => {
    setPosts([]);
    setHasMore(true);
    setPostsError(null);
    setHasTriedInitialLoad(false);
  }, [userId]);

  const loadMore = useCallback(async () => {
    if (!enabled) return;
    if (!userId) {
      setPostsError("No user id. Please login first.");
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
        user_id: userId,
        before,
        limit: 10,
      });

      if (!resp.isSuccessful) {
        // ❗失败：只报错，不再自动重试（hasTriedInitialLoad 已经是 true）
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
  }, [enabled, userId, posts, loadingPosts, hasMore]);

  // ✅ 自动加载一次：enabled 变为 true 且没试过，并且当前列表是空的
  useEffect(() => {
    if (!enabled) return;
    if (hasTriedInitialLoad) return;
    if (posts.length > 0) return;

    setHasTriedInitialLoad(true);
    loadMore();
  }, [enabled, hasTriedInitialLoad, posts.length, loadMore]);

  // 辅助函数
  const updatePostState = (postId: number, updates: Partial<Post>) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...updates } : p)));
  };

  const handleLike = async (postId: number) => {
    try {
      const resp = await likePost(postId);
      if (!resp.isSuccessful) {
        alert(resp.errorMessage || "Failed to like");
        return;
      }
      const cur = posts.find((p) => p.id === postId);
      updatePostState(postId, {
        is_liked_by_user: true,
        like_count: (cur?.like_count || 0) + 1,
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
      const cur = posts.find((p) => p.id === postId);
      updatePostState(postId, {
        is_liked_by_user: false,
        like_count: Math.max(0, (cur?.like_count || 1) - 1),
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
      const cur = posts.find((p) => p.id === postId);
      updatePostState(postId, {
        is_fav_by_user: true,
        fav_count: (cur?.fav_count || 0) + 1,
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
      const cur = posts.find((p) => p.id === postId);
      updatePostState(postId, {
        is_fav_by_user: false,
        fav_count: Math.max(0, (cur?.fav_count || 1) - 1),
      });
    } catch (e: any) {
      alert(e?.message || "Network error");
    }
  };

  return {
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
  };
}
