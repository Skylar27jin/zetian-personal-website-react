// src/components/PostSourceTabs.tsx
import React from "react";
import type { Post } from "../types/post";
import "./Navbar.css"; // 复用 feed-tabs / feed-tab 样式

export type PostSourceKey = "posts" | "liked" | "faved";

export interface PostSourceTabsProps {
  /** 当前选中的来源 */
  active: PostSourceKey;
  /** 切换回调 */
  onChange: (next: PostSourceKey) => void;
  /** 是否本人 */
  isSelf: boolean;
}

export default function PostSourceTabs({
  active,
  onChange,
  isSelf,
}: PostSourceTabsProps) {
  const tabs: { key: PostSourceKey; label: string }[] = isSelf
    ? [
        { key: "posts", label: "My Posts" },
        { key: "liked", label: "Liked" },
        { key: "faved", label: "Faved" },
      ]
    : [
        { key: "posts", label: "Posts" },
        { key: "liked", label: "Liked" },
        { key: "faved", label: "Faved" },
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