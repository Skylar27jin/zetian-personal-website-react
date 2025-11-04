// src/api/postApi.ts
import type {
  // core data
  Post,

  // req/resp types
  GetPostByIDReq,
  GetPostByIDResp,

  CreatePostReq,
  CreatePostResp,

  EditPostReq,
  EditPostResp,

  DeletePostReq,
  DeletePostResp,

  GetSchoolRecentPostsReq,
  GetSchoolRecentPostsResp,

  GetPersonalRecentPostsReq,
  GetPersonalRecentPostsResp,
  LikePostReq,
  UnlikePostReq,
  FavPostReq,
  UnfavPostReq,
  UserFlagPostResp,
} from "../types/post";

const BASE_URL = import.meta.env.VITE_HERTZ_BASE_URL;

/** Build query string from a plain object (skips undefined/null). */
function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) q.append(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Common GET JSON helper (throws on !ok). */
async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`GET ${url} failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Common POST JSON helper (throws on !ok). */
async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`POST ${url} failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

/**
 * GetPostByID
 * GET /post/get
 * query: { id }
 */
export async function getPostByID(req: GetPostByIDReq): Promise<GetPostByIDResp> {
  const url = `${BASE_URL}/post/get${buildQuery({ id: req.id })}`;
  return getJSON<GetPostByIDResp>(url);
}

/**
 * CreatePost
 * POST /post/create
 * body: { user_id, school_id, title, content }
 */
export async function createPost(req: CreatePostReq): Promise<CreatePostResp> {
  const url = `${BASE_URL}/post/create`;
  return postJSON<CreatePostResp>(url, req);
}

/**
 * EditPost
 * POST /post/edit
 * body: { id, title?, content? }
 */
export async function editPost(req: EditPostReq): Promise<EditPostResp> {
  const url = `${BASE_URL}/post/edit`;
  return postJSON<EditPostResp>(url, req);
}

/**
 * DeletePost
 * POST /post/delete
 * body: { id }
 */
export async function deletePost(req: DeletePostReq): Promise<DeletePostResp> {
  const url = `${BASE_URL}/post/delete`;
  return postJSON<DeletePostResp>(url, req);
}

/**
 * GetSchoolRecentPosts
 * GET /post/school/recent
 * query: { school_id, before, limit }
 * - `before` should be RFC3339/RFC3339Nano string (e.g., new Date().toISOString())
 */
export async function getSchoolRecentPosts(
  req: GetSchoolRecentPostsReq
): Promise<GetSchoolRecentPostsResp> {
  const url = `${BASE_URL}/post/school/recent${buildQuery({
    school_id: req.school_id,
    before: req.before,
    limit: req.limit,
  })}`;
  return getJSON<GetSchoolRecentPostsResp>(url);
}

/**
 * GetPersonalRecentPosts
 * GET /post/personal
 * query: { user_id, before, limit }
 * - `before` should be RFC3339/RFC3339Nano string (e.g., new Date().toISOString())
 */
export async function getPersonalRecentPosts(
  req: GetPersonalRecentPostsReq
): Promise<GetPersonalRecentPostsResp> {
  const url = `${BASE_URL}/post/personal${buildQuery({
    user_id: req.user_id,
    before: req.before,
    limit: req.limit,
  })}`;
  return getJSON<GetPersonalRecentPostsResp>(url);
}

/* ============================
   TODO (not implemented yet)
   - get feed with like/fav meta
   - batch get by ids
   - cursor-based pagination helpers
   ============================ */

const LS_KEYS = {
  userId: "me:id",
} as const;

// ========================
// Like / Unlike / Fav / Unfav
// ========================

/**
 * Helper to read user_id from localStorage.
 * Throws if user is not logged in.
 */
function getUserIdFromLocalStorage(): number {
  const raw = localStorage.getItem(LS_KEYS.userId);
  if (!raw) {
    throw new Error("You must be logged in to perform this action.");
  }
  const num = Number(raw);
  if (Number.isNaN(num)) {
    throw new Error("Invalid user id in localStorage.");
  }
  return num;
}

/**
 * Like post
 * POST /post/like
 * body: { user_id, post_id }
 */
export async function likePost(postId: number): Promise<UserFlagPostResp> {
  const userId = getUserIdFromLocalStorage();

  const body: LikePostReq = {
    user_id: userId,
    post_id: postId,
  };

  const res = await fetch(`${BASE_URL}/post/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include", // send cookies (JWT)
  });

  const data = (await res.json()) as UserFlagPostResp;
  return data;
}

/**
 * Unlike post
 * POST /post/unlike
 */
export async function unlikePost(postId: number): Promise<UserFlagPostResp> {
  const userId = getUserIdFromLocalStorage();

  const body: UnlikePostReq = {
    user_id: userId,
    post_id: postId,
  };

  const res = await fetch(`${BASE_URL}/post/unlike`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });

  const data = (await res.json()) as UserFlagPostResp;
  return data;
}

/**
 * Favorite post
 * POST /post/fav
 */
export async function favPost(postId: number): Promise<UserFlagPostResp> {
  const userId = getUserIdFromLocalStorage();

  const body: FavPostReq = {
    user_id: userId,
    post_id: postId,
  };

  const res = await fetch(`${BASE_URL}/post/fav`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });

  const data = (await res.json()) as UserFlagPostResp;
  return data;
}

/**
 * Unfavorite post
 * POST /post/unfav
 */
export async function unfavPost(postId: number): Promise<UserFlagPostResp> {
  const userId = getUserIdFromLocalStorage();

  const body: UnfavPostReq = {
    user_id: userId,
    post_id: postId,
  };

  const res = await fetch(`${BASE_URL}/post/unfav`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });

  const data = (await res.json()) as UserFlagPostResp;
  return data;
}