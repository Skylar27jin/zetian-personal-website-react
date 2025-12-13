// src/types/comment.d.ts

// thrift enum: NEW_TO_OLD = 0, OLD_TO_NEW = 1
export enum CommentOrder {
  NEW_TO_OLD = 0,
  OLD_TO_NEW = 1,
}

/** Core comment data returned by backend (mirrors thrift.Comment) */
export interface Comment {
  id: number;
  post_id: number;
  user_id: number;

  parent_id?: number | null; // nil => top-level
  root_id: number;
  reply_to_user_id?: number | null;

  content: string;
  is_deleted: boolean;

  created_at: string;
  updated_at: string;

  // view fields
  user_name?: string;
  user_avatar_url?: string | null;
  reply_to_user_name?: string;

  // stats
  reply_count: number;
  like_count: number;

  // emoji (future)
  my_emoji?: string | null;
}

export interface CommentThread {
  root: Comment;
  replies_preview: Comment[];
}

/* =========================
   Create / Delete
   ========================= */

export interface CreateCommentReq {
  post_id: number;
  content: string;
  parent_id?: number; // nil => top-level
}

export interface CreateCommentResp {
  isSuccessful: boolean;
  errorMessage: string;
  comment?: Comment | null;
}

export interface DeleteCommentReq {
  comment_id: number;  
}

export interface DeleteCommentResp {
  isSuccessful: boolean;
  errorMessage: string;
}

/* =========================
   List Threads / Replies
   ========================= */

export interface ListPostCommentThreadsReq {
  post_id: number;
  cursor?: string; // default empty
  limit: number; // default 20 (frontend can omit -> handler default)
  replies_preview_limit: number; // default 2
  order?: CommentOrder; // default NEW_TO_OLD
}

export interface ListPostCommentThreadsResp {
  isSuccessful: boolean;
  errorMessage: string;
  threads: CommentThread[];

  next_cursor?: string | null;
  has_more?: boolean | null;
}

export interface ListCommentRepliesReq {
  root_id: number;
  cursor?: string;
  limit: number; // default 20
  order?: CommentOrder; // recommend default OLD_TO_NEW
}

export interface ListCommentRepliesResp {
  isSuccessful: boolean;
  errorMessage: string;
  replies: Comment[];

  next_cursor?: string | null;
  has_more?: boolean | null;
}
