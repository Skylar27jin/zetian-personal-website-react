// src/components/PostList.tsx
import React from "react";
import { Row, Col, Button, Alert, Spinner } from "react-bootstrap";
import { motion } from "framer-motion";
import PostCard from "./PostCard";
import GopherLoader from "./GopherLoader";
import type { Post } from "../types/post";

interface ForumPostListSectionProps {
  posts: Post[];
  loadingPosts: boolean;
  postsError?: string | null;
  hasMore: boolean;

  loadMore: () => void;
  onRefresh?: () => void;
  canRefresh?: boolean;

  onLike: (postId: number) => void;
  onUnlike: (postId: number) => void;
  onFav: (postId: number) => void;
  onUnfav: (postId: number) => void;

  viewerId?: number | null;

  enableEdit?: boolean;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;

  // 新增：Report 回调（可以暂时只弹个提示）
  onReport?: (post: Post) => void;

  deletingPostId?: number | null;
  disableLoadMore?: boolean;
}

const ForumPostListSection: React.FC<ForumPostListSectionProps> = ({
  posts,
  loadingPosts,
  postsError,
  hasMore,
  loadMore,
  onRefresh,
  canRefresh = false,

  onLike,
  onUnlike,
  onFav,
  onUnfav,

  viewerId = null,
  enableEdit = false,
  onEdit,
  onDelete,
  onReport,

  deletingPostId = null,
  disableLoadMore = false,
}) => {
  return (
    <>
      <Row className="gy-4">
        {posts.map((p) => (
          <Col key={p.id} xs={12}>
            <PostCard
              post={p}
              viewerId={viewerId ?? undefined}
              onLike={onLike}
              onUnlike={onUnlike}
              onFav={onFav}
              onUnfav={onUnfav}
              onEdit={enableEdit ? onEdit : undefined}
              onDelete={enableEdit ? onDelete : undefined}
              onReport={onReport}
            />
            {enableEdit && deletingPostId === p.id && (
              <div className="text-danger small mt-1">
                <Spinner animation="border" size="sm" /> Deleting…
              </div>
            )}
          </Col>
        ))}
        {postsError && <Alert variant="danger">{postsError}</Alert>}
      </Row>

      {/* 分页 & 加载 */}
      <div className="text-center mt-5">
        <div className="d-flex justify-content-center align-items-center gap-3 flex-wrap">
          <motion.div
            whileTap={{ scale: 1.08 }}
            transition={{ duration: 0.12 }}
          >
            <Button
              variant="dark"
              disabled={loadingPosts || !hasMore || disableLoadMore}
              onClick={loadMore}
            >
              {loadingPosts ? "Loading…" : hasMore ? "Load more" : "No more"}
            </Button>
          </motion.div>

          {/* 加载更多时的小号 gopher */}
          {loadingPosts && posts.length > 0 && (
            <div style={{ minWidth: 72 }}>
              <GopherLoader size={56} />
            </div>
          )}

          {/* 空列表 + 可刷新 */}
          {canRefresh &&
            posts.length === 0 &&
            !loadingPosts &&
            onRefresh && (
              <motion.div
                whileTap={{ scale: 1.08 }}
                transition={{ duration: 0.12 }}
              >
                <Button
                  variant="outline-secondary"
                  onClick={onRefresh}
                >
                  Refresh
                </Button>
              </motion.div>
            )}

          <div className="text-secondary small">
            Loaded <b>{posts.length}</b> post
            {posts.length !== 1 ? "s" : ""}
            {hasMore ? "" : " (all loaded)"}
          </div>
        </div>
      </div>
    </>
  );
};

export default ForumPostListSection;
