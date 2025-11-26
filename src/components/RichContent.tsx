import React, { useMemo } from "react";
import { plainToHtml } from "../pkg/emojiTransform"; // 先只管 emoji
import "./RichContent.css";

export interface RichContentProps {
  content: string; // 原始存储文本（含 :emoji_xxx:、将来也可以含markdown等）
  clampLines?: number; // 卡片多行省略
  // 预留可扩展开关
  enableEmoji?: boolean; // 默认 true
  // 以后可加：enableMarkdown?: boolean; enableCode?: boolean; linkify?: boolean; ...
}

export default function RichContent({
  content,
  clampLines,
  enableEmoji = true,
}: RichContentProps) {
  // 轻量“渲染管线”：以后想加别的能力，就在这里按顺序 apply
  const html = useMemo(() => {
    let out = content || "";
    if (enableEmoji) {
      out = plainToHtml(out); // 仅把 :emoji_xxx: → <img>
    }
    return out;
  }, [content, enableEmoji]);

  return (
    <div
      className={clampLines ? `rc-content clamp-${clampLines}` : "rc-content"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
