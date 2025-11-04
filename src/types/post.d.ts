// src/types/post.d.ts

/** Core post data returned by backend (mirrors thrift.Post) */
export interface Post {
  id: number;
  user_id: number;
  school_id: number;
  title: string;
  content: string;
  like_count: number;   // computed on server side
  fav_count: number;    // computed on server side
  view_count: number;
  created_at: string;   // ISO/RFC3339 string
  updated_at: string;   // ISO/RFC3339 string
  is_liked_by_user: boolean; //default: false
  is_fav_by_user: boolean; //default: false
}

/* =========================
   GetPostByID
   GET /post/get?id=...
   ========================= */

export interface GetPostByIDReq {
  id: number;
}

export interface GetPostByIDResp {
  isSuccessful: boolean;
  errorMessage: string;
  post: Post | null;
}

/* =========================
   CreatePost
   POST /post/create
   ========================= */

export interface CreatePostReq {
  user_id: number;
  school_id: number;
  title: string;
  content: string;
}

export interface CreatePostResp {
  isSuccessful: boolean;
  errorMessage: string;
  post: Post | null;
}

/* =========================
   EditPost
   POST /post/edit
   ========================= */

export interface EditPostReq {
  id: number;
  title?: string;
  content?: string;
}

export interface EditPostResp {
  isSuccessful: boolean;
  errorMessage: string;
  post: Post | null;
}

/* =========================
   DeletePost
   POST /post/delete
   ========================= */

export interface DeletePostReq {
  id: number;
}

export interface DeletePostResp {
  isSuccessful: boolean;
  errorMessage: string;
}

/* ==================================
   GetSchoolRecentPosts (infinite scroll)
   GET /post/school/recent?school_id=&before=&limit=
   - before: ISO string (e.g., new Date().toISOString())
   ================================== */

export interface GetSchoolRecentPostsReq {
  school_id: number;
  before?: string; // optional: backend defaults to "now" if omitted
  limit: number;
}

export interface GetSchoolRecentPostsResp {
  isSuccessful: boolean;
  errorMessage: string;
  posts: Post[];
  // optionally you can extend later with: oldestTime?: string
}

/* ==================================
   GetPersonalRecentPosts (infinite scroll)
   GET /post/personal?user_id=&before=&limit=
   ================================== */

export interface GetPersonalRecentPostsReq {
  user_id: number;
  before?: string; // optional: backend defaults to "now" if omitted
  limit: number;
}

export interface GetPersonalRecentPostsResp {
  isSuccessful: boolean;
  errorMessage: string;
  posts: Post[];
}



// ========================
// Like / Unlike / Fav / Unfav
// ========================

// 后端 Thrift: struct LikePostReq { 1: i64 user_id; 2: i64 post_id; }
export interface LikePostReq {
  user_id: number;
  post_id: number;
}

export interface UnlikePostReq {
  user_id: number;
  post_id: number;
}

export interface FavPostReq {
  user_id: number;
  post_id: number;
}

export interface UnfavPostReq {
  user_id: number;
  post_id: number;
}

// Thrift: struct UserFlagPostResq { 1: bool isSuccessful; 2: string errorMessage; }
export interface UserFlagPostResp {
  isSuccessful: boolean;
  errorMessage: string;
}