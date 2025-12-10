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
import type { School } from "../../types/school";
import { getAllSchools } from "../../api/schoolApi";

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

  // 选中的标准学校 ID（0 表示没有绑定标准学校）
  const [schoolId, setSchoolId] = useState<number>(0);

  // 学校选择模式：existing = 从列表选；custom = 自定义输入
  const [schoolMode, setSchoolMode] = useState<"existing" | "custom">(
    "existing"
  );

  // 搜索框里的关键词（用于筛选标准学校）
  const [schoolSearch, setSchoolSearch] = useState("");

  // 自定义学校名称（如果不能在列表里找到）
  const [customSchool, setCustomSchool] = useState("");

  // 学校列表 & 加载状态
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolError, setSchoolError] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // 根据 profile 初始化表单
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.userName || "");
      setDescription(profile.description || "");

      const pid = profile.schoolId ?? 0;
      setSchoolId(pid);

      if (pid > 0) {
        // 有标准学校：默认使用“已有学校”模式
        setSchoolMode("existing");
        setSchoolSearch(profile.school || "");
        setCustomSchool("");
      } else {
        // 没有标准学校：默认使用“自定义学校”模式
        setSchoolMode("custom");
        setSchoolSearch("");
        setCustomSchool(profile.school || "");
      }
    }
  }, [profile]);

  // 加载学校列表
  useEffect(() => {
    let cancelled = false;

    async function loadSchools() {
      try {
        setSchoolsLoading(true);
        setSchoolError(null);

        const resp = await getAllSchools();
        if (cancelled) return;

        if (!resp.isSuccessful) {
          setSchoolError(resp.errorMessage || "Failed to load schools");
          return;
        }

        setSchools(resp.Schools || []);
      } catch (e: any) {
        if (!cancelled) {
          setSchoolError(e?.message || "Network error while loading schools");
        }
      } finally {
        if (!cancelled) {
          setSchoolsLoading(false);
        }
      }
    }

    loadSchools();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const filteredSchools = schools.filter((s) => {
    if (!schoolSearch.trim()) return true;
    const q = schoolSearch.trim().toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.short_name || "").toLowerCase().includes(q) ||
      (s.aliases || []).some((a) => a.toLowerCase().includes(q))
    );
  });

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
      const trimmedDesc = description.trim();
      const trimmedCustomSchool = customSchool.trim();

      let anyChange = false;

      // 1) Username
      if (trimmedName && trimmedName !== profile.userName) {
        const resp = await resetUsername({ user_name: trimmedName });
        if (!resp.isSuccessful) {
          throw new Error(resp.errorMessage || "Failed to reset username.");
        }
        anyChange = true;
      }

      // 2) School（标准学校 + 自定义）
      let nextSchoolToSend = profile.school || "";
      let nextSchoolIdToSend = profile.schoolId ?? 0;

      if (schoolMode === "custom") {
        // 自定义模式：school_id = 0，名称用 customSchool
        nextSchoolToSend = trimmedCustomSchool;
        nextSchoolIdToSend = 0;
      } else {
        // existing 模式：如果选中标准学校，就用标准学校；否则清空
        if (schoolId > 0) {
          const selected = schools.find((s) => s.id === schoolId);
          nextSchoolToSend = selected?.name || profile.school || "";
          nextSchoolIdToSend = schoolId;
        } else {
          nextSchoolToSend = "";
          nextSchoolIdToSend = 0;
        }
      }

      if (
        nextSchoolToSend !== (profile.school || "") ||
        nextSchoolIdToSend !== (profile.schoolId ?? 0)
      ) {
        const resp = await updateSchool({
          school: nextSchoolToSend,
          school_id: nextSchoolIdToSend,
        });
        if (!resp.isSuccessful) {
          throw new Error(resp.errorMessage || "Failed to update school.");
        }
        anyChange = true;
      }

      // 3) Description
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
          school: nextSchoolToSend,
          description: trimmedDesc,
          schoolId: nextSchoolIdToSend,
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

                    {/* School selector + 模式切换 */}
                    <Form.Group className="mb-3" controlId="schoolSelector">
                      <Form.Label>School</Form.Label>

                      <div className="mb-2 d-flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            schoolMode === "existing" ? "primary" : "outline-primary"
                          }
                          onClick={() => setSchoolMode("existing")}
                          disabled={profileLoading}
                        >
                          Choose from list[recommended]
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            schoolMode === "custom" ? "primary" : "outline-primary"
                          }
                          onClick={() => setSchoolMode("custom")}
                          disabled={profileLoading}
                        >
                          Enter custom
                        </Button>
                      </div>

                      {schoolMode === "existing" && (
                        <>
                          <Form.Control
                            type="text"
                            value={schoolSearch}
                            onChange={(e) => {
                              setSchoolSearch(e.target.value);
                            }}
                            placeholder="Type to search your school (e.g. BU, MIT)"
                            disabled={profileLoading}
                          />
                          <div
                            className="border rounded mt-2"
                            style={{
                              maxHeight: "180px",
                              overflowY: "auto",
                              background: "#ffffffff",
                            }}
                          >
                            {schoolsLoading && (
                              <div className="p-2 text-muted small">
                                <Spinner animation="border" size="sm" />{" "}
                                Loading schools...
                              </div>
                            )}

                            {!schoolsLoading && schoolError && (
                              <div className="p-2 text-danger small">
                                {schoolError}
                              </div>
                            )}

                            {!schoolsLoading &&
                              !schoolError &&
                              filteredSchools.length === 0 && (
                                <div className="p-2 text-muted small">
                                  No school matches your search.
                                </div>
                              )}

                            {!schoolsLoading &&
                              !schoolError &&
                              filteredSchools.map((s) => {
                                const selected = s.id === schoolId;
                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    className="w-100 text-start btn btn-sm btn-light"
                                    style={
                                      selected
                                        ? {
                                            backgroundColor: "#f3f3f3",
                                            borderColor: "#e0e0e0",
                                          }
                                        : {}
                                    }
                                    onClick={() => {
                                      setSchoolId(s.id);
                                      setSchoolSearch(s.short_name || s.name);
                                    }}
                                  >
                                    <strong>{s.short_name || s.name}</strong>{" "}
                                    <span className="text-muted small">
                                      · {s.name} · id={s.id}
                                    </span>
                                  </button>
                                );
                              })}
                          </div>
                          <Form.Text className="text-muted">
                            Pick a school from the list above.
                          </Form.Text>
                        </>
                      )}

                      {schoolMode === "custom" && (
                        <>
                          <Form.Control
                            type="text"
                            value={customSchool}
                            onChange={(e) => setCustomSchool(e.target.value)}
                            placeholder="e.g. Some Unknown College"
                            disabled={profileLoading}
                          />
                          <Form.Text className="text-muted">
                            This custom name will be used when your school is not in
                            the list above.
                          </Form.Text>
                        </>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="description">
                      <Form.Label>Bio</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
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
