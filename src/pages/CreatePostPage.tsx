import React, { useState } from "react";
import { createPost } from "../api/postApi";
import type { CreatePostReq, CreatePostResp } from "../types/post";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Form,
  Button,
  Spinner,
  Alert,
  Card,
} from "react-bootstrap";
import Navbar from "../components/Navbar";

const LS_KEYS = {
  userId: "me:id",
  email: "me:email",
  username: "me:username",
} as const;

export default function CreatePostPage() {
  const [schoolId, setSchoolId] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const userId = localStorage.getItem(LS_KEYS.userId);
    if (!userId) {
      setMessage("You must be logged in to create a post.");
      return;
    }

    if (!title.trim() || !content.trim()) {
      setMessage("Title and content cannot be empty.");
      return;
    }

    const req: CreatePostReq = {
      user_id: Number(userId),
      school_id: schoolId,
      title,
      content,
    };

    try {
      setLoading(true);
      const resp: CreatePostResp = await createPost(req);

      if (resp.isSuccessful) {
        setMessage(`✅ Post created successfully!\n Returning to ${localStorage.getItem(LS_KEYS.username)}'s index~`);
        setTitle("");
        setContent("");
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
return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      {/* 顶部导航栏 */}
      <Navbar />

      {/* 主体内容 */}
      <main className="flex-grow-1 py-4">
        <Container style={{ maxWidth: "640px" }}>
          <Card className="p-4 shadow-sm border-0">
            <Card.Body>
              <h1 className="fw-bold mb-4 text-center">Create a New Post</h1>

              <Form onSubmit={handleSubmit}>
                {/* School ID */}
                <Form.Group className="mb-3">
                  <Form.Label>School ID</Form.Label>
                  <Form.Control
                    type="number"
                    value={schoolId}
                    onChange={(e) => setSchoolId(Number(e.target.value))}
                    placeholder="Enter your school ID"
                    required
                  />
                </Form.Group>

                {/* Title */}
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter post title"
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
                    placeholder="Write your content here..."
                    required
                  />
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
