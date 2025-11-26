// src/components/PostEditModal.tsx
import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import type { Post } from "../types/post";
import Editor from "./Editor";

interface PostEditModalProps {
  show: boolean;
  onClose: () => void;
  initial?: Pick<Post, "id" | "title" | "content">; // 编辑时传入
  onSubmit: (p: { id?: number; title: string; content: string }) => Promise<void>;
  submitting?: boolean;
}

export default function PostEditModal({
  show, onClose, initial, onSubmit, submitting,
}: PostEditModalProps) {
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || ""); // 占位符文本 :emoji_xxx:

  useEffect(() => {
    setTitle(initial?.title || "");
    setContent(initial?.content || "");
  }, [initial, show]);

  const handleSubmit = async () => {
    await onSubmit({ id: initial?.id, title: title.trim(), content: content });
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{initial ? "Edit Post" : "Create Post"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title..."
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Content</Form.Label>
          <Editor
            value={content}
            onChange={setContent}               // 这里回传的依然是占位符文本
            placeholder="Write something… (supports :emoji_gopher_happy: )"
            minRows={6}
            autoFocus
          />
          <Form.Text className="text-muted">
            Emoji 会在输入时自动转图片，保存时存占位符（:emoji_xxx:）。
          </Form.Text>
        </Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="dark" onClick={handleSubmit} disabled={submitting || !title.trim()}>
          {submitting ? (<><Spinner size="sm" className="me-2" />Saving…</>) : "Save"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
