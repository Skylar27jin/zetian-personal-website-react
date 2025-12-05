// src/components/PostCard.tsx
import React, { useState } from "react";
import { Card, Button, Badge } from "react-bootstrap";
import { motion } from "framer-motion";
import type { Post } from "../types/post";
import { Link, useNavigate } from "react-router-dom";
import formatTime from "../pkg/TimeFormatter";
import RichContent from "./RichContent";
import PostActionsDropdown from "./PostActionsDropDown";
import ReplyPreview from "./ReplyPreview";
import PostReactionButtons from "./PostReactionButtons";

const MAX_LINES = 3;
const ICON_SIZE = 24;
interface PostCardProps {
  post: Post;
  onLike: (postId: number) => void;
  onUnlike: (postId: number) => void;
  onFav: (postId: number) => void;
  onUnfav: (postId: number) => void;

  viewerId?: number | null;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  onReport?: (post: Post) => void;

  quotedPostsMap?: Record<number, Post>;

  onRequireLogin?: () => void;
}

export default function PostCard(props: PostCardProps) {
  const {
    post,
    onLike,
    onUnlike,
    onFav,
    onUnfav,
    viewerId,
    onEdit,
    onDelete,
    onReport,
    quotedPostsMap,

        onRequireLogin,
  } = props;

  const navigate = useNavigate();
  const isOwner = viewerId != null && viewerId === post.user_id;

  const replyTarget =
    post.reply_to != null && quotedPostsMap
      ? quotedPostsMap[post.reply_to]
      : undefined;

  const [expanded, setExpanded] = useState(false);
  const text = post.content || "";
  const lineCount = text.split(/\r?\n/).length;
  const isLong = lineCount > MAX_LINES || text.length > 80;

  const showEdit = isOwner && !!onEdit;
  const showDelete = isOwner && !!onDelete;
  const showReport = !isOwner && !!onReport;
  const hasMenu = showEdit || showDelete || showReport;

  const hasImage =
    post.media_type === "image" &&
    Array.isArray(post.media_urls) &&
    post.media_urls.length > 0;
  const firstImage = hasImage ? post.media_urls[0] : null;

  // dynamic image ratio
  const [imgRatio, setImgRatio] = useState<number | null>(null);

  const handleImageLoad = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setImgRatio(img.naturalHeight / img.naturalWidth);
    }
  };

  const isExtremeAspect =
    imgRatio !== null && (imgRatio > 2.5 || imgRatio < 0.4);

  const handleCardClick = () => {
    navigate(`/post/${post.id}`);
  };

  // avatar from api, fallback to simple placeholder (you can replace with your gopher)
  const avatarSrc = post.user_avatar_url || `../gopher_front.png`;

  return (
    <Card
      className="shadow-sm border-0 overflow-hidden"
      onClick={handleCardClick}
      style={{ cursor: "pointer" }}
    >
      {/* top image */}
      {firstImage && (
        <div
          style={{
            width: "100%",
            backgroundColor: "#000",
          }}
        >
          <div
            style={
              isExtremeAspect
                ? {
                    width: "100%",
                    height: 220,
                    maxHeight: 220,
                    overflow: "hidden",
                  }
                : {
                    width: "100%",
                    maxHeight: 260,
                    overflow: "hidden",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }
            }
          >
            <img
              src={firstImage}
              alt="post cover"
              onLoad={handleImageLoad}
              style={
                isExtremeAspect
                  ? {
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }
                  : {
                      maxWidth: "100%",
                      maxHeight: 260,
                      width: "auto",
                      height: "auto",
                      objectFit: "contain",
                      display: "block",
                    }
              }
            />
          </div>
        </div>
      )}

      <Card.Body className="pt-2">
        {/* title + author + menu */}
        <Card.Title
          className="fw-semibold d-flex align-items-center justify-content-between mb-2"
          style={{ marginTop: 0 }}
        >
          <span>{post.title}</span>

          <div className="d-flex align-items-center gap-2">
            {/* avatar */}
            <img
              src={avatarSrc}
              alt={post.user_name || `user${post.user_id}`}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid #ddd",
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/user/${post.user_id}`);
              }}
            />

            {/* author name or Me badge */}
            {!isOwner && (
              <Link
                to={`/user/${post.user_id}`}
                className="text-decoration-none"
                style={{ fontSize: "0.9rem", fontWeight: 600 }}
                onClick={(e) => e.stopPropagation()}
              >
                {post.user_name || `user${post.user_id}`}
              </Link>
            )}

            {isOwner && (
              <Badge bg="secondary" className="py-1 px-2">
                Me
              </Badge>
            )}

            {hasMenu && (
              <div onClick={(e) => e.stopPropagation()}>
                <PostActionsDropdown
                  onEdit={showEdit ? () => onEdit?.(post) : undefined}
                  onDelete={showDelete ? () => onDelete?.(post) : undefined}
                  onReport={showReport ? () => onReport?.(post) : undefined}
                />
              </div>
            )}
          </div>
        </Card.Title>

        {/* tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-2 d-flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge
                key={tag}
                bg="light"
                text="dark"
                className="border rounded-pill"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* content */}
        <div className="mb-2">
          {expanded ? (
            <RichContent content={post.content} />
          ) : (
            <RichContent content={post.content} clampLines={MAX_LINES} />
          )}
        </div>

        {isLong && (
          <div className="mb-2">
            <Button
              variant="link"
              size="sm"
              className="p-0"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/post/${post.id}`);
              }}
            >
              more
            </Button>
          </div>
        )}

        {/* reply info（用 ReplyPreview 统一逻辑） */}
        {post.reply_to && (
          <div className="mt-2">
            <ReplyPreview
              replyToPostId={post.reply_to}
              parentPost={replyTarget}
              parentLoading={false}
              // 这里预览少一点行，保持卡片紧凑
              maxLines={2}
            />
            <div style={{ whiteSpace: "pre-wrap" }}>{"\n"}</div>
          </div>
        )}

        {/* meta + like/fav */}
        <div className="d-flex align-items-center text-muted small mb-2">
          {/* 左侧：meta 信息 */}
          <div className="flex-grow-1">
            {post.category_name && <>{post.category_name} · </>}
            {post.school_name} · {formatTime(post.created_at, "relative")}
            {post.location && <> · {post.location}</>}
          </div>

          {/* 右侧：点赞 / 收藏 */}
          <PostReactionButtons
            post={post}
            viewerId={viewerId}
            onLike={onLike}
            onUnlike={onUnlike}
            onFav={onFav}
            onUnfav={onUnfav}
            iconSize={28}
            onRequireLogin={onRequireLogin}
            stopPropagation={true} // 卡片要阻止冒泡，避免跳详情
          />
        </div>
      </Card.Body>
    </Card>
  );
}
