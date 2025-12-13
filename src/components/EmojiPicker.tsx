// src/components/EmojiPicker.tsx
import React, { useMemo, useState } from "react";
import { EMOJI_MAP } from "../pkg/emojiMap";
import { EMOJI_PACKS } from "../pkg/emojiCatalog";
import "./EmojiPicker.css";

interface EmojiPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (name: string) => void; // 传回 key（如 gopher_happy）
  anchor?: "left" | "right"; // 贴边方向（可选）
  searchable?: boolean; // 预留搜索（默认 false）
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  open,
  onClose,
  onSelect,
  anchor = "left",
  searchable = false,
}) => {
  const [activePack, setActivePack] = useState(EMOJI_PACKS[0]?.id ?? "");
  const [q, setQ] = useState("");

  const activeKeys = useMemo(() => {
    const pack = EMOJI_PACKS.find((p) => p.id === activePack);
    if (!pack) return [];
    let keys = pack.keys.filter((k) => !!EMOJI_MAP[k]);
    if (searchable && q.trim()) {
      const s = q.trim().toLowerCase();
      keys = keys.filter((k) => k.toLowerCase().includes(s));
    }
    return keys;
  }, [activePack, q, searchable]);

  if (!open) return null;

  // 阻止冒泡到 document（否则 Editor 的“点外部关闭”会误判）
  const stopBubble = (
    e:
      | React.MouseEvent<HTMLElement>
      | React.TouchEvent<HTMLElement>
      | React.PointerEvent<HTMLElement>
  ) => {
    e.stopPropagation();
  };

  // 对按钮：既 stopPropagation，也 preventDefault（避免按钮抢 focus 导致输入框/键盘抖动）
  const stopBubbleAndPrevent = (
    e:
      | React.MouseEvent<HTMLElement>
      | React.TouchEvent<HTMLElement>
      | React.PointerEvent<HTMLElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className={`emoji-picker-popover ${anchor}`}
      onMouseDown={stopBubble}
      onTouchStart={stopBubble}
      onPointerDown={stopBubble}
    >
      <div className="ep-header" onMouseDown={stopBubble} onTouchStart={stopBubble}>
        <div className="ep-tabs">
          {EMOJI_PACKS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`ep-tab ${p.id === activePack ? "active" : ""}`}
              onMouseDown={stopBubbleAndPrevent}
              onTouchStart={stopBubbleAndPrevent}
              onPointerDown={stopBubbleAndPrevent}
              onClick={() => setActivePack(p.id)}
              title={p.name}
            >
              {p.icon ?? "🙂"} <span className="ep-tab-text">{p.name}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="ep-close"
          onMouseDown={stopBubbleAndPrevent}
          onTouchStart={stopBubbleAndPrevent}
          onPointerDown={stopBubbleAndPrevent}
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {searchable && (
        <div className="ep-search" onMouseDown={stopBubble} onTouchStart={stopBubble}>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search..."
            onMouseDown={stopBubble}
            onTouchStart={stopBubble}
          />
        </div>
      )}

      <div className="ep-grid" onMouseDown={stopBubble} onTouchStart={stopBubble}>
        {activeKeys.map((k) => (
          <button
            key={k}
            type="button"
            className="ep-item"
            title={k}
            onMouseDown={stopBubbleAndPrevent}
            onTouchStart={stopBubbleAndPrevent}
            onPointerDown={stopBubbleAndPrevent}
            onClick={() => onSelect(k)}
          >
            <img className="ep-img" src={EMOJI_MAP[k]} alt={k} draggable={false} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
