// src/pages/CreatePostPage.tsx
import React, { useEffect, useState } from "react";
import { createPost, uploadPostMedia } from "../api/postApi";
import type { CreatePostReq, CreatePostResp } from "../types/post";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Form,
  Button,
  Spinner,
  Alert,
  Card,
} from "react-bootstrap";
import Navbar from "../components/Navbar";
import { getAllSchools } from "../api/schoolApi";
import type { School } from "../types/school";
import { getAllCategories } from "../api/categoryApi";
import type { Category } from "../types/category";
import Editor from "../components/Editor";
import PostMediaUploader from "../components/PostMediaUploader";

const LS_KEYS = {
  userId: "me:id",
  email: "me:email",
  username: "me:username",
} as const;

type ReplyToPostState = {
  replyToPost?: {
    id: number;
    title: string;
    userName?: string | null;
  };
};

export default function CreatePostPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();

  const locationState = (routerLocation.state || {}) as ReplyToPostState;
  const replyToPost = locationState.replyToPost;

  const [replyToId] = useState<number | null>(replyToPost?.id ?? null);

  // -----------------------------
  // basic fields
  // -----------------------------
  const [schoolId, setSchoolId] = useState<number | null>(1);
  const [categoryId, setCategoryId] = useState<number | null>(1); // 默认 General
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [location, setLocation] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  // tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 学校相关
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState("");

  // 板块相关
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // -----------------------------
  // 加载学校列表 /school/all
  // -----------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setSchoolsLoading(true);
        const resp = await getAllSchools();
        if (cancelled) return;

        if (!resp.isSuccessful) {
          console.warn("getAllSchools failed:", resp.errorMessage);
          return;
        }

        setSchools(resp.Schools || []);
      } catch (e) {
        console.error("getAllSchools error:", e);
      } finally {
        if (!cancelled) {
          setSchoolsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // -----------------------------
  // 加载板块列表 /category/all
  // -----------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setCategoriesLoading(true);
        const resp = await getAllCategories();
        if (cancelled) return;

        if (!resp.isSuccessful) {
          console.warn("getAllCategories failed:", resp.errorMessage);
          return;
        }

        setCategories(resp.categories || []);
      } catch (e) {
        console.error("getAllCategories error:", e);
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // -----------------------------
  // 提交
  // -----------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const userIdStr = localStorage.getItem(LS_KEYS.userId);
    if (!userIdStr) {
      setMessage("You must be logged in to create a post.");
      return;
    }
    const userId = Number(userIdStr);
    if (Number.isNaN(userId)) {
      setMessage("Invalid user id.");
      return;
    }

    if (!schoolId) {
      setMessage("Please select a school.");
      return;
    }

    if (!title.trim() || !content.trim()) {
      setMessage("Title and content cannot be empty.");
      return;
    }

    try {
      setLoading(true);

      // 1) 上传图片
      let mediaUrls: string[] = [];
      if (mediaFiles.length > 0) {
        setMessage("Uploading images to S3…");
        mediaUrls = await uploadPostMedia(mediaFiles);
      }

      const mediaType: "text" | "image" | "video" =
        mediaUrls.length > 0 ? "image" : "text";

      // 2) 构造请求
      const req: CreatePostReq = {
        user_id: userId,
        school_id: schoolId,
        title,
        content,
        media_type: mediaType,
      };

      if (location.trim().length > 0) {
        req.location = location.trim();
      }
      if (tags.length > 0) {
        req.tags = tags;
      }
      if (mediaUrls.length > 0) {
        req.media_urls = mediaUrls;
      }
      if (categoryId && categoryId > 0) {
        // 需要在 types/post.ts 里给 CreatePostReq 加上可选字段 category_id?: number;
        (req as any).category_id = categoryId;
      }
      if (replyToId && replyToId > 0) {
        // 后端已经支持 reply_to
        (req as any).reply_to = replyToId;
      }

      setMessage("Creating post…");
      const resp: CreatePostResp = await createPost(req);

      if (resp.isSuccessful) {
        setMessage(
          `✅ Post created successfully!\n Returning to ${localStorage.getItem(
            LS_KEYS.username
          )}'s index~`
        );
        // 清空表单
        setTitle("");
        setContent("");
        setLocation("");
        setTags([]);
        setTagInput("");
        setMediaFiles([]);
        setCategoryId(1);

        setTimeout(() => navigate("/me"), 3000);
      } else {
        setMessage(`❌ Failed: ${resp.errorMessage}`);
      }
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // 学校搜索的前端过滤逻辑
  // -----------------------------
  const filteredSchools = schools.filter((s) => {
    if (!schoolSearch.trim()) return true;
    const q = schoolSearch.trim().toLowerCase();
    const shortName = (s.short_name || "").toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      shortName.includes(q) ||
      (s.aliases || []).some((a) => a.toLowerCase().includes(q))
    );
  });

  // -----------------------------
  // tags 输入
  // -----------------------------
  const handleTagKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    e
  ) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const v = tagInput.trim();
      if (!v) return;
      if (tags.length >= 10) return;
      if (tags.includes(v)) {
        setTagInput("");
        return;
      }
      setTags((prev) => [...prev, v]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (idx: number) => {
    setTags((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />
      <main className="flex-grow-1 py-4">
        <Container style={{ maxWidth: "800px" }}>
          <Card
            className="shadow-sm border-0"
            style={{
              borderRadius: 18,
              background:
                "radial-gradient(circle at top left, #fffefe, #f7f9ff 45%, #f5fbff 100%)",
            }}
          >
            <Card.Body className="p-4 p-md-5">
              <h1 className="fw-bold mb-1 text-center">Create a New Post</h1>
              <p className="text-muted text-center mb-4 small">
                Choose your school &amp; category, then share your thoughts.
              </p>

              <Form onSubmit={handleSubmit}>
                {/* 如果是 reply 帖，给一个小卡片提示 */}
                {replyToPost && (
                  <div
                    className="mb-3 p-3 rounded-3"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(244,244,255,0.95), rgba(230,245,255,0.95))",
                      border: "1px solid #dde3ff",
                    }}
                  >
                    <div className="text-muted small mb-1">Replying to</div>
                    <div className="fw-semibold">
                      {replyToPost.userName
                        ? `@${replyToPost.userName}`
                        : `User #${replyToPost.id}`}
                    </div>
                    <div className="small text-muted">
                      “{replyToPost.title || "Untitled post"}”
                    </div>
                  </div>
                )}

                {/* School 选择：搜索 + 列表 */}
                <Form.Group className="mb-3">
                  <Form.Label>School</Form.Label>
                  <Form.Control
                    type="text"
                    value={schoolSearch}
                    onChange={(e) => setSchoolSearch(e.target.value)}
                    placeholder="Type to search your school (e.g. BU, Boston)"
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
                        <Spinner animation="border" size="sm" /> Loading
                        schools…
                      </div>
                    )}
                    {!schoolsLoading && filteredSchools.length === 0 && (
                      <div className="p-2 text-muted small">
                        No school matches your search.
                      </div>
                    )}
                    {!schoolsLoading &&
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
                              setSchoolSearch(`${s.short_name || s.name}`);
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
                </Form.Group>

                {/* Category 选择：下拉 */}
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={categoryId ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) {
                        setCategoryId(null);
                      } else {
                        const num = Number(v);
                        setCategoryId(Number.isNaN(num) ? null : num);
                      }
                    }}
                    disabled={categoriesLoading}
                  >
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Title */}
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter title..."
                    required
                  />
                </Form.Group>

                {/* Media Uploader */}
                <PostMediaUploader
                  files={mediaFiles}
                  onFilesChange={setMediaFiles}
                />

                {/* Content */}
                <Form.Group className="mb-4">
                  <Form.Label>Content</Form.Label>
                  <Editor
                    value={content}
                    onChange={setContent}
                    placeholder="My thoughts..."
                    autoFocus
                    minRows={16}
                  />
                </Form.Group>

                {/* Location */}
                <Form.Group className="mb-3">
                  <Form.Label>Location (optional)</Form.Label>
                  <Form.Control
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Boston, MA"
                  />
                </Form.Group>

                {/* Tags */}
                <Form.Group className="mb-3">
                  <Form.Label>Tags (optional)</Form.Label>

                  <div className="mb-2 d-flex flex-wrap gap-2">
                    {tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="badge border rounded-pill bg-light text-dark d-inline-flex align-items-center px-2"
                      >
                        <span className="me-1">#{tag}</span>
                        <button
                          type="button"
                          className="btn-close btn-close-sm"
                          aria-label="Remove"
                          onClick={() => handleRemoveTag(idx)}
                          style={{ fontSize: "0.55rem" }}
                        />
                      </span>
                    ))}
                  </div>

                  <Form.Control
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Type a tag~ max 10 tags"
                  />
                  <Form.Text className="text-muted">
                    Press <b>Enter</b> to add; Max <b>10</b> tags.
                  </Form.Text>
                </Form.Group>

                {/* Submit Button */}
                <div className="text-center">
                  <Button
                    type="submit"
                    variant="dark"
                    disabled={loading}
                    className="px-4"
                  >
                    {loading ? (
                      <>
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        Submitting…
                      </>
                    ) : (
                      "Submit Post"
                    )}
                  </Button>
                </div>
              </Form>

              {message && (
                <Alert
                  variant="info"
                  className="mt-4 text-center py-2 small mb-0"
                >
                  {message}
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Container>
      </main>
    </div>
  );
}
