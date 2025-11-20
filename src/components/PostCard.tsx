// src/components/PostCard.tsx
import React, { useState } from "react";
import { Card, Row, Col, Button } from "react-bootstrap";
import { motion } from "framer-motion";
import type { Post } from "../types/post";

interface PostCardProps {
  post: Post;
  onLike: (postId: number) => void;
  onUnlike: (postId: number) => void;
  onFav: (postId: number) => void;
  onUnfav: (postId: number) => void;
  // 如果你还有别的 prop，可以自己加
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toISOString().slice(0, 19).replace("T", " ");
  } catch {
    return isoString;
  }
}

const MAX_LINES = 10;

export default function PostCard({
  post,
  onLike,
  onUnlike,
  onFav,
  onUnfav,
}: PostCardProps) {
  const [expanded, setExpanded] = useState(false);

  const lines = (post.content || "").split("\n");
  const isLong = lines.length > MAX_LINES;
  const contentToShow =
    !isLong || expanded
      ? post.content
      : lines.slice(0, MAX_LINES).join("\n");

  return (
    <Card className="shadow-sm border-0">
      <Card.Body>
        <Card.Title className="fw-semibold">{post.title}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted small">
          🏫 {post.school_name} · 👁 {post.view_count} · 📅{" "}
          {formatTime(post.created_at)}
        </Card.Subtitle>

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

        <hr />

        <Row className="align-items-center text-muted small">
          <Col xs="auto">
            👍 {post.like_count} · ⭐ {post.fav_count}
          </Col>

          <Col className="text-end">
            <div className="d-inline-flex gap-3">
              <motion.div whileTap={{ scale: 1.15 }} transition={{ duration: 0.12 }}>
                <Button
                  size="sm"
                  variant={post.is_liked_by_user ? "primary" : "outline-secondary"}
                  onClick={() =>
                    post.is_liked_by_user
                      ? onUnlike(post.id)
                      : onLike(post.id)
                  }
                >
                  {post.is_liked_by_user ? "💙 Liked" : "👍 Like"}
                </Button>
              </motion.div>

              <motion.div whileTap={{ scale: 1.15 }} transition={{ duration: 0.12 }}>
                <Button
                  size="sm"
                  variant={post.is_fav_by_user ? "warning" : "outline-secondary"}
                  onClick={() =>
                    post.is_fav_by_user ? onUnfav(post.id) : onFav(post.id)
                  }
                >
                  {post.is_fav_by_user ? "🌟 Favorited" : "⭐ Fav"}
                </Button>
              </motion.div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
