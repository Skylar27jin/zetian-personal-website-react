// src/pages/settings/SettingsPage.tsx
import { useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Spinner,
} from "react-bootstrap";
import { motion } from "framer-motion";

import Navbar from "../../components/Navbar";
import { useMeAuth } from "../../hooks/useMeAuth";
import { LogoutUser, uploadAvatar } from "../../api/userApi";
import Cropper, { Area } from "react-easy-crop";
import { getCroppedImg } from "../../pkg/cropImage";

export default function SettingsPage() {
  const navigate = useNavigate();
  const {
    userId,
    username,
    email,
    avatarUrl,
    authLoading,
    clearAuth,
    refreshMe,
  } = useMeAuth();

  const isLoggedIn = !!userId;

  // Crop state
  const [rawImageUrl, setRawImageUrl] = useState<string>(""); // object URL for cropper
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // Top avatar preview
  const [finalPreviewUrl, setFinalPreviewUrl] = useState<string>("");

  // Logout
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  // Choose avatar file
  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    // Clean previous object URL if any
    if (!file) {
      if (rawImageUrl) URL.revokeObjectURL(rawImageUrl);
      setRawImageUrl("");
      setUploadMsg(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadMsg("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadMsg("Max file size is 5MB.");
      return;
    }

    if (rawImageUrl) {
      URL.revokeObjectURL(rawImageUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setRawImageUrl(objectUrl);
    setUploadMsg(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  }

  // Cropper callback
  const onCropComplete = (_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  };

  // Crop + upload
  async function handleCropAndUpload(e: FormEvent) {
    e.preventDefault();
    if (!rawImageUrl || !croppedAreaPixels || uploading) return;

    setUploading(true);
    setUploadMsg(null);
    try {
      const blob = await getCroppedImg(rawImageUrl, croppedAreaPixels);

      // Local preview
      if (finalPreviewUrl) {
        URL.revokeObjectURL(finalPreviewUrl);
      }
      const previewUrl = URL.createObjectURL(blob);
      setFinalPreviewUrl(previewUrl);

      // Upload to backend
      await uploadAvatar(blob);

      // Refresh /me
      await refreshMe();

      setUploadMsg("Avatar updated.");
      URL.revokeObjectURL(rawImageUrl);
      setRawImageUrl("");
    } catch (err: any) {
      setUploadMsg(err?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  // Logout
  async function handleLogout() {
    if (logoutLoading) return;
    setLogoutLoading(true);
    setLogoutError(null);

    try {
      await LogoutUser({});
    } catch (err: any) {
      setLogoutError(err?.message || "Logout request failed, local state will be cleared.");
    } finally {
      clearAuth();
      setLogoutLoading(false);
      navigate("/login");
    }
  }

  // Go to reset password page
  function handleGoResetPassword() {
    navigate("/reset-password");
  }

  // Which avatar to show
  const avatarToShow =
    finalPreviewUrl || avatarUrl || "https://placehold.co/80x80?text=Avatar";

  return (
    <>
      <Navbar />
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="mb-3">User Settings</h2>

              {/* User info */}
              <Card className="mb-4">
                <Card.Body className="d-flex align-items-center" style={{ gap: 16 }}>
                  <div>
                    <img
                      src={avatarToShow}
                      alt="avatar"
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1px solid #ddd",
                      }}
                    />
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold">
                      {authLoading ? "Loading..." : username || "Guest"}
                    </div>
                    <div className="text-muted small">
                      {email || "No email"}
                    </div>
                    {isLoggedIn && (
                      <div className="text-muted small mt-1">
                        ID: <code>{userId}</code>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>

              {/* Avatar settings */}
              <Card className="mb-3">
                <Card.Header>Avatar</Card.Header>
                <Card.Body>
                  <Form onSubmit={handleCropAndUpload}>
                    <Form.Group controlId="avatarFile" className="mb-3">
                      <Form.Label>Choose image</Form.Label>
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                      <Form.Text muted>Max size 5MB.</Form.Text>
                    </Form.Group>

                    {rawImageUrl && (
                      <div className="mb-3">
                        <div className="mb-2">Crop</div>
                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            maxWidth: 320,
                            height: 320,
                            background: "#000",
                            borderRadius: 16,
                            overflow: "hidden",
                          }}
                        >
                          <Cropper
                            image={rawImageUrl}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                          />
                        </div>

                        <div className="mt-3">
                          <Form.Label>Zoom</Form.Label>
                          <Form.Range
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    )}

                    {uploadMsg && (
                      <Alert
                        variant={
                          uploadMsg.toLowerCase().includes("update") ||
                          uploadMsg.toLowerCase().includes("success")
                            ? "success"
                            : "danger"
                        }
                        className="py-2"
                      >
                        {uploadMsg}
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!rawImageUrl || uploading}
                    >
                      {uploading && (
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                      )}
                      {uploading ? "Uploading..." : "Crop & Upload"}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>

              {/* Security */}
              <Card className="mb-3">
                <Card.Header>Security</Card.Header>
                <Card.Body>
                  <Button variant="outline-secondary" onClick={handleGoResetPassword}>
                    Reset password
                  </Button>
                </Card.Body>
              </Card>

              {/* Logout */}
              <Card>
                <Card.Header>Logout</Card.Header>
                <Card.Body>
                  {logoutError && (
                    <Alert variant="danger" className="py-2">
                      {logoutError}
                    </Alert>
                  )}
                  <Button
                    variant="danger"
                    onClick={handleLogout}
                    disabled={logoutLoading || !isLoggedIn}
                  >
                    {logoutLoading && (
                      <Spinner
                        animation="border"
                        size="sm"
                        className="me-2"
                      />
                    )}
                    Logout
                  </Button>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </>
  );
}
