// src/components/PostMediaUploader.tsx
import React, { useEffect, useState, ChangeEvent } from "react";
import { Form, Button } from "react-bootstrap";

interface PostMediaUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

const PostMediaUploader: React.FC<PostMediaUploaderProps> = ({
  files,
  onFilesChange,
}) => {
  const [previews, setPreviews] = useState<string[]>([]);

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

    // 追加模式：原来有的 + 新选的
    const newFiles = [...files, ...Array.from(list)];
    onFilesChange(newFiles);
  };

  const handleRemove = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    onFilesChange(next);
  };

  const handleClearAll = () => {
    onFilesChange([]);
  };

  return (
    <Form.Group className="mb-4">
      <Form.Label>Images (optional)</Form.Label>
      <Form.Control
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
      />
      <Form.Text className="text-muted d-block mb-2">
        You can select multiple images. They will be uploaded when you submit
        the post.
      </Form.Text>

      {files.length > 0 && (
        <div className="mt-2">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="small text-muted">
              Selected images: <b>{files.length}</b>
            </span>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleClearAll}
            >
              Clear all
            </Button>
          </div>

          <div
            className="d-flex flex-wrap gap-2"
            style={{ maxHeight: 200, overflowY: "auto" }}
          >
            {previews.map((url, idx) => (
              <div
                key={url}
                className="position-relative"
                style={{ width: 96, height: 96 }}
              >
                <img
                  src={url}
                  alt={`preview-${idx}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 6,
                    border: "1px solid #eee",
                  }}
                />
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
              </div>
            ))}
          </div>
        </div>
      )}
    </Form.Group>
  );
};

export default PostMediaUploader;
