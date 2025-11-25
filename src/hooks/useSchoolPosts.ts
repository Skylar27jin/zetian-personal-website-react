import { useState, useCallback } from "react";
import { getSchoolRecentPosts } from "../api/postApi";
import type { Post } from "../types/post";

/**
 * 学校级别的 feed（按 school_id 拉帖子）
 */
export function useSchoolPosts(schoolId: number, enabled: boolean) {
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
