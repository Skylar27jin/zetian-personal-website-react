// src/hooks/usePostReactions.ts
import type { Post } from "../types/post";
import {
  likePost,
  unlikePost,
  favPost,
  unfavPost,
} from "../api/postApi";

export type PostUpdater = (postId: number, patch: (p: Post) => Post) => void;

interface Options {
  /** 未登录时，如果需要拦截，可以传一个 ensureLogin，返回 false 则不继续 */
  ensureLogin?: () => boolean;
  /** 统一错误展示（可选） */
  setActionError?: (msg: string | null) => void;
}

/**
 * 统一的乐观更新点赞 / 收藏逻辑
 * 所有页面都可以用：
 *   const { handleLike, handleUnlike, handleFav, handleUnfav } =
 *     usePostReactions(updatePostLocal, { ensureLogin, setActionError });
 */
export function usePostReactions(
  updatePost: PostUpdater,
  options: Options = {}
) {
  const ensureLogin = options.ensureLogin ?? (() => true);
  const setActionError = options.setActionError ?? (() => {});

  const handleLike = async (postId: number) => {
    if (!ensureLogin()) return;
    setActionError(null);

    // 乐观：先 +1 & 设置 liked
    updatePost(postId, (p) => {
      if (p.is_liked_by_user) return p;
      return {
        ...p,
        is_liked_by_user: true,
        like_count: (p.like_count ?? 0) + 1,
      };
    });

    try {
      const resp = await likePost(postId);
      if (!resp.isSuccessful) {
        // 回滚
        updatePost(postId, (p) => ({
          ...p,
          is_liked_by_user: false,
          like_count: Math.max(0, (p.like_count ?? 1) - 1),
        }));
        setActionError(resp.errorMessage || "Failed to like post.");
      }
    } catch (e: any) {
      updatePost(postId, (p) => ({
        ...p,
        is_liked_by_user: false,
        like_count: Math.max(0, (p.like_count ?? 1) - 1),
      }));
      setActionError(e?.message || "Network error while liking.");
    }
  };

  const handleUnlike = async (postId: number) => {
    if (!ensureLogin()) return;
    setActionError(null);

    // 乐观：先 -1 & 取消 liked
    updatePost(postId, (p) => {
      if (!p.is_liked_by_user) return p;
      return {
        ...p,
        is_liked_by_user: false,
        like_count: Math.max(0, (p.like_count ?? 1) - 1),
      };
    });

    try {
      const resp = await unlikePost(postId);
      if (!resp.isSuccessful) {
        // 回滚
        updatePost(postId, (p) => ({
          ...p,
          is_liked_by_user: true,
          like_count: (p.like_count ?? 0) + 1,
        }));
        setActionError(resp.errorMessage || "Failed to unlike post.");
      }
    } catch (e: any) {
      updatePost(postId, (p) => ({
        ...p,
        is_liked_by_user: true,
        like_count: (p.like_count ?? 0) + 1,
      }));
      setActionError(e?.message || "Network error while unliking.");
    }
  };

  const handleFav = async (postId: number) => {
    if (!ensureLogin()) return;
    setActionError(null);

    // 乐观：先 +1 & 设置 fav
    updatePost(postId, (p) => {
      if (p.is_fav_by_user) return p;
      return {
        ...p,
        is_fav_by_user: true,
        fav_count: (p.fav_count ?? 0) + 1,
      };
    });

    try {
      const resp = await favPost(postId);
      if (!resp.isSuccessful) {
        // 回滚
        updatePost(postId, (p) => ({
          ...p,
          is_fav_by_user: false,
          fav_count: Math.max(0, (p.fav_count ?? 1) - 1),
        }));
        setActionError(resp.errorMessage || "Failed to favorite post.");
      }
    } catch (e: any) {
      updatePost(postId, (p) => ({
        ...p,
        is_fav_by_user: false,
        fav_count: Math.max(0, (p.fav_count ?? 1) - 1),
      }));
      setActionError(e?.message || "Network error while favoriting.");
    }
  };

  const handleUnfav = async (postId: number) => {
    if (!ensureLogin()) return;
    setActionError(null);

    // 乐观：先 -1 & 取消 fav
    updatePost(postId, (p) => {
      if (!p.is_fav_by_user) return p;
      return {
        ...p,
        is_fav_by_user: false,
        fav_count: Math.max(0, (p.fav_count ?? 1) - 1),
      };
    });

    try {
      const resp = await unfavPost(postId);
      if (!resp.isSuccessful) {
        // 回滚
        updatePost(postId, (p) => ({
          ...p,
          is_fav_by_user: true,
          fav_count: (p.fav_count ?? 0) + 1,
        }));
        setActionError(resp.errorMessage || "Failed to unfavorite post.");
      }
    } catch (e: any) {
      updatePost(postId, (p) => ({
        ...p,
        is_fav_by_user: true,
        fav_count: (p.fav_count ?? 0) + 1,
      }));
      setActionError(e?.message || "Network error while unfavoriting.");
    }
  };

  return { handleLike, handleUnlike, handleFav, handleUnfav };
}