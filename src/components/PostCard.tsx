// src/components/PostCard.tsx
import React, { useState } from "react";
import { Card, Button, Badge, Dropdown } from "react-bootstrap";
import { motion } from "framer-motion";
import type { Post } from "../types/post";
import { Link, useNavigate } from "react-router-dom";
import formatTime from "../pkg/TimeFormatter";
import RichContent from "./RichContent";
import PostActionsDropdown from "./PostActionsDropDown";

const MAX_LINES = 3;

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
  const avatarSrc =
    post.user_avatar_url|| `../gopher_front.png`;

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
                width: 32,
                height: 32,
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
                @{post.user_name || `user${post.user_id}`}
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
                // deleting 可以从外面传进来，如果以后想在菜单里禁用 Delete
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
              Show more
            </Button>
          </div>
        )}

        {/* reply info */}
        {post.reply_to && (
          <div className="mt-2">
            <Link
              to={`/post/${post.reply_to}`}
              className="text-muted text-decoration-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="small p-2 rounded-3"
                style={{
                  backgroundColor: "#f5f5f5",
                  borderLeft: "3px solid #d0d0d0",
                }}
              >
                <div>
                  <span className="me-1">↪ Replying to</span>
                  {replyTarget?.user_name ? (
                    <span className="fw-semibold">
                      @{replyTarget.user_name}
                    </span>
                  ) : (
                    <span className="fw-semibold">
                      Post #{post.reply_to}
                    </span>
                  )}
                </div>

                <div className="text-muted">
                  {replyTarget ? (
                    <>
                      <span className="fst-italic">
                        “{replyTarget.title}”
                      </span>
                      <span className="ms-1">
                        · {formatTime(replyTarget.created_at)}
                      </span>
                    </>
                  ) : (
                    <span className="fst-italic">
                      Original post not found
                    </span>
                  )}
                </div>
              </div>
            </Link>
            <div style={{ whiteSpace: "pre-wrap" }}>{"\n"}</div>
          </div>
        )}

        {/* meta + like/fav */}
        <div className="d-flex align-items-center text-muted small mb-2">
          <div className="flex-grow-1">
            {post.school_name} ·{" "}
            {formatTime(post.created_at, "relative")}
            {post.location && <> · {post.location}</>}
          </div>

          <div className="d-inline-flex gap-2 flex-shrink-0">
            <motion.div
              whileTap={{ scale: 1.15 }}
              transition={{ duration: 0.12 }}
            >
              <Button
                size="sm"
                variant={
                  post.is_liked_by_user ? "primary" : "outline-secondary"
                }
                onClick={(e) => {
                  e.stopPropagation();
                  post.is_liked_by_user
                    ? onUnlike(post.id)
                    : onLike(post.id);
                }}
              >
                {post.is_liked_by_user ? "🩷" : "👍"}{" "}
                {post.like_count ?? 0}
              </Button>
            </motion.div>

            <motion.div
              whileTap={{ scale: 1.15 }}
              transition={{ duration: 0.12 }}
            >
              <Button
                size="sm"
                variant={
                  post.is_fav_by_user ? "warning" : "outline-secondary"
                }
                onClick={(e) => {
                  e.stopPropagation();
                  post.is_fav_by_user
                    ? onUnfav(post.id)
                    : onFav(post.id);
                }}
              >
                {post.is_fav_by_user ? "🌟" : "⭐"}{" "}
                {post.fav_count ?? 0}
              </Button>
            </motion.div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
