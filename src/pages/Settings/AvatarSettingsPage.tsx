// src/pages/settings/AvatarSettingsPage.tsx
import React, { useState } from "react";
import { useMeAuth } from "../../hooks/useMeAuth";
import { uploadAvatar } from "../../api/userApi";
import { Button, Form, Alert, Spinner, Container } from "react-bootstrap";

export default function AvatarSettingsPage() {
  const { avatarUrl, username, setMe } = useMeAuth() as any;

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // 本地预览
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setError("");
    setSuccess("");

    // 自动上传（也可以改成点按钮上传）
    upload(file);
  }

  async function upload(file: File) {
    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const resp = await uploadAvatar(file);

      if (!resp.isSuccessful) {
        setError(resp.errorMessage || "Upload failed");
        return;
      }

      const newUrl = resp.avatar_url || "";

      // 更新前端的 auth 状态
      setMe((prev: any) => ({
        ...prev,
        avatarUrl: newUrl,
      }));

      setSuccess("Avatar updated successfully!");
      setPreviewUrl(null);
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Container className="py-4" style={{ maxWidth: 480 }}>
      <h3 className="mb-3">Update Avatar</h3>

      <div className="text-center mb-4">
        <img
          src={previewUrl || avatarUrl || "/default-gopher.png"}
          alt="avatar"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            objectFit: "cover",
            border: "3px solid #eee",
          }}
        />
        <div className="mt-2 text-muted small">
          {previewUrl ? "Preview" : username}
        </div>
      </div>

      <Form.Group controlId="avatarUpload" className="mb-3">
        <Form.Label>Choose new avatar</Form.Label>
        <Form.Control
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
      </Form.Group>

      {uploading && (
        <div className="my-2">
          <Spinner animation="border" size="sm" /> Uploading...
        </div>
      )}

      {error && (
        <Alert variant="danger" className="mt-2">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mt-2">
          {success}
        </Alert>
      )}

      <Button
        variant="secondary"
        className="mt-3"
        onClick={() => (window.location.href = "/me")}
      >
        Back to Profile
      </Button>
    </Container>
  );
}
