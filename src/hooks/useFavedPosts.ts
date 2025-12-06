// src/hooks/useFavedPosts.ts
import { useState, useCallback, useEffect } from "react";
import { getFavedPosts } from "../api/postApi";
import type { Post } from "../types/post";

export function useFavedPosts(userId: number, enabled: boolean, pageSize = 10) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [quotedPosts, setQuotedPosts] = useState<Record<number, Post>>({});
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  useEffect(() => {
    setPosts([]);
    setQuotedPosts({});
    setPostsError(null);
    setHasMore(true);
    setCursor(undefined);
  }, [userId, enabled]);

  const loadMore = useCallback(async () => {
    if (!enabled || loadingPosts || !hasMore) return;

    try {
      setLoadingPosts(true);
      setPostsError(null);

      const resp = await getFavedPosts({
        user_id: userId,
        before: cursor,
        limit: pageSize,
      });

      if (!resp.isSuccessful) {
        setPostsError(resp.errorMessage || "Failed to load favorited posts");
        setHasMore(false);
        return;
      }

      setPosts((prev) => [...prev, ...(resp.posts || [])]);

    if (resp.quoted_posts) {
        const quoted = resp.quoted_posts as Record<string, Post>;

        setQuotedPosts((prev) => ({
            ...prev,
            ...Object.fromEntries(
            Object.entries(quoted).map(([k, v]) => [Number(k), v])
            ),
        }));
    }

      setCursor(resp.next_cursor ?? undefined);
      setHasMore(resp.has_more ?? false);
    } catch (e: any) {
      setPostsError(e?.message || "Network error while loading favorited posts");
    } finally {
      setLoadingPosts(false);
    }
  }, [enabled, loadingPosts, hasMore, cursor, userId, pageSize]);

  return {
    posts,
    quotedPosts,
    loadingPosts,
    postsError,
    hasMore,
    loadMore,
    setPosts,
    setHasMore,
  };
}