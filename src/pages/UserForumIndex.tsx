// src/pages/userForumIndex.tsx
import React, { useEffect, useState, useCallback } from "react";
import { me } from "../api/meApi";
import { getPersonalRecentPosts } from "../api/postApi";
import type { Post } from "../types/post";

const LS_KEYS = {
  userId: "me:id",
  email: "me:email",
  username: "me:username",
} as const;

function saveMeToLocalStorage(id: number, email: string, username: string) {
  localStorage.setItem(LS_KEYS.userId, String(id));
  localStorage.setItem(LS_KEYS.email, email);
  localStorage.setItem(LS_KEYS.username, username);
}

function readUserId(): number | null {
  const v = localStorage.getItem(LS_KEYS.userId);
  return v ? Number(v) : null;
}

export default function UserForumIndex() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Call /me on mount to verify and cache identity
  useEffect(() => {
    //
    let mounted = true;
    (async () => {
      try {
        const resp = await me();
        if (!mounted) return;
        if (resp.is_successful) {
          saveMeToLocalStorage(resp.id, resp.email, resp.username);
          setAuthError(null);
        } else {
          setAuthError(resp.error_message || "Unauthorized");
        }
      } catch (e: any) {
        setAuthError(e?.message || "Failed to call /me");
      } finally {
        setAuthLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const loadMore = useCallback(async () => {
    const uid = readUserId();
    if (!uid) {
      setPostsError("No user id in localStorage. Please login first.");
      return;
    }
    if (loadingPosts || !hasMore) return;

    setLoadingPosts(true);
    setPostsError(null);

    // cursor: use the created_at of the last post (RFC3339 string)
    const before =
      posts.length > 0 ? posts[posts.length - 1].created_at : new Date().toISOString();

    try {
      const resp = await getPersonalRecentPosts({
        user_id: uid,
        before,
        limit: 10,
      });

      if (!resp.isSuccessful) {
        setPostsError(resp.errorMessage || "Fetch failed");
        setHasMore(false);
        return;
      }

      const list = resp.posts ?? [];
      setPosts((prev) => [...prev, ...list]);
      if (list.length < 10) setHasMore(false);
    } catch (e: any) {
      setPostsError(e?.message || "Network error");
    } finally {
      setLoadingPosts(false);
    }
  }, [posts, loadingPosts, hasMore]);

  // Auto-load first page after auth success
  useEffect(() => {
    if (!authLoading && !authError && posts.length === 0) {
      loadMore();
    }
  }, [authLoading, authError, posts.length, loadMore]);

  const username = localStorage.getItem(LS_KEYS.username) || "";
  const email = localStorage.getItem(LS_KEYS.email) || "";

  return (
    <div className="max-w-3xl mx-auto p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">My Forum</h1>
        {authLoading && <p>Verifying session…</p>}
        {!authLoading && authError && (
          <p className="text-red-600">Auth failed: {authError}</p>
        )}
        {!authLoading && !authError && (
          <div className="text-sm text-gray-600">
            Signed in as <b>{username}</b> ({email})
          </div>
        )}
        {!authLoading && !authError && (
          <button
            onClick={() => (window.location.href = "/post/create")}
            className="px-4 py-2 bg-blue-600 text-black rounded hover:bg-blue-800"
          >
            + Create New Post!
          </button>
        )}
      </header>

      <section className="space-y-3">
        {posts.map((p) => (
          <article key={p.id} className="border rounded p-3">
            <h2 className="font-semibold">{p.title}</h2>
            <div className="text-sm text-gray-500">
              school #{p.school_id} · views {p.view_count} · likes {p.like_count} · favs {p.fav_count}
            </div>
            <p className="mt-2 whitespace-pre-wrap">{p.content}</p>
            <div className="text-xs text-gray-400 mt-2">
              created_at: {p.created_at}
            </div>
          </article>
        ))}

        {postsError && <div className="text-red-600">{postsError}</div>}

        <div className="mt-4 flex items-center gap-8">
          <button
            onClick={loadMore}
            disabled={loadingPosts || !hasMore || !!authError}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          >
            {loadingPosts ? "Loading…" : hasMore ? "Load more" : "No more"}
          </button>
          {!authLoading && !authError && posts.length === 0 && !loadingPosts && (
            <button
              onClick={() => {
                // manual refresh first page
                setPosts([]);
                setHasMore(true);
                setTimeout(() => loadMore(), 0);
              }}
              className="px-4 py-2 rounded border"
            >
              Refresh
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
