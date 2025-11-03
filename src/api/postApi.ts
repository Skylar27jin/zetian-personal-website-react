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
