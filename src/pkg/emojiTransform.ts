import { EMOJI_MAP } from "./emojiMap";

// 防 XSS 的转义
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 把 :emoji_xxx: → <img ...>（展示侧用；保持单行，避免属性行被渲染为文本）
export function plainToHtml(value: string): string {
  const escaped = escapeHtml(value || "");

  const withEmoji = escaped.replace(
    /:emoji_([a-zA-Z0-9_]+):/g,
    (_, name: string) => {
      const src = EMOJI_MAP[name] ?? `/gophers_emojis/${name}.png`;
      // 不在展示侧使用 contenteditable，避免奇怪行为
      // 保持单行、无缩进、无多余空格
      return `<img src="${src}" data-emoji="${name}" class="emoji-inline" alt="${name}" />`;
    }
  );

  // 换行 → <br>
  return withEmoji.replace(/\r?\n/g, "<br>");
}
