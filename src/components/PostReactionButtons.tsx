// src/components/PostReactionButtons.tsx
import React from "react";
import { Button } from "react-bootstrap";
import { motion } from "framer-motion";
import type { Post } from "../types/post";

interface PostReactionButtonsProps {
  post: Post;
  viewerId?: number | null;
  onLike: (postId: number) => void;
  onUnlike: (postId: number) => void;
  onFav: (postId: number) => void;
  onUnfav: (postId: number) => void;

  /** 未登录时的处理，比如弹 login modal 或 setActionError */
  onRequireLogin?: () => void;

  /** 图标尺寸，默认 28 */
  iconSize?: number;

  /** 外层容器 className，可选 */
  className?: string;

  /** 是否阻止事件冒泡（卡片里一般要 true，详情页无所谓） */
  stopPropagation?: boolean;

  /** 是否显示评论按钮（列表里默认不传，详情页传 true） */
  showComment?: boolean;

  /** 是否显示分享按钮（列表里默认不传，详情页传 true） */
  showShare?: boolean;

  /** 点击评论按钮的回调（比如滚动到评论区域） */
  onCommentClick?: (post: Post) => void;

  /** 点击分享按钮的回调（比如弹出分享 Modal） */
  onShareClick?: (post: Post) => void;
}

const PostReactionButtons: React.FC<PostReactionButtonsProps> = ({
  post,
  viewerId,
  onLike,
  onUnlike,
  onFav,
  onUnfav,
  onRequireLogin,
  iconSize = 28,
  className,
  stopPropagation = true,
  showComment = false,
  showShare = false,
  onCommentClick,
  onShareClick,
}) => {
  const handleClickLike = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    if (!viewerId) {
      onRequireLogin?.();
      return;
    }
    post.is_liked_by_user ? onUnlike(post.id) : onLike(post.id);
  };

  const handleClickFav = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    if (!viewerId) {
      onRequireLogin?.();
      return;
    }
    post.is_fav_by_user ? onUnfav(post.id) : onFav(post.id);
  };

  const handleClickComment = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    onCommentClick?.(post);
  };

  const handleClickShare = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    onShareClick?.(post);
  };

  return (
    <div className={`d-inline-flex gap-2 align-items-center ${className ?? ""}`}>
      {/* Comment（如果需要） */}
      {showComment && (
        <motion.div whileTap={{ scale: 1.15 }} transition={{ duration: 0.12 }}>
          <Button
            size="sm"
            variant="light"
            onClick={handleClickComment}
            className="d-inline-flex align-items-center gap-1"
            style={{
              border: "none",
              boxShadow: "none",
              background: "transparent",
              padding: 0,
            }}
          >
            <img
              src="/comment.png"
              alt="comment"
              style={{
                width: iconSize,
                height: iconSize,
                display: "block",
              }}
            />
            {/* ⭐ 评论数量 */}
            <span style={{ lineHeight: 1 }}>
              {post.comment_count ?? 0}
            </span>
          </Button>
        </motion.div>
      )}

      {/* Share（如果需要） */}
      {showShare && (
        <motion.div whileTap={{ scale: 1.15 }} transition={{ duration: 0.12 }}>
          <Button
            size="sm"
            variant="light"
            onClick={handleClickShare}
            className="d-inline-flex align-items-center gap-1"
            style={{
              border: "none",
              boxShadow: "none",
              background: "transparent",
              padding: 0,
            }}
          >
            <img
              src="/share.png"
              alt="share"
              style={{
                width: iconSize,
                height: iconSize,
                display: "block",
              }}
            />
            {/* ⭐ 分享数量 */}
            <span style={{ lineHeight: 1 }}>
              {post.share_count ?? 0}
            </span>
          </Button>
        </motion.div>
      )}

      {/* Fav */}
      <motion.div whileTap={{ scale: 1.15 }} transition={{ duration: 0.12 }}>
        <Button
          size="sm"
          variant="light"
          onClick={handleClickFav}
          className="d-inline-flex align-items-center gap-1"
          style={{
            border: "none",
            boxShadow: "none",
            background: "transparent",
            padding: 0,
          }}
        >
          <img
            src={post.is_fav_by_user ? "/starred.png" : "/star.png"}
            alt="favorite"
            style={{
              width: iconSize,
              height: iconSize,
              display: "block",
            }}
          />
          <span style={{ lineHeight: 1 }}>{post.fav_count ?? 0}</span>
        </Button>
      </motion.div>

      {/* Like（最右侧） */}
      <motion.div whileTap={{ scale: 1.15 }} transition={{ duration: 0.12 }}>
        <Button
          size="sm"
          variant="light"
          onClick={handleClickLike}
          className="d-inline-flex align-items-center gap-1"
          style={{
            border: "none",
            boxShadow: "none",
            background: "transparent",
            padding: 0,
          }}
        >
          <img
            src={post.is_liked_by_user ? "/hearted.png" : "/heart.png"}
            alt="like"
            style={{
              width: iconSize,
              height: iconSize,
              display: "block",
            }}
          />
          <span style={{ lineHeight: 1 }}>{post.like_count ?? 0}</span>
        </Button>
      </motion.div>
    </div>
  );
};

export default PostReactionButtons;