// src/components/ScrollablePanel.tsx
import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type CSSProperties,
} from "react";

export interface ScrollablePanelProps {
  children: ReactNode;

  /** 内容区域最大高度（默认 70vh，适合详情页） */
  maxHeight?: string | number;

  /** 是否显示底部进度条（默认 true） */
  showProgress?: boolean;

  /** 外层容器 className */
  className?: string;

  /** 外层容器 style */
  style?: CSSProperties;
}

/**
 * 可滚动 + 进度条：
 * - 内容超过 maxHeight 时出现滚动条
 * - 只有在真的“可滚动”时才显示进度条
 */
export default function ScrollablePanel({
  children,
  maxHeight = "70vh",
  showProgress = true,
  className,
  style,
}: ScrollablePanelProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0); // 0~100
  const [isScrollable, setIsScrollable] = useState(false);

  // 内容滚动时，更新进度条
  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;

    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) {
      setProgress(0);
      return;
    }

    const percent = (el.scrollTop / maxScroll) * 100;
    setProgress(percent);
  }, []);

  // 拖动进度条时，控制内容滚动
  const handleSliderChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const el = contentRef.current;
    if (!el) return;

    const val = Number(e.target.value); // 0~100
    const maxScroll = el.scrollHeight - el.clientHeight;
    el.scrollTop = (val / 100) * maxScroll;
    setProgress(val);
  };

  // 检测内容是否需要滚动
  const recomputeScrollable = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;

    const hasScroll = el.scrollHeight > el.clientHeight + 1;
    setIsScrollable(hasScroll);

    if (!hasScroll) {
      setProgress(0);
    }
  }, []);

  // 初次渲染 & children / maxHeight 变化时判断
  useEffect(() => {
    // 下一帧再测，确保布局完成
    const id = window.requestAnimationFrame(recomputeScrollable);
    return () => window.cancelAnimationFrame(id);
  }, [children, maxHeight, recomputeScrollable]);

  // 窗口尺寸变化时也重新判断
  useEffect(() => {
    const onResize = () => recomputeScrollable();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [recomputeScrollable]);

  return (
    <div className={className} style={style}>
      <div
        ref={contentRef}
        onScroll={handleScroll}
        className="scrollable-panel-content"
        style={{
          maxHeight,        // 始终限制最大高度
          overflowY: "auto", // 内容不够高时不会出现滚动条
          paddingRight: 4,
        }}
      >
        {children}
      </div>

      {showProgress && isScrollable && (
        <div className="mt-2">
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={handleSliderChange}
            style={{ width: "100%" }}
          />
          <div className="text-muted small mt-1 text-end">
            {Math.round(progress)}%
          </div>
        </div>
      )}
    </div>
  );
}