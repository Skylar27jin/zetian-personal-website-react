/** Core post data returned by backend (mirrors thrift.Post) */
export interface Post {
  id: number;
  user_id: number;
  user_name?: string;
  user_avatar_url?: string | null;

  school_id: number;
  school_name: string;

  category_id?: number;
  category_name?: string;

  title: string;
  content: string;

  // optional metadata
  location?: string | null;      // where is the post created
  tags?: string[];               // hashtags

  // media
  media_type: string;            // "text" / "image" / "video"
  media_urls: string[];          // 图片、视频 URL 列表

  // reply
  reply_to?: number | null;      // reply to what post id

  // timestamps (RFC3339 / ISO8601 string)
  created_at: string;
  updated_at: string;

  // user interaction flags (for current viewer)
  is_liked_by_user: boolean;     // default: false
  is_fav_by_user: boolean;       // default: false

  // counters (computed on server side / stats table)
  like_count: number;
  fav_count: number;
  view_count: number;
  comment_count: number;
  share_count: number;
  last_comment_at: number;       // unix timestamp (int64)
  hot_score: number;             // sort score for hot posts
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
  post: Post | null; // thrift: optional Post
}

/* =========================
   CreatePost
   POST /post/create
   ========================= */

export interface CreatePostReq {
  user_id: number;
  school_id: number;

  category_id?: number;
  title: string;
  content: string;

  // optional fields, backend有默认值
  location?: string;
  tags?: string[];
  media_type?: string;      // 前端不填时后端默认 "text"
  media_urls?: string[];    // 前端不填时后端可默认 []
  reply_to?: number;        // 回复某个帖子时带上
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
  // 如需以后支持改 media / tags，可以再往这里加
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
  quoted_posts?: Record<string, Post>;
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
  quoted_posts?: Record<string, Post>;
}


export interface GetFollowingUsersRecentPostsReq {
  before?: string; // optional: backend 默认 now
  limit: number;
}

export interface GetFollowingUsersRecentPostsResp {
  isSuccessful: boolean;
  errorMessage: string;
  posts: Post[];
  quoted_posts?: Record<string, Post>;
  next_cursor?: string | null;
  has_more?: boolean | null;
}

/* ========================
   Like / Unlike / Fav / Unfav
   ======================== */
/**
 * 注意：后端现在只信 JWT 里的 user_id，
 * 这里的请求体只需要 post_id 就行。
 */

export interface LikePostReq {
  post_id: number;
}

export interface UnlikePostReq {
  post_id: number;
}

export interface FavPostReq {
  post_id: number;
}

export interface UnfavPostReq {
  post_id: number;
}

// Thrift: struct UserFlagPostResq { 1: bool isSuccessful; 2: string errorMessage; }
export interface UserFlagPostResp {
  isSuccessful: boolean;
  errorMessage: string;
}


/*
uploadPostMediaReq:
should cantain images = a list of images
*/

export interface UploadPostMediaResp {
  isSuccessful: boolean;
  errorMessage: string;
  urls: string[] | null;
}

