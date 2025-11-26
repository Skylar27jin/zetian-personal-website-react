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
  }, [activePack, q]);

  if (!open) return null;

  return (
    <div className={`emoji-picker-popover ${anchor}`}>
      <div className="ep-header">
        <div className="ep-tabs">
          {EMOJI_PACKS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`ep-tab ${p.id === activePack ? "active" : ""}`}
              onClick={() => setActivePack(p.id)}
              title={p.name}
            >
              {p.icon ?? "🙂"} <span className="ep-tab-text">{p.name}</span>
            </button>
          ))}
        </div>
        <button className="ep-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      {searchable && (
        <div className="ep-search">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search..."
          />
        </div>
      )}

      <div className="ep-grid">
        {activeKeys.map((k) => (
          <button
            key={k}
            type="button"
            className="ep-item"
            title={k}
            onClick={() => onSelect(k)}
          >
            <img className="ep-img" src={EMOJI_MAP[k]} alt={k} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
