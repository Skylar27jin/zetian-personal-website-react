// src/components/ViewMedia.tsx
import React, { useEffect, useState } from "react";
import "./ViewMedia.css";

interface ViewMediaProps {
  open: boolean;
  mediaType: "image" | "video";
  mediaUrls: string[];
  initialIndex?: number;
  onClose: () => void;
}

const ViewMedia: React.FC<ViewMediaProps> = ({
  open,
  mediaType,
  mediaUrls,
  initialIndex = 0,
  onClose,
}) => {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) {
      setIndex(initialIndex);
    }
  }, [open, initialIndex]);

  // 键盘快捷键：Esc 关闭，← / → 切换
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (!open || !mediaUrls.length) return null;

  const prev = () => {
    setIndex((i) => (i - 1 + mediaUrls.length) % mediaUrls.length);
  };

  const next = () => {
    setIndex((i) => (i + 1) % mediaUrls.length);
  };

  const current = mediaUrls[index];

  const handleOverlayClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    // 点击黑色背景关闭；点击内容区域不关闭
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="view-media-overlay" onClick={handleOverlayClick}>
      {/* 关闭按钮 */}
      <button className="view-media-close" onClick={onClose}>
        ×
      </button>

      {/* 左右箭头 */}
      {mediaUrls.length > 1 && (
        <>
          <button
            className="view-media-arrow view-media-arrow-left"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
          >
            ‹
          </button>
          <button
            className="view-media-arrow view-media-arrow-right"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
          >
            ›
          </button>
        </>
      )}

      {/* 中间内容 */}
      <div className="view-media-inner">
        {mediaType === "image" ? (
          <img src={current} alt={`media-${index}`} className="view-media-img" />
        ) : (
          <video
            src={current}
            controls
            className="view-media-video"
            autoPlay
          />
        )}
      </div>

      {/* 底部计数 */}
      {mediaUrls.length > 1 && (
        <div className="view-media-counter">
          {index + 1}/{mediaUrls.length}
        </div>
      )}
    </div>
  );
};

export default ViewMedia;
