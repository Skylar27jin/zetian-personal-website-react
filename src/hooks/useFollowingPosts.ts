// src/hooks/useFollowingPosts.ts
import { useState, useCallback, useEffect } from "react";
import { getFollowingUsersRecentPosts } from "../api/postApi";
import type { Post } from "../types/post";

// ------------------- 模块级缓存：跨路由切换保留 -------------------
type FollowingCache = {
  viewerId: number;
  posts: Post[];
  quotedPosts: Record<number, Post>;
  hasMore: boolean;
  oldestTime?: string;
};

let followingCache: FollowingCache | null = null;

// ------------------- Hook 本体 -------------------
export function useFollowingPosts(
  viewerId: number | null,
  enabled: boolean,
  pageSize = 10
) {
  const cacheKey = viewerId ?? 0;

  // 初始化时看看缓存是不是当前这个 viewer
  const cached =
    followingCache && followingCache.viewerId === cacheKey
      ? followingCache
      : null;

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
    if (!enabled || !viewerId) return;
    followingCache = {
      viewerId,
      posts,
      quotedPosts,
      hasMore,
      oldestTime,
    };
  }, [enabled, viewerId, posts, quotedPosts, hasMore, oldestTime]);

  const loadMore = useCallback(async () => {
    if (!enabled || !viewerId || loadingPosts || !hasMore) return;

    try {
      setLoadingPosts(true);
      setPostsError(null);

      const resp = await getFollowingUsersRecentPosts({
        before: oldestTime,
        limit: pageSize,
      });

      if (!resp.isSuccessful) {
        setPostsError(resp.errorMessage || "Failed to load following feed.");
        setHasMore(false);
        return;
      }

      const newPosts = resp.posts || [];
      setPosts((prev) => [...prev, ...newPosts]);

      // 合并 quoted_posts（thrift: map<i64, Post> -> JSON: { "123": Post }）
      const rawQuoted = resp.quoted_posts || {};
      setQuotedPosts((prev) => {
        const next = { ...prev };
        Object.entries(rawQuoted).forEach(([idStr, p]) => {
          const idNum = Number(idStr);
          if (!Number.isNaN(idNum)) {
            next[idNum] = p as Post;
          }
        });
        return next;
      });

      // 更新游标：优先用后端返回的 next_cursor
      const nextCursor =
        resp.next_cursor ||
        (newPosts.length > 0
          ? newPosts[newPosts.length - 1].created_at
          : oldestTime);

      setOldestTime(nextCursor);

      // has_more：如果后端没给，就用“本页数量是否达到 pageSize”兜底
      const moreFlag =
        resp.has_more !== undefined && resp.has_more !== null
          ? resp.has_more
          : newPosts.length >= pageSize;

      setHasMore(moreFlag);
    } catch (e: any) {
      setPostsError(
        e?.message || "Network error while loading following feed."
      );
    } finally {
      setLoadingPosts(false);
    }
  }, [enabled, viewerId, loadingPosts, hasMore, oldestTime, pageSize]);

  // enabled 为 true 且当前没有任何 posts 时，自动拉首屏
  useEffect(() => {
    if (!enabled || !viewerId) return;
    if (posts.length > 0) return; // 已有缓存，不重复拉首屏
    if (loadingPosts || !hasMore) return;

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadMore();
  }, [enabled, viewerId, posts.length, hasMore, loadingPosts, loadMore]);

  return {
    posts,
    quotedPosts,
    loadingPosts,
    postsError,
    hasMore,
    oldestTime,
    loadMore,
    setPosts,
    setHasMore,
    setOldestTime,
  };
}
