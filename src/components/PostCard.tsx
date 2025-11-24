// src/components/PostCard.tsx
import React, { useEffect, useState } from "react";
import { Card, Button, Badge, Dropdown } from "react-bootstrap";
import { motion } from "framer-motion";
import type { Post } from "../types/post";
import { Link } from "react-router-dom";
import { getPostByID } from "../api/postApi";
import { getUser } from "../api/userApi";
import formatTime from "../pkg/TimeFormatter";

const MAX_LINES = 6;

interface PostCardProps {
  post: Post;
  onLike: (postId: number) => void;
  onUnlike: (postId: number) => void;
  onFav: (postId: number) => void;
  onUnfav: (postId: number) => void;

  // 当前查看者
  viewerId?: number | null;

  // 作者才会看到 Edit/Delete
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;

  // 任意人可以看到的 Report（我们在卡片里限制为非作者）
  onReport?: (post: Post) => void;
}

// 用来展示“回复了哪一条”的 meta 信息
interface ReplyMeta {
  id: number;
  title: string;
  authorName?: string;
  createdAt: string;
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
  } = props;

  const isOwner = viewerId != null && viewerId === post.user_id;

  // ----------- lazy load reply_to 目标帖子的 meta 信息 -----------
  const [replyMeta, setReplyMeta] = useState<ReplyMeta | null>(null);
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!post.reply_to) {
      setReplyMeta(null);
      return;
    }

    (async () => {
      try {
        setReplyLoading(true);
        setReplyMeta(null);

        // 1) 拿被回复的帖子
        const postResp = await getPostByID({ id: post.reply_to! });
        if (cancelled) return;

        if (!postResp.isSuccessful || !postResp.post) {
          setReplyMeta(null);
          return;
        }

        const target = postResp.post;
        const baseMeta: ReplyMeta = {
          id: target.id,
          title: target.title,
          createdAt: target.created_at,
        };

        // 2) 再拿作者姓名（失败就忽略）
        try {
          const userResp = await getUser({ id: target.user_id });
          if (!cancelled && userResp.isSuccessful) {
            baseMeta.authorName = userResp.userName;
          }
        } catch {
          // ignore
        }

        if (!cancelled) {
          setReplyMeta(baseMeta);
        }
      } catch {
        if (!cancelled) {
          setReplyMeta(null);
        }
      } finally {
        if (!cancelled) setReplyLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [post.reply_to]);

  // ----------- 内容折叠 -----------
  const [expanded, setExpanded] = useState(false);
  const lines = (post.content || "").split("\n");
  const isLong = lines.length > MAX_LINES;
  const contentToShow =
    !isLong || expanded ? post.content : lines.slice(0, MAX_LINES).join("\n");

  // ----------- 右上角菜单项可见性 -----------
  const showEdit = isOwner && !!onEdit;
  const showDelete = isOwner && !!onDelete;
  const showReport = !isOwner && !!onReport;
  const hasMenu = showEdit || showDelete || showReport;

  return (
    <Card className="shadow-sm border-0">
      <Card.Body>
        {/* 标题 + 右上角作者信息 / 菜单 */}
        <Card.Title className="fw-semibold d-flex align-items-center justify-content-between">
          {/* 左侧：标题 */}
          <span>
            <Link
              to={`/post/${post.id}`}
              className="text-decoration-none text-dark"
            >
              {post.title}
            </Link>
          </span>

          {/* 右侧：作者名 + Me + 三点菜单 */}
          <div className="d-flex align-items-center gap-2">
            {/* 非作者：显示 @username */}
            {!isOwner && (
              <Link
                to={`/user/${post.user_id}`}
                className="text-decoration-none"
                style={{ fontSize: "0.9rem", fontWeight: 600 }}
              >
                @{post.user_name || `user${post.user_id}`}
              </Link>
            )}

            {/* 作者：显示 Me */}
            {isOwner && (
              <Badge bg="secondary" className="py-1 px-2">
                Me
              </Badge>
            )}

            {/* 只有真的有菜单项时才渲染三点按钮 */}
            {hasMenu && (
              <Dropdown align="end">
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

        {/* 内容区：支持换行 + 折叠 */}
        <Card.Text style={{ whiteSpace: "pre-wrap" }}>
          {contentToShow}
          {isLong && !expanded && " …"}
        </Card.Text>

        {isLong && (
          <div className="mb-2">
            <Button
              variant="link"
              size="sm"
              className="p-0"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? "Show less" : "Show more"}
            </Button>
          </div>
        )}

        {/* 如果是回复某个帖子，在卡片底部显示被回复对象 */}
        {post.reply_to && (
          <div className="mt-2">
            <Link
              to={`/post/${post.reply_to}`}
              className="text-muted text-decoration-none"
            >
              <div
                className="small p-2 rounded-3"
                style={{
                  backgroundColor: "#f5f5f5",
                  borderLeft: "3px solid #d0d0d0",
                }}
              >
                {/* 第一行：Replying to + 作者 / 兜底 */}
                <div>
                  <span className="me-1">↪ Replying to</span>
                  {replyMeta?.authorName ? (
                    <span className="fw-semibold">@{replyMeta.authorName}</span>
                  ) : (
                    <span className="fw-semibold">Post #{post.reply_to}</span>
                  )}
                </div>

                {/* 第二行：标题 + 时间（或者 loading / not found） */}
                <div className="text-muted">
                  {replyLoading && !replyMeta && "Loading original post…"}
                  {!replyLoading && replyMeta && (
                    <>
                      <span className="fst-italic">“{replyMeta.title}”</span>
                      <span className="ms-1">
                        · {formatTime(replyMeta.createdAt)}
                      </span>
                    </>
                  )}
                  {!replyLoading && !replyMeta && (
                    <span className="fst-italic">Original post not found</span>
                  )}
                </div>
              </div>
            </Link>
          </div>
        )}

        <hr />

        {/* meta + like/fav 区 */}
        <div className="d-flex align-items-center text-muted small mb-2">
          {/* 左侧：meta 信息 */}
          <div className="flex-grow-1">
            🏫 {post.school_name} · 👁 {post.view_count} ·{" "}
            {formatTime(post.created_at)}
            {post.location && <> · 📍 {post.location}</>}
          </div>

          {/* 右侧：like / fav 按钮 */}
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
                onClick={() =>
                  post.is_liked_by_user ? onUnlike(post.id) : onLike(post.id)
                }
              >
                {post.is_liked_by_user ? "🩷" : "👍"} {post.like_count ?? 0}
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
                onClick={() =>
                  post.is_fav_by_user ? onUnfav(post.id) : onFav(post.id)
                }
              >
                {post.is_fav_by_user ? "🌟" : "⭐"} {post.fav_count ?? 0}
              </Button>
            </motion.div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}