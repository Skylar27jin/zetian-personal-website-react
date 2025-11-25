// src/hooks/usePersonalPosts.ts
import { useState, useCallback } from "react";
import {
  getPersonalRecentPosts,
  likePost,
  unlikePost,
  favPost,
  unfavPost,
} from "../api/postApi";
import type { Post } from "../types/post";

export function usePersonalPosts(userId: number, enabled: boolean) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [quotedPosts, setQuotedPosts] = useState<Record<number, Post>>({});
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [oldestTime, setOldestTime] = useState<string | undefined>(undefined);

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
    } catch (e: any) {
      setPostsError(e?.message || "Network error");
    } finally {
      setLoadingPosts(false);
    }
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
    [setPosts]
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
    [setPosts]
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
    [setPosts]
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
    [setPosts]
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
