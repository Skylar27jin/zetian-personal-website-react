// src/components/PostCard.tsx
import React from "react";
import { Card, Row, Col, Button } from "react-bootstrap";
import { motion } from "framer-motion";
import type { Post } from "../types/post";

type PostCardProps = {
  post: Post;
  onLike: (postId: number) => void;
  onUnlike: (postId: number) => void;
  onFav: (postId: number) => void;
  onUnfav: (postId: number) => void;
};

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toISOString().slice(0, 19).replace("T", " ");
  } catch {
    return isoString;
  }
}

const PostCard: React.FC<PostCardProps> = ({
  post: p,
  onLike,
  onUnlike,
  onFav,
  onUnfav,
}) => {
  return (
    <Card className="shadow-sm border-0">
      <Card.Body>
        <Card.Title className="fw-semibold">{p.title}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted small">
          🏫 {p.school_name} · 👁 {p.view_count} · 📅 {formatTime(p.created_at)}
        </Card.Subtitle>
        <Card.Text>{p.content}</Card.Text>

        <hr />

        <Row className="align-items-center text-muted small">
          <Col xs="auto">
            👍 {p.like_count} · ⭐ {p.fav_count}
          </Col>

          <Col className="text-end">
            <div className="d-inline-flex gap-3">
              {/* Like */}
              <motion.div whileTap={{ scale: 1.15 }} transition={{ duration: 0.12 }}>
                <Button
                  size="sm"
                  variant={p.is_liked_by_user ? "primary" : "outline-secondary"}
                  onClick={() =>
                    p.is_liked_by_user ? onUnlike(p.id) : onLike(p.id)
                  }
                >
                  {p.is_liked_by_user ? "💙 Liked" : "👍 Like"}
                </Button>
              </motion.div>

              {/* Fav */}
              <motion.div whileTap={{ scale: 1.15 }} transition={{ duration: 0.12 }}>
                <Button
                  size="sm"
                  variant={p.is_fav_by_user ? "warning" : "outline-secondary"}
                  onClick={() =>
                    p.is_fav_by_user ? onUnfav(p.id) : onFav(p.id)
                  }
                >
                  {p.is_fav_by_user ? "🌟 Favorited" : "⭐ Fav"}
                </Button>
              </motion.div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default PostCard;
