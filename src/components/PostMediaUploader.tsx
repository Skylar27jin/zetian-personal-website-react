// src/components/PostMediaUploader.tsx
import React, {
  useEffect,
  useState,
  ChangeEvent,
  DragEvent,
} from "react";
import { Form, Button } from "react-bootstrap";
import ViewMedia from "./ViewMedia";

interface PostMediaUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

const MAX_FILES = 20;

const PostMediaUploader: React.FC<PostMediaUploaderProps> = ({
  files,
  onFilesChange,
}) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // 检测是否为触屏设备（移动端）
  useEffect(() => {
    if (typeof window !== "undefined") {
      const touch =
        "ontouchstart" in window ||
        (navigator as any).maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0;
      setIsTouchDevice(!!touch);
    }
  }, []);

  // 根据 files 生成预览 URL
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;

    const incoming = Array.from(list);
    const remaining = MAX_FILES - files.length;
    if (remaining <= 0) {
      return;
    }

    const toAdd = incoming.slice(0, remaining);
    const newFiles = [...files, ...toAdd];
    onFilesChange(newFiles);

    // 允许重复选择同一批文件
    e.target.value = "";
  };

  const handleRemove = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    onFilesChange(next);
  };

  // 通用移动函数：from -> to
  const moveFile = (from: number, to: number) => {
    if (to < 0 || to >= files.length) return;
    const reordered = [...files];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    onFilesChange(reordered);
  };

  // ---------- 桌面端拖拽 ----------

  const handleDragStart =
    (idx: number) => (e: DragEvent<HTMLDivElement>) => {
      if (isTouchDevice) return;
      setDraggingIndex(idx);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(idx));
    };

  const handleDragEnter =
    (idx: number) => (e: DragEvent<HTMLDivElement>) => {
      if (isTouchDevice) return;
      e.preventDefault();
      if (draggingIndex === null || draggingIndex === idx) return;
      moveFile(draggingIndex, idx);
      setDraggingIndex(idx);
    };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (isTouchDevice) return;
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    if (isTouchDevice) return;
    e.preventDefault();
    setDraggingIndex(null);
  };

  const handleDragEnd = () => {
    if (isTouchDevice) return;
    setDraggingIndex(null);
  };

  return (
    <Form.Group className="mb-4">
      <Form.Label>Images (optional)</Form.Label>
      <Form.Control
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        disabled={files.length >= MAX_FILES}
      />
      <Form.Text className="text-muted d-block mb-1">
        You can upload up to <b>{MAX_FILES}</b> images.
        {files.length >= MAX_FILES && " (max reached)"}
      </Form.Text>

      {files.length > 0 && (
        <div className="mt-2">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="small text-muted">
              Selected images: <b>{files.length}</b> / {MAX_FILES}
            </span>
            {!isTouchDevice && (
              <span className="small text-muted">
                Drag thumbnails to reorder.
              </span>
            )}
            {isTouchDevice && (
              <span className="small text-muted">
                Tap arrows on each thumbnail to reorder.
              </span>
            )}
          </div>

          <div
            className="d-flex flex-wrap gap-2"
            style={{ maxHeight: 220, overflowY: "auto" }}
          >
            {previews.map((url, idx) => {
              const isDragging = draggingIndex === idx;
              const canDrag = !isTouchDevice && files.length > 1;

              return (
                <div
                  key={url + idx}
                  className="position-relative"
                  style={{
                    width: 96,
                    height: 96,
                    cursor: canDrag ? "grab" : "default",
                    opacity: isDragging ? 0.6 : 1,
                    borderRadius: 8,
                    border: "1px solid #eee",
                  }}
                  draggable={canDrag}
                  onDragStart={handleDragStart(idx)}
                  onDragEnter={handleDragEnter(idx)}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                >
                  <img
                    src={url}
                    alt={`preview-${idx}`}
                    draggable={false} // 避免默认拖图片
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 6,
                    }}
                    onClick={() => {
                      setViewerIndex(idx);
                      setViewerOpen(true);
                    }}
                  />

                  <ViewMedia
                  open={viewerOpen}
                  mediaType="image"
                  mediaUrls={previews} // 这里是本地 blob 预览
                  initialIndex={viewerIndex}
                  onClose={() => setViewerOpen(false)}
                />

                  {/* 删除按钮 */}
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => handleRemove(idx)}
                    className="position-absolute top-0 end-0 p-0 px-1"
                    style={{
                      transform: "translate(30%, -30%)",
                      borderRadius: "999px",
                      border: "1px solid #ccc",
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </Button>

                  {/* 移动端：左右箭头按钮重排 */}
                  {isTouchDevice && files.length > 1 && (
                    <div
                      className="position-absolute bottom-0 start-0 end-0 d-flex justify-content-center gap-1 mb-1"
                      style={{ pointerEvents: "auto" }}
                    >
                      <Button
                        variant="light"
                        size="sm"
                        disabled={idx === 0}
                        onClick={() => moveFile(idx, idx - 1)}
                        className="py-0 px-1"
                        style={{
                          borderRadius: "999px",
                          border: "1px solid #ccc",
                          fontSize: "0.7rem",
                          lineHeight: 1,
                        }}
                      >
                        ←
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        disabled={idx === files.length - 1}
                        onClick={() => moveFile(idx, idx + 1)}
                        className="py-0 px-1"
                        style={{
                          borderRadius: "999px",
                          border: "1px solid #ccc",
                          fontSize: "0.7rem",
                          lineHeight: 1,
                        }}
                      >
                        →
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Form.Group>
  );
};

export default PostMediaUploader;
