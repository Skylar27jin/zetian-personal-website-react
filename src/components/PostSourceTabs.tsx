// src/components/PostSourceTabs.tsx
import "./Navbar.css"; // 复用 feed-tabs / feed-tab 样式

export type PostSourceKey = "posts" | "liked" | "faved";

export interface PostSourceTabsProps {
  /** 当前选中的来源 */
  active: PostSourceKey;
  /** 切换回调 */
  onChange: (next: PostSourceKey) => void;
  /** 是否本人 */
  isSelf: boolean;
  /** 帖子数量（用来在 Posts tab 上显示） */
  postCount?: number;
  /** 收藏数量（用来在 Faved tab 上显示） */
  postFavCount?: number;
}

export default function PostSourceTabs({
  active,
  onChange,
  isSelf,
  postCount,
  postFavCount,
}: PostSourceTabsProps) {
  const basePostsLabel = isSelf ? "My Posts" : "Posts";
  const postsLabel =
    typeof postCount === "number"
      ? `${basePostsLabel} (${postCount})`
      : basePostsLabel;

  const likedLabel = isSelf ? "Liked" : "Liked";

  const baseFavedLabel = isSelf ? "Faved" : "Faved";
  const favedLabel =
    typeof postFavCount === "number"
      ? `${baseFavedLabel} (${postFavCount})`
      : baseFavedLabel;

  const tabs: { key: PostSourceKey; label: string }[] = [
    { key: "posts", label: postsLabel },
    { key: "liked", label: likedLabel }, // 👍 不展示数量
    { key: "faved", label: favedLabel },
  ];

  return (
    <nav className="feed-tabs feed-tabs--compact post-source-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={
            "feed-tab post-source-tab" +
            (active === tab.key ? " active" : "")
          }
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}