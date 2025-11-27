// src/components/PostCard.tsx
import React, { useState } from "react";
import { Card, Button, Badge, Dropdown } from "react-bootstrap";
import { motion } from "framer-motion";
import type { Post } from "../types/post";
import { Link, useNavigate } from "react-router-dom";
import formatTime from "../pkg/TimeFormatter";
import RichContent from "./RichContent";

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

  // 动态判断宽高比（h / w）
  const [imgRatio, setImgRatio] = useState<number | null>(null);

  const handleImageLoad = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setImgRatio(img.naturalHeight / img.naturalWidth);
    }
  };

  // 只有特别“长/宽”的才裁切
  const isExtremeAspect =
    imgRatio !== null && (imgRatio > 2.5 || imgRatio < 0.4);

  const handleCardClick = () => {
    navigate(`/post/${post.id}`);
  };

  return (
    <Card
      className="shadow-sm border-0 overflow-hidden"
      onClick={handleCardClick}
      style={{ cursor: "pointer" }}
    >
      {/* 顶部图片行：黑色背景 + 圆角（由 Card 自己裁剪） */}
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
        {/* 标题 + 右上角作者信息 / 菜单 */}
        <Card.Title
          className="fw-semibold d-flex align-items-center justify-content-between mb-2"
          style={{ marginTop: 0 }} // 贴近图片
        >
          <span>{post.title}</span>

          <div className="d-flex align-items-center gap-2">
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
              <Dropdown
                align="end"
                onClick={(e) => e.stopPropagation()}
              >
                <Dropdown.Toggle
                  as="span"
                  bsPrefix="post-card-toggle"
                  className="text-muted"
                  style={{
                    cursor: "pointer",
                    padding: "2px 6px",
                    fontSize: "20px",
                    lineHeight: "1",
                    background: "none",
                    border: "none",
                    boxShadow: "none",
                  }}
                >
                  ...
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  {showEdit && (
                    <Dropdown.Item onClick={() => onEdit?.(post)}>
                      ✏️ Edit
                    </Dropdown.Item>
                  )}

                  {showDelete && (
                    <Dropdown.Item
                      className="text-danger"
                      onClick={() => onDelete?.(post)}
                    >
                      🗑 Delete
                    </Dropdown.Item>
                  )}

                  {showReport && (
                    <Dropdown.Item onClick={() => onReport?.(post)}>
                      Report
                    </Dropdown.Item>
                  )}
                </Dropdown.Menu>
              </Dropdown>
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

        {/* 正文 */}
        <div className="mb-2">
          {expanded ? (
            <RichContent content={post.content} />
          ) : (
            <>
              <RichContent content={post.content} clampLines={MAX_LINES} />
            </>
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

        {/* Reply 区 */}
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
