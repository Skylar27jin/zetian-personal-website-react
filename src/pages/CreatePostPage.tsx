import React, { useState } from "react";
import { createPost } from "../api/postApi";
import type { CreatePostReq, CreatePostResp } from "../types/post";

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
        setMessage("✅ Post created successfully!");
        setTitle("");
        setContent("");
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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create a New Post</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">
            School ID
          </label>
          <input
            type="number"
            value={schoolId}
            onChange={(e) => setSchoolId(Number(e.target.value))}
            className="w-full border p-2 rounded"
            placeholder="Enter your school ID"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="Enter post title"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border p-2 rounded min-h-[120px]"
            placeholder="Write your content here..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Post"}
        </button>
      </form>

      {message && (
        <p className="mt-4 text-sm text-center text-gray-700">{message}</p>
      )}
    </div>
  );
}
