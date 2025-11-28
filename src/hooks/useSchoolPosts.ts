// src/hooks/useSchoolPosts.ts
import { useState, useCallback, useEffect } from "react";
import { getSchoolRecentPosts } from "../api/postApi";
import type { Post } from "../types/post";

/**
 * 每个 schoolId 一份缓存
 */
type SchoolCacheItem = {
  posts: Post[];
  quotedPosts: Record<number, Post>;
  hasMore: boolean;
  oldestTime?: string;
};

const schoolCache = new Map<number, SchoolCacheItem>();

/**
 * 学校级别的 feed（按 school_id 拉帖子）
 */
export function useSchoolPosts(schoolId: number, enabled: boolean) {
  const cached = schoolCache.get(schoolId) || null;

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

  // 同步 state → 缓存
  useEffect(() => {
    if (!enabled || !schoolId) return;
    schoolCache.set(schoolId, {
      posts,
      quotedPosts,
      hasMore,
      oldestTime,
    });
  }, [enabled, schoolId, posts, quotedPosts, hasMore, oldestTime]);

  const loadMore = useCallback(async () => {
    if (!enabled || loadingPosts || !hasMore) return;

    try {
      setLoadingPosts(true);
      setPostsError(null);

      const before =
        posts.length > 0 ? posts[posts.length - 1].created_at : undefined;

      const resp = await getSchoolRecentPosts({
        school_id: schoolId,
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

      // 合并 quoted_posts（如果后端也在 school feed 返回）
      const anyResp = resp as any;
      if (anyResp.quoted_posts) {
        const qp = anyResp.quoted_posts as Record<string, Post>;
        const normalized: Record<number, Post> = {};
        Object.entries(qp).forEach(([k, v]) => {
          const idNum = Number(k);
          if (!Number.isNaN(idNum)) normalized[idNum] = v;
        });

        setQuotedPosts((prev) => ({
          ...prev,
          ...normalized,
        }));
      }

      if (newPosts.length > 0) {
        const last = newPosts[newPosts.length - 1];
        setOldestTime(last.created_at);
      }
    } catch (e: any) {
      setPostsError(e?.message || "Network error");
    } finally {
      setLoadingPosts(false);
    }
  }, [enabled, loadingPosts, hasMore, posts, schoolId]);

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
  };
}
