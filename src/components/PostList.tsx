// src/components/PostList.tsx
import React, { useEffect, useRef } from "react";
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

  onReport?: (post: Post) => void;

  deletingPostId?: number | null;
  disableLoadMore?: boolean;

  quotedPosts?: Record<string, Post>;
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
  quotedPosts = {},
}) => {
  // 👇 底部“哨兵”元素，用于触发 infinite scroll
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 没更多、被禁用、或者没有 posts 时就不监听
    if (!hasMore || disableLoadMore) return;

    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !loadingPosts) {
          // 出现在视口里就尝试加载下一页
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: "200px", // 提前 200px 预加载
        threshold: 0.1,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, disableLoadMore, loadingPosts, loadMore, posts.length]);

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
              quotedPostsMap={quotedPosts}
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
          {/* 手动 Load more 按钮：作为兜底 / 手动触发 */}
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
                <Button variant="outline-secondary" onClick={onRefresh}>
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

        {/* 👇 这是 infinite scroll 的触发点 */}
        <div
          ref={loadMoreRef}
          style={{ height: 1, marginTop: 8 }}
        />
      </div>
    </>
  );
};

export default ForumPostListSection;