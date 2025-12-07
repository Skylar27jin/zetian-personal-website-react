// src/pages/settings/SettingsProfilePage.tsx
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
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
import { useMyProfile } from "../../hooks/useMyProfile";
import {
  uploadAvatar,
  uploadBackground,
  resetUsername,
  updateSchool,
  updateDescription,
  getUserProfile,
} from "../../api/userApi";

import Cropper, { Area } from "react-easy-crop";
import { getCroppedImg } from "../../pkg/cropImage";

export default function SettingsProfilePage() {
  const {
    userId,
    username,
    email,
    avatarUrl,
    authLoading,
    refreshMe,
  } = useMeAuth();

  const isLoggedIn = !!userId;

  // ====== Profile 数据，用于显示 / 编辑 ======
  const enabledProfile = !!userId && !authLoading;
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    setProfile,
  } = useMyProfile(userId ?? null, enabledProfile);

  // Profile 编辑表单
  const [displayName, setDisplayName] = useState("");
  const [school, setSchool] = useState("");
  const [description, setDescription] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.userName || "");
      setSchool(profile.school || "");
      setDescription(profile.description || "");
    }
  }, [profile]);

  // ====== Avatar 裁剪上传 ======
  const [rawImageUrl, setRawImageUrl] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // Top avatar preview
  const [finalPreviewUrl, setFinalPreviewUrl] = useState<string>("");

  // ====== 背景图裁剪上传 ======
  const [bgRawImageUrl, setBgRawImageUrl] = useState<string>("");
  const [bgCrop, setBgCrop] = useState({ x: 0, y: 0 });
  const [bgZoom, setBgZoom] = useState(1);
  const [bgCroppedAreaPixels, setBgCroppedAreaPixels] = useState<Area | null>(
    null
  );
  const [bgUploading, setBgUploading] = useState(false);
  const [bgMsg, setBgMsg] = useState<string | null>(null);


  // 选择头像文件
  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

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

  const onCropComplete = (_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  };

  // Crop + upload avatar
  async function handleCropAndUpload(e: FormEvent) {
    e.preventDefault();
    if (!rawImageUrl || !croppedAreaPixels || uploading) return;

    setUploading(true);
    setUploadMsg(null);
    try {
      const blob = await getCroppedImg(rawImageUrl, croppedAreaPixels);

      if (finalPreviewUrl) {
        URL.revokeObjectURL(finalPreviewUrl);
      }
      const previewUrl = URL.createObjectURL(blob);
      setFinalPreviewUrl(previewUrl);

      await uploadAvatar(blob);
      await refreshMe(); // navbar 头像 / 名字

      setUploadMsg("Avatar updated.");
      URL.revokeObjectURL(rawImageUrl);
      setRawImageUrl("");
    } catch (err: any) {
      setUploadMsg(err?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  // 哪个头像显示
  const avatarToShow =
    finalPreviewUrl || avatarUrl || "https://placehold.co/80x80?text=Avatar";

  // ====== 保存 Profile（用户名 / 学校 / 简介） ======
  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!profile || !userId) return;
    if (profileSaving) return;

    setProfileSaving(true);
    setProfileMsg(null);

    try {
      const trimmedName = displayName.trim();
      const trimmedSchool = school.trim();
      const trimmedDesc = description.trim();

      let anyChange = false;

      if (trimmedName && trimmedName !== profile.userName) {
        const resp = await resetUsername({ user_name: trimmedName });
        if (!resp.isSuccessful) {
          throw new Error(resp.errorMessage || "Failed to reset username.");
        }
        anyChange = true;
      }

      if (trimmedSchool !== (profile.school || "")) {
        const resp = await updateSchool({ school: trimmedSchool });
        if (!resp.isSuccessful) {
          throw new Error(resp.errorMessage || "Failed to update school.");
        }
        anyChange = true;
      }

      if (trimmedDesc !== (profile.description || "")) {
        const resp = await updateDescription({ description: trimmedDesc });
        if (!resp.isSuccessful) {
          throw new Error(
            resp.errorMessage || "Failed to update description."
          );
        }
        anyChange = true;
      }

      if (anyChange) {
        const nextProfile = {
          ...profile,
          userName: trimmedName || profile.userName,
          school: trimmedSchool,
          description: trimmedDesc,
        };
        setProfile(nextProfile as any);

        await refreshMe();
        setProfileMsg("Profile updated.");
      } else {
        setProfileMsg("No changes to save.");
      }
    } catch (err: any) {
      setProfileMsg(err?.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  // ====== 背景图：选择文件 ======
  function handleBackgroundChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) {
      if (bgRawImageUrl) URL.revokeObjectURL(bgRawImageUrl);
      setBgRawImageUrl("");
      setBgMsg(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setBgMsg("Please select an image file.");
      if (bgRawImageUrl) URL.revokeObjectURL(bgRawImageUrl);
      setBgRawImageUrl("");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setBgMsg("Max file size is 10MB.");
      if (bgRawImageUrl) URL.revokeObjectURL(bgRawImageUrl);
      setBgRawImageUrl("");
      return;
    }

    // 清掉旧的 object URL
    if (bgRawImageUrl) {
      URL.revokeObjectURL(bgRawImageUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setBgRawImageUrl(objectUrl);
    setBgMsg(null);
    setBgZoom(1);
    setBgCrop({ x: 0, y: 0 });
    setBgCroppedAreaPixels(null);
  }

  // 背景图 Cropper 回调
  const onBgCropComplete = (_: Area, croppedPixels: Area) => {
    setBgCroppedAreaPixels(croppedPixels);
  };

  // 背景图裁剪 + 上传
  async function handleCropAndUploadBackground(e: FormEvent) {
    e.preventDefault();
    if (!bgRawImageUrl || !bgCroppedAreaPixels || bgUploading) return;

    setBgUploading(true);
    setBgMsg(null);

    try {
      // 用和头像一样的工具裁剪，只是裁剪区域是 16:9
      const blob = await getCroppedImg(bgRawImageUrl, bgCroppedAreaPixels);

      const resp = await uploadBackground(blob);
      if (!resp.isSuccessful) {
        throw new Error(resp.errorMessage || "Upload background failed.");
      }

      // 重新拉一次 profile，拿最新的 backgroundUrl
      if (userId) {
        const fresh = await getUserProfile(userId);
        if (fresh.isSuccessful) {
          setProfile(fresh.user as any);
        }
      }

      setBgMsg("Background updated.");

      // 清理 object URL & 裁剪状态
      URL.revokeObjectURL(bgRawImageUrl);
      setBgRawImageUrl("");
      setBgZoom(1);
      setBgCrop({ x: 0, y: 0 });
      setBgCroppedAreaPixels(null);
    } catch (err: any) {
      setBgMsg(err?.message || "Upload failed.");
    } finally {
      setBgUploading(false);
    }
  }

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
              <h2 className="mb-3">Profile Settings</h2>

              {/* User summary */}
              <Card className="mb-4">
                <Card.Body
                  className="d-flex align-items-center"
                  style={{ gap: 16 }}
                >
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

              {/* Avatar */}
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
                            onChange={(e) =>
                              setZoom(Number(e.target.value))
                            }
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

              {/* Background image */}
              <Card className="mb-3">
                <Card.Header>Profile background</Card.Header>
                <Card.Body>
                  {/* 当前生效中的背景预览（保持 16:9 大致比例） */}
                  {profile && profile.backgroundUrl && (
                    <div
                      className="rounded mb-3"
                      style={{
                        width: "100%",
                        aspectRatio: "16 / 9", 
                        height: 180,
                        backgroundImage: `url(${profile.backgroundUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  )}

                  <Form onSubmit={handleCropAndUploadBackground}>
                    <Form.Group
                      controlId="backgroundFile"
                      className="mb-3"
                    >
                      <Form.Label>Choose background image</Form.Label>
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={handleBackgroundChange}
                      />
                      <Form.Text muted>Max size 10MB.</Form.Text>
                    </Form.Group>

                    {/* 选了背景之后，显示 16:9 裁剪框 */}
                    {bgRawImageUrl && (
                      <div className="mb-3">
                        <div className="mb-2">Crop</div>
                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            maxWidth: 480,
                            height: 270, // 16:9
                            background: "#000",
                            borderRadius: 16,
                            overflow: "hidden",
                          }}
                        >
                          <Cropper
                            image={bgRawImageUrl}
                            crop={bgCrop}
                            zoom={bgZoom}
                            aspect={16 / 9}
                            cropShape="rect"
                            showGrid={false}
                            onCropChange={setBgCrop}
                            onZoomChange={setBgZoom}
                            onCropComplete={onBgCropComplete}
                          />
                        </div>

                        <div className="mt-3">
                          <Form.Label>Zoom</Form.Label>
                          <Form.Range
                            min={1}
                            max={3}
                            step={0.1}
                            value={bgZoom}
                            onChange={(e) =>
                              setBgZoom(Number(e.target.value))
                            }
                          />
                        </div>
                      </div>
                    )}

                    {bgMsg && (
                      <Alert
                        variant={
                          bgMsg.toLowerCase().includes("update") ||
                          bgMsg.toLowerCase().includes("background updated")
                            ? "success"
                            : "danger"
                        }
                        className="py-2"
                      >
                        {bgMsg}
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={
                        !bgRawImageUrl || !bgCroppedAreaPixels || bgUploading
                      }
                    >
                      {bgUploading && (
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                      )}
                      {bgUploading ? "Uploading..." : "Crop & Upload background"}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>

              {/* Profile：display name / school / bio */}
              <Card className="mb-3">
                <Card.Header>Profile</Card.Header>
                <Card.Body>
                  {profileError && (
                    <Alert variant="danger" className="py-2">
                      {profileError}
                    </Alert>
                  )}

                  <Form onSubmit={handleSaveProfile}>
                    <Form.Group className="mb-3" controlId="displayName">
                      <Form.Label>Display name</Form.Label>
                      <Form.Control
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your display name"
                        disabled={profileLoading}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="school">
                      <Form.Label>School</Form.Label>
                      <Form.Control
                        type="text"
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        placeholder="e.g. Boston University"
                        disabled={profileLoading}
                      />
                    </Form.Group>

                    <Form.Group
                      className="mb-3"
                      controlId="description"
                    >
                      <Form.Label>Bio</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={description}
                        onChange={(e) =>
                          setDescription(e.target.value)
                        }
                        placeholder="Introduce yourself..."
                        disabled={profileLoading}
                      />
                    </Form.Group>

                    {profileMsg && (
                      <Alert
                        variant={
                          profileMsg.toLowerCase().includes("update") ||
                          profileMsg.toLowerCase().includes("no changes")
                            ? "success"
                            : "danger"
                        }
                        className="py-2"
                      >
                        {profileMsg}
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={profileLoading || profileSaving}
                    >
                      {profileSaving && (
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                      )}
                      {profileSaving ? "Saving..." : "Save profile"}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </>
  );
}