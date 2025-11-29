// src/components/ReplyPreview.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import RichContent from "./RichContent";
import GopherLoader from "./GopherLoader";
import type { Post } from "../types/post";

const DEFAULT_AVATAR = "../gopher_front.png";

interface ReplyPreviewProps {
  // 被 reply 的那条 post 的 id（用来跳转）
  replyToPostId: number;
  // 已经拿到的原帖（PostCard 用 quotedPostsMap 传进来，DetailPage 用 lazy load 的结果）
  parentPost?: Post | null;
  // 如果后端单独查了 userName，可以传进来；否则用 parentPost.user_name
  parentAuthorName?: string;
  // 正在加载原帖时用
  parentLoading?: boolean;
  // 预览内容最多显示几行
  maxLines?: number;
}

function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date
      .toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(",", "");
  } catch {
    return isoString;
  }
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({
  replyToPostId,
  parentPost,
  parentAuthorName,
  parentLoading = false,
  maxLines = 3,
}) => {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/post/${replyToPostId}`);
  };

  const handleUserClick = (e: React.MouseEvent) => {
    if (!parentPost) return;
    e.preventDefault();
    e.stopPropagation();
    navigate(`/user/${parentPost.user_id}`);
  };

  const avatarSrc =
    parentPost &&
    parentPost.user_avatar_url &&
    parentPost.user_avatar_url.trim().length > 0
      ? parentPost.user_avatar_url
      : DEFAULT_AVATAR;

  const displayName =
    (parentAuthorName && `@${parentAuthorName}`) ||
    (parentPost?.user_name && `@${parentPost.user_name}`) ||
    (parentPost ? `User #${parentPost.user_id}` : "Original author");

  return (
    <div
      className="p-3 rounded-3"
      style={{
        backgroundColor: "#f5f5f5",
        borderLeft: "3px solid #d0d0d0",
        cursor: "pointer",
      }}
      onClick={handleCardClick}
    >
      {parentLoading && !parentPost ? (
        <div className="text-muted small d-flex align-items-center gap-2">
          <GopherLoader size={40} />
          <span>Loading original post…</span>
        </div>
      ) : (
        <>
          <div className="text-muted small mb-1 text-uppercase">
            Replying to
          </div>

          {parentPost ? (
            <>
              {/* 头像 + 作者 + 时间 + 学校/板块 */}
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="d-flex align-items-center gap-2">
                  <img
                    src={avatarSrc}
                    alt={displayName}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid #ddd",
                    }}
                    onClick={handleUserClick}
                  />

                  <button
                    type="button"
                    onClick={handleUserClick}
                    className="btn btn-link p-0 m-0 fw-semibold text-decoration-none"
                    style={{ color: "inherit" }}
                  >
                    {displayName}
                  </button>
                </div>

                <div className="text-muted small text-end">
                  <div>{formatDateTime(parentPost.created_at)}</div>
                  <div>
                    {parentPost.school_name}
                    {parentPost.category_name && (
                      <> · {parentPost.category_name}</>
                    )}
                  </div>
                </div>
              </div>
              {/* 标题 */}
              <div className="fw-bold">
                {parentPost.title || <span className="text-muted fst-italic">(No title)</span>}
              </div>
              {/* 内容预览（和 PostCard 一样用 RichContent clamp） */}
              <div className="mt-2 small text-muted">
                <RichContent
                  content={parentPost.content}
                  clampLines={maxLines}
                />
              </div>

              {/* 统一「View more」交互：整块点击直接跳原帖 */}
              <div className="mt-1 small text-primary">
                more
              </div>
            </>
          ) : (
            <div className="text-muted small fst-italic">
              Original post not found (maybe deleted).
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReplyPreview;
