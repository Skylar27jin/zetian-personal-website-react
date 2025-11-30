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
  UploadPostMediaResp,
  GetFollowingUsersRecentPostsReq,
  GetFollowingUsersRecentPostsResp,
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

/* ================================
   GetPostByID (GET)
   ================================ */
export async function getPostByID(req: GetPostByIDReq): Promise<GetPostByIDResp> {
  const url = `${BASE_URL}/post/get${buildQuery({ id: req.id })}`;
  return getJSON<GetPostByIDResp>(url);
}

/* ================================
   CreatePost (POST)
   now supports media + tags + location
   ================================ */
export async function createPost(req: CreatePostReq): Promise<CreatePostResp> {
  const url = `${BASE_URL}/post/create`;
  return postJSON<CreatePostResp>(url, req);
}

/* ================================
   EditPost (POST)
   ================================ */
export async function editPost(req: EditPostReq): Promise<EditPostResp> {
  const url = `${BASE_URL}/post/edit`;
  return postJSON<EditPostResp>(url, req);
}

/* ================================
   DeletePost (POST)
   ================================ */
export async function deletePost(req: DeletePostReq): Promise<DeletePostResp> {
  const url = `${BASE_URL}/post/delete`;
  return postJSON<DeletePostResp>(url, req);
}

/* ================================
   GetSchoolRecentPosts (GET)
   ================================ */
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

/* ================================
   GetPersonalRecentPosts (GET)
   ================================ */
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

export async function getFollowingUsersRecentPosts(
  req: GetFollowingUsersRecentPostsReq
): Promise<GetFollowingUsersRecentPostsResp> {
  const url = `${BASE_URL}/post/following/recent${buildQuery({
    before: req.before,
    limit: req.limit,
  })}`;
  return getJSON<GetFollowingUsersRecentPostsResp>(url);
}

/* ========================
   Like / Unlike / Fav / Unfav
   ======================== */

/**
 * Note:
 * 后端 *只信 JWT*，所以这里不再发送 user_id。
 * 请求体只需要 { post_id }
 */

/** Like */
export async function likePost(postId: number): Promise<UserFlagPostResp> {
  const body: LikePostReq = { post_id: postId };
  return postJSON<UserFlagPostResp>(`${BASE_URL}/post/like`, body);
}

/** Unlike */
export async function unlikePost(postId: number): Promise<UserFlagPostResp> {
  const body: UnlikePostReq = { post_id: postId };
  return postJSON<UserFlagPostResp>(`${BASE_URL}/post/unlike`, body);
}

/** Favorite */
export async function favPost(postId: number): Promise<UserFlagPostResp> {
  const body: FavPostReq = { post_id: postId };
  return postJSON<UserFlagPostResp>(`${BASE_URL}/post/fav`, body);
}

/** Unfavorite */
export async function unfavPost(postId: number): Promise<UserFlagPostResp> {
  const body: UnfavPostReq = { post_id: postId };
  return postJSON<UserFlagPostResp>(`${BASE_URL}/post/unfav`, body);
}




export async function uploadPostMedia(files: File[]): Promise<string[]> {
  const form = new FormData();
  files.forEach((f) => form.append("images", f)); // 字段名要和后端 form.File["images"] 对齐

  const resp = await fetch(`${BASE_URL}/post/media/upload`, {
    method: "POST",
    body: form,
    credentials: "include", // 带上 JWT cookie
  });

  const data: UploadPostMediaResp = await resp.json();
  if (!resp.ok || !data.isSuccessful) {
    throw new Error(data.errorMessage || `Upload failed: ${resp.status}`);
  }

  return data.urls ?? [];
}