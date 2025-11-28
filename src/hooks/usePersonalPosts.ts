// src/hooks/usePersonalPosts.ts
import { useState, useCallback, useEffect } from "react";
import {
  getPersonalRecentPosts,
  likePost,
  unlikePost,
  favPost,
  unfavPost,
} from "../api/postApi";
import type { Post } from "../types/post";

// ------------------- 模块级缓存：跨路由切换保留 -------------------
type PersonalCache = {
  userId: number;
  posts: Post[];
  quotedPosts: Record<number, Post>;
  hasMore: boolean;
  oldestTime?: string;
};

let personalCache: PersonalCache | null = null;

// ------------------- Hook 本体 -------------------
export function usePersonalPosts(userId: number, enabled: boolean) {
  // 初始化时，看看缓存里是不是当前这个 user
  const cached =
    personalCache && personalCache.userId === userId ? personalCache : null;

  const [posts, setPosts] = useState<Post[]>(() => cached?.posts ?? []);
  const [quotedPosts, setQuotedPosts] = useState<Record<number, Post>>(
    () => cached?.quotedPosts ?? {}
  );
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(() => cached?.hasMore ?? true);
  const [oldestTime, setOldestTime] = useState<string | undefined>(
    () => cached?.oldestTime
  );

  // 每次 state 变化时，同步一份到模块级缓存里
  useEffect(() => {
    if (!enabled || !userId) return;
    personalCache = {
      userId,
      posts,
      quotedPosts,
      hasMore,
      oldestTime,
    };
  }, [enabled, userId, posts, quotedPosts, hasMore, oldestTime]);

  const loadMore = useCallback(async () => {
    if (!enabled || loadingPosts || !hasMore) return;

    try {
      setLoadingPosts(true);
      setPostsError(null);

      const before =
        posts.length > 0 ? posts[posts.length - 1].created_at : undefined;

      const resp = await getPersonalRecentPosts({
        user_id: userId,
        before,
        limit: 10,
      });

      if (!resp.isSuccessful) {
        setPostsError(resp.errorMessage || "Failed to load posts");
        return;
      }

      const newPosts = resp.posts || [];
      if (newPosts.length === 0) {
        setHasMore(false);
        return;
      }

      setPosts((prev) => [...prev, ...newPosts]);

      if (resp.quoted_posts) {
        setQuotedPosts((prev) => ({
          ...prev,
          ...resp.quoted_posts,
        }));
      }

      // 你目前没用 oldestTime，这里先简单记录一下（可选）
      if (newPosts.length > 0) {
        const last = newPosts[newPosts.length - 1];
        setOldestTime(last.created_at);
      }
    } catch (e: any) {
      setPostsError(e?.message || "Network error");
    } finally {
      setLoadingPosts(false);
    }
    // 注意：这里的 posts.length 仍然在 deps 里，用来判断 before；
    // 具体值通过 setPosts 的函数式更新保证正确。
  }, [enabled, loadingPosts, hasMore, posts.length, userId]);

  // ========= 点赞 / 取消点赞 / 收藏 / 取消收藏 =========

  const handleLike = useCallback(
    async (postId: number) => {
      // 乐观更新
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                is_liked_by_user: true,
                like_count: (p.like_count ?? 0) + 1,
              }
            : p
        )
      );

      try {
        const resp = await likePost(postId);
        if (!resp.isSuccessful) {
          throw new Error(resp.errorMessage || "Like failed");
        }
      } catch {
        // 回滚
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  is_liked_by_user: false,
                  like_count: Math.max((p.like_count ?? 1) - 1, 0),
                }
              : p
          )
        );
      }
    },
    []
  );

  const handleUnlike = useCallback(
    async (postId: number) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                is_liked_by_user: false,
                like_count: Math.max((p.like_count ?? 1) - 1, 0),
              }
            : p
        )
      );

      try {
        const resp = await unlikePost(postId);
        if (!resp.isSuccessful) {
          throw new Error(resp.errorMessage || "Unlike failed");
        }
      } catch {
        // 回滚
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  is_liked_by_user: true,
                  like_count: (p.like_count ?? 0) + 1,
                }
              : p
          )
        );
      }
    },
    []
  );

  const handleFav = useCallback(
    async (postId: number) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                is_fav_by_user: true,
                fav_count: (p.fav_count ?? 0) + 1,
              }
            : p
        )
      );

      try {
        const resp = await favPost(postId);
        if (!resp.isSuccessful) {
          throw new Error(resp.errorMessage || "Fav failed");
        }
      } catch {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  is_fav_by_user: false,
                  fav_count: Math.max((p.fav_count ?? 1) - 1, 0),
                }
              : p
          )
        );
      }
    },
    []
  );

  const handleUnfav = useCallback(
    async (postId: number) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                is_fav_by_user: false,
                fav_count: Math.max((p.fav_count ?? 1) - 1, 0),
              }
            : p
        )
      );

      try {
        const resp = await unfavPost(postId);
        if (!resp.isSuccessful) {
          throw new Error(resp.errorMessage || "Unfav failed");
        }
      } catch {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  is_fav_by_user: true,
                  fav_count: (p.fav_count ?? 0) + 1,
                }
              : p
          )
        );
      }
    },
    []
  );

  return {
    posts,
    quotedPosts,
    loadingPosts,
    postsError,
    hasMore,
    loadMore,
    setPosts,
    setHasMore,

    handleLike,
    handleUnlike,
    handleFav,
    handleUnfav,
  };
}
