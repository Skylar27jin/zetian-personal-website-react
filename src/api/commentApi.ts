// src/api/commentApi.ts
import type {
  CreateCommentReq,
  CreateCommentResp,
  DeleteCommentReq,
  DeleteCommentResp,
  ListPostCommentThreadsReq,
  ListPostCommentThreadsResp,
  ListCommentRepliesReq,
  ListCommentRepliesResp,
  LikeCommentReq,
  LikeCommentResp,
  UnlikeCommentResp,
  UnlikeCommentReq,
} from "../types/comment";

const BASE_URL = import.meta.env.VITE_HERTZ_BASE_URL;

function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.append(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "GET", credentials: "include" });
  if (!res.ok) throw new Error(`GET ${url} failed with status ${res.status}`);
  return (await res.json()) as T;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${url} failed with status ${res.status}`);
  return (await res.json()) as T;
}

/* ================================
   CreateComment (POST)
   ================================ */
export async function createComment(req: CreateCommentReq): Promise<CreateCommentResp> {
  return postJSON<CreateCommentResp>(`${BASE_URL}/comment/create`, req);
}

/* ================================
   DeleteComment (POST)
   ================================ */
export async function deleteComment(req: DeleteCommentReq): Promise<DeleteCommentResp> {
  return postJSON<DeleteCommentResp>(`${BASE_URL}/comment/delete`, req);
}

/* ================================
   ListPostCommentThreads (GET)
   ================================ */
export async function listPostCommentThreads(
  req: ListPostCommentThreadsReq
): Promise<ListPostCommentThreadsResp> {
  const url = `${BASE_URL}/comment/list-post-threads${buildQuery({
    post_id: req.post_id,
    cursor: req.cursor,
    limit: req.limit,
    replies_preview_limit: req.replies_preview_limit,
    order: req.order,
  })}`;
  return getJSON<ListPostCommentThreadsResp>(url);
}

/* ================================
   ListCommentReplies (GET)
   ================================ */
export async function listCommentReplies(
  req: ListCommentRepliesReq
): Promise<ListCommentRepliesResp> {
  const url = `${BASE_URL}/comment/list-replies${buildQuery({
    root_id: req.root_id,
    cursor: req.cursor,
    limit: req.limit,
    order: req.order,
  })}`;
  return getJSON<ListCommentRepliesResp>(url);
}


/* ================================
   Like / Unlike (POST)
   ================================ */
export async function likeComment(req: LikeCommentReq): Promise<LikeCommentResp> {
  return postJSON<LikeCommentResp>(`${BASE_URL}/comment/like`, req);
}

export async function unlikeComment(req: UnlikeCommentReq): Promise<UnlikeCommentResp> {
  return postJSON<UnlikeCommentResp>(`${BASE_URL}/comment/unlike`, req);
}