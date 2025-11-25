// src/pages/CreatePostPage.tsx
import React, { useEffect, useState } from "react";
import { createPost, getPersonalRecentPosts } from "../api/postApi";
import type { CreatePostReq, CreatePostResp, Post } from "../types/post";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Form,
  Button,
  Spinner,
  Alert,
  Card,
  Row,
  Col,
} from "react-bootstrap";
import Navbar from "../components/Navbar";
import { getAllSchools } from "../api/schoolApi";
import type { School } from "../types/school";
import BaseLayout from "../layouts/ForumBaselayout";

const LS_KEYS = {
  userId: "me:id",
  email: "me:email",
  username: "me:username",
} as const;

export default function CreatePostPage() {
  // -----------------------------
  // basic fields
  // -----------------------------
  const [schoolId, setSchoolId] = useState<number | null>(1);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // 新增字段
  const [location, setLocation] = useState("");
  const [mediaType, setMediaType] = useState<"text" | "image" | "video">("text");
  const [mediaUrlsInput, setMediaUrlsInput] = useState(""); // 每行一个 URL
  const [replyToId, setReplyToId] = useState<number | null>(null);

  // 智能 tags：tags 数组 + 当前输入框内容
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // UI & 状态
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 学校相关
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState("");

  // 自己的帖子（用来选 ReplyTo）
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [myPostsLoading, setMyPostsLoading] = useState(false);

  const navigate = useNavigate();

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
  // 加载“自己的帖子”用于 Reply To 下拉选择
  // -----------------------------
  useEffect(() => {
    const rawUserId = localStorage.getItem(LS_KEYS.userId);
    if (!rawUserId) return; // 未登录就不用拉自己的帖子

    const userId = Number(rawUserId);
    if (Number.isNaN(userId)) return;

    let cancelled = false;

    (async () => {
      try {
        setMyPostsLoading(true);
        const resp = await getPersonalRecentPosts({
          user_id: userId,
          limit: 50,
        });
        if (cancelled) return;

        if (!resp.isSuccessful) {
          console.warn("getPersonalRecentPosts failed:", resp.errorMessage);
          return;
        }

        setMyPosts(resp.posts || []);
      } catch (e) {
        console.error("getPersonalRecentPosts error:", e);
      } finally {
        if (!cancelled) {
          setMyPostsLoading(false);
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

    // 解析 media urls（按行或逗号）
    const mediaUrls = mediaUrlsInput
      .split(/[\n,，]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    // 构造请求体（带上可选字段）
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
    if (replyToId && replyToId > 0) {
      req.reply_to = replyToId;
    }

    try {
      setLoading(true);
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
        setMediaType("text");
        setMediaUrlsInput("");
        setReplyToId(null);
        setTags([]);
        setTagInput("");

        setTimeout(() => navigate("/me"), 3000);
      } else {
        setMessage(`❌ Failed: ${resp.errorMessage}`);
      }
    } catch (err: any) {
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
    return (
      s.name.toLowerCase().includes(q) ||
      s.short_name.toLowerCase().includes(q) ||
      (s.aliases || []).some((a) => a.toLowerCase().includes(q))
    );
  });

  const selectedSchool = schools.find((s) => s.id === schoolId);

  // 简单截断标题用
  const truncate = (s: string, n: number) =>
    s.length <= n ? s : s.slice(0, n - 1) + "…";

  // -----------------------------
  // tags 智能输入：回车确认一个 tag，最多 10 个
  // -----------------------------
  const handleTagKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    e
  ) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const v = tagInput.trim();
      if (!v) return;
      if (tags.length >= 10) return; // hard limit
      if (tags.includes(v)) {
        // 简单防重复
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
        <Container style={{ maxWidth: "720px" }}>
          <Card className="p-4 shadow-sm border-0">
            <Card.Body>
              <h1 className="fw-bold mb-4 text-center">Create a New Post</h1>

              <Form onSubmit={handleSubmit}>
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
                        <Spinner animation="border" size="sm" /> Loading schools…
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
                            className={`w-100 text-start btn btn-sm ${
                              selected ? "btn-light" : "btn-light"
                            }`}
                            style={
                              selected
                                ? {
                                    backgroundColor: "#f3f3f3", // 非常浅的灰色
                                    borderColor: "#e0e0e0",
                                  }
                                : {}
                            }
                            onClick={() => {
                              setSchoolId(s.id);
                              setSchoolSearch(
                                `${s.short_name || s.name}`
                              );
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

                {/* Content */}
                <Form.Group className="mb-4">
                  <Form.Label>Content</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="My thoughts..."
                  />
                </Form.Group>

                {/* Extra: location + reply_to */}
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Location (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Boston, MA"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Reply To (optional)</Form.Label>
                      <Form.Select
                        value={replyToId ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (!v) {
                            setReplyToId(null);
                          } else {
                            const num = Number(v);
                            setReplyToId(Number.isNaN(num) ? null : num);
                          }
                        }}
                        disabled={myPostsLoading}
                      >
                        <option value="">No reply</option>
                        {myPosts.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.id} · {truncate(p.title, 30)}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Currently you can only reply to your own posts here.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Media type + tags */}
                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Media Type</Form.Label>
                      <Form.Select
                        value={mediaType}
                        onChange={(e) =>
                          setMediaType(
                            e.target.value as "text" | "image" | "video"
                          )
                        }
                      >
                        <option value="text">Text</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label>Tags (optional)</Form.Label>

                      {/* 已选 tags chips */}
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
                        {tags.length === 0 && (
                          <span className="text-muted small">
                            No tags yet.
                          </span>
                        )}
                      </div>

                      {/* 输入框：回车确认一个 tag */}
                      <Form.Control
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Type a tag and press Enter (max 10)"
                      />
                      <Form.Text className="text-muted">
                        Press <b>Enter</b> to add a tag. Max{" "}
                        <b>{10}</b> tags.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Media URLs */}
                <Form.Group className="mb-4">
                  <Form.Label>Media URLs (optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={mediaUrlsInput}
                    onChange={(e) => setMediaUrlsInput(e.target.value)}
                    placeholder={
                      mediaType === "text"
                        ? "Leave empty for text-only post."
                        : "One URL per line, or separate by comma."
                    }
                  />
                  <Form.Text className="text-muted">
                    For now these are URLs (CDN / S3 / image host).
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

              {/* Feedback message */}
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
