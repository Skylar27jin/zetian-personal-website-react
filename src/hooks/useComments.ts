// src/hooks/useComments.ts
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createComment,
  deleteComment,
  listCommentReplies,
  listPostCommentThreads,
} from "../api/commentApi";
import type { Comment, CommentThread } from "../types/comment";
import { CommentOrder } from "../types/comment";

const BASE_URL = import.meta.env.VITE_HERTZ_BASE_URL;

/** ============ local cache (module-level) ============ */
type RepliesState = {
  items: Comment[];
  next_cursor: string | null;
  has_more: boolean;
  loading: boolean;
  error: string | null;
};

type CacheEntry = {
  threads: CommentThread[];
  nextCursor: string | null;
  hasMore: boolean;
  repliesMap: Record<number, RepliesState>;
  // 可选：以后做 TTL
  updatedAt: number;
};

const commentCache = new Map<number, CacheEntry>();

/** ============ helpers ============ */
function makeCursorFromLast(list: Comment[]): string | null {
  if (!list || list.length === 0) return null;
  const last = list[list.length - 1] as any;
  if (!last?.created_at || !last?.id) return null;
  return `${last.created_at}|${last.id}`;
}

function emptyRepliesState(): RepliesState {
  return { items: [], next_cursor: null, has_more: false, loading: false, error: null };
}

function initRepliesStateFromThread(t: CommentThread): RepliesState {
  const preview = t.replies_preview ?? [];
  return {
    items: preview,
    next_cursor: makeCursorFromLast(preview),
    has_more: (t.root?.reply_count ?? 0) > preview.length,
    loading: false,
    error: null,
  };
}

function getLikedByViewer(c: Comment): boolean {
  return Boolean((c as any).liked_by_viewer);
}

function setLikedByViewer(c: Comment, liked: boolean): Comment {
  const curCount = (c as any).like_count ?? 0;
  const nextCount = Math.max(0, curCount + (liked ? 1 : -1));
  return { ...(c as any), like_count: nextCount, liked_by_viewer: liked } as any;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${url} failed with status ${res.status}`);
  return (await res.json()) as T;
}

type LikeResp = { isSuccessful: boolean; errorMessage?: string };

/** ============ hook ============ */
export function useComments(postId: number) {
  const THREAD_PAGE_SIZE = 20;
  const REPLIES_PREVIEW_LIMIT = 2;
  const REPLIES_PAGE_SIZE = 20;

  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [threadsErr, setThreadsErr] = useState<string | null>(null);

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const [repliesMap, setRepliesMap] = useState<Record<number, RepliesState>>({});
  const likeLoadingRef = useRef<Record<number, boolean>>({});

  const cacheKey = useMemo(() => postId, [postId]);

  // 读 cache + 若无 cache 则拉首屏
  useEffect(() => {
    setThreadsErr(null);

    const cached = commentCache.get(cacheKey);
    if (cached) {
      setThreads(cached.threads);
      setNextCursor(cached.nextCursor);
      setHasMore(cached.hasMore);
      setRepliesMap(cached.repliesMap);
      return; // 命中缓存，直接用
    }

    // 无缓存：拉首屏
    refresh(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  // 写 cache（任何 state 变化就覆盖）
  useEffect(() => {
    if (!postId) return;
    commentCache.set(cacheKey, {
      threads,
      nextCursor,
      hasMore,
      repliesMap,
      updatedAt: Date.now(),
    });
  }, [cacheKey, postId, threads, nextCursor, hasMore, repliesMap]);

  const refresh = async (resetCursor: boolean) => {
    if (!postId) return;
    setLoadingThreads(true);
    setThreadsErr(null);

    try {
      const resp = await listPostCommentThreads({
        post_id: postId,
        cursor: resetCursor ? "" : (nextCursor ?? ""),
        limit: THREAD_PAGE_SIZE,
        replies_preview_limit: REPLIES_PREVIEW_LIMIT,
        order: CommentOrder.NEW_TO_OLD,
      });

      if (!resp.isSuccessful) throw new Error(resp.errorMessage || "Load comments failed");

      const newThreads = resp.threads ?? [];
      setThreads((prev) => (resetCursor ? newThreads : [...prev, ...newThreads]));

      setRepliesMap((prev) => {
        const copy = { ...prev };
        newThreads.forEach((t) => {
          const rid = t?.root?.id;
          if (rid && copy[rid] === undefined) copy[rid] = initRepliesStateFromThread(t);
        });
        return copy;
      });

      setNextCursor(resp.next_cursor ?? null);
      setHasMore(!!resp.has_more);
    } catch (e: any) {
      setThreadsErr(e?.message || "Network error");
    } finally {
      setLoadingThreads(false);
    }
  };

  const loadMoreThreads = async () => {
    if (!hasMore || loadingThreads) return;
    await refresh(false);
  };

  const loadMoreReplies = async (rootId: number) => {
    const st = repliesMap[rootId];
    if (!st || st.loading || !st.has_more) return;

    setRepliesMap((prev) => ({
      ...prev,
      [rootId]: { ...prev[rootId], loading: true, error: null },
    }));

    try {
      const resp = await listCommentReplies({
        root_id: rootId,
        cursor: st.next_cursor ?? "",
        limit: REPLIES_PAGE_SIZE,
        order: CommentOrder.NEW_TO_OLD,
      });
      if (!resp.isSuccessful) throw new Error(resp.errorMessage || "Load replies failed");

      const newRows = resp.replies ?? [];
      setRepliesMap((prev) => {
        const cur = prev[rootId];
        const merged = [...cur.items, ...newRows]; // NEW_TO_OLD
        return {
          ...prev,
          [rootId]: {
            ...cur,
            items: merged,
            next_cursor: resp.next_cursor ?? makeCursorFromLast(merged),
            has_more: !!resp.has_more,
            loading: false,
            error: null,
          },
        };
      });
    } catch (e: any) {
      setRepliesMap((prev) => ({
        ...prev,
        [rootId]: { ...prev[rootId], loading: false, error: e?.message || "Network error" },
      }));
    }
  };

  // 发顶层评论：成功后直接插入 threads（本地 happy pass）
  const createTopComment = async (content: string) => {
    setThreadsErr(null);
    const resp = await createComment({ post_id: postId, content });
    if (!resp.isSuccessful || !resp.comment) throw new Error(resp.errorMessage || "Create failed");

    const newThread: CommentThread = { root: resp.comment, replies_preview: [] };
    setThreads((prev) => [newThread, ...prev]);
    setRepliesMap((prev) => ({ ...prev, [resp.comment!.id]: emptyRepliesState() }));
    return resp.comment;
  };

  // 发回复：成功后插入 repliesMap[rootId]，并 root.reply_count +1（本地 happy pass）
  const createReply = async (parentId: number, rootId: number, content: string) => {
    const resp = await createComment({ post_id: postId, content, parent_id: parentId });
    if (!resp.isSuccessful || !resp.comment) throw new Error(resp.errorMessage || "Reply failed");

    setRepliesMap((prev) => {
      const cur = prev[rootId] ?? emptyRepliesState();
      const merged = [resp.comment!, ...cur.items]; // NEW_TO_OLD
      return {
        ...prev,
        [rootId]: { ...cur, items: merged, next_cursor: makeCursorFromLast(merged) },
      };
    });

    setThreads((prev) =>
      prev.map((t) =>
        t.root.id !== rootId
          ? t
          : { ...t, root: { ...(t.root as any), reply_count: (t.root.reply_count ?? 0) + 1 } as any }
      )
    );

    return resp.comment;
  };

  // 删除：调用后端，前端本地标记 [deleted]（happy pass）
  const softDelete = async (c: Comment, rootId: number) => {
    const resp = await deleteComment({ comment_id: c.id });
    if (!resp?.isSuccessful) throw new Error(resp?.errorMessage || "Delete failed");

    if (c.parent_id == null) {
      setThreads((prev) =>
        prev.map((t) =>
          t.root.id !== c.id
            ? t
            : { ...t, root: { ...(t.root as any), is_deleted: true, content: "[deleted]" } as any }
        )
      );
    } else {
      setRepliesMap((prev) => {
        const st = prev[rootId];
        if (!st) return prev;
        return {
          ...prev,
          [rootId]: {
            ...st,
            items: st.items.map((x) =>
              x.id !== c.id ? x : ({ ...(x as any), is_deleted: true, content: "[deleted]" } as any)
            ),
          },
        };
      });

      setThreads((prev) =>
        prev.map((t) =>
          t.root.id !== rootId
            ? t
            : {
                ...t,
                root: { ...(t.root as any), reply_count: Math.max(0, (t.root.reply_count ?? 0) - 1) } as any,
              }
        )
      );
    }
  };

  // like/unlike：先更新 UI，再发请求；默认 happy pass（不回滚）
  const toggleLike = async (rootId: number, commentId: number) => {
    if (likeLoadingRef.current[commentId]) return;
    likeLoadingRef.current[commentId] = true;

    // 1) 找到当前 comment（root 或 reply）
    let current: Comment | null = null;
    const t = threads.find((x) => x.root.id === commentId);
    if (t?.root) current = t.root;
    if (!current) {
      const st = repliesMap[rootId];
      current = st?.items?.find((x) => x.id === commentId) ?? null;
    }
    if (!current) {
      likeLoadingRef.current[commentId] = false;
      return;
    }

    const wasLiked = getLikedByViewer(current);
    const nextLiked = !wasLiked;

    // 2) optimistic patch（root / reply）
    setThreads((prev) =>
      prev.map((x) =>
        x.root.id !== commentId ? x : ({ ...x, root: setLikedByViewer(x.root, nextLiked) } as any)
      )
    );
    setRepliesMap((prev) => {
      const st = prev[rootId];
      if (!st) return prev;
      return {
        ...prev,
        [rootId]: {
          ...st,
          items: st.items.map((x) => (x.id !== commentId ? x : (setLikedByViewer(x, nextLiked) as any))),
        },
      };
    });

    // 3) 发请求（happy pass：失败只记录 error，不回滚）
    try {
      const endpoint = nextLiked ? "/comment/like" : "/comment/unlike";
      const resp = await postJSON<LikeResp>(`${BASE_URL}${endpoint}`, { comment_id: commentId });
      if (!resp?.isSuccessful) throw new Error(resp?.errorMessage || "Toggle like failed");
    } catch (e: any) {
      setThreadsErr(e?.message || "Network error while toggling like");
    } finally {
      likeLoadingRef.current[commentId] = false;
    }
  };

  const clearError = () => setThreadsErr(null);

  return {
    threads,
    loadingThreads,
    threadsErr,
    clearError,

    hasMore,
    nextCursor,

    repliesMap,

    refresh: () => refresh(true),
    loadMoreThreads,

    loadMoreReplies,

    createTopComment,
    createReply,
    softDelete,

    toggleLike,
  };
}

export type { RepliesState };
