// src/types/chat.ts

// thrift enum: TEXT = 1 (后续可以扩展 IMAGE / FILE 等)
export enum MessageContentType {
  TEXT = 1,
  RECALL = 99,
}

/** 单条消息（对应 thrift.Message） */
export interface ChatMessage {
  id: number;
  from_user_id: number;
  to_user_id: number;
  content_type: MessageContentType;
  content: string;
  sent_at_ms: number; // Unix ms
}

/** 最近一条消息预览（对应 thrift.MessagePreview） */
export interface MessagePreview {
  message_id: number;
  from_user_id: number;
  content_type: MessageContentType;
  content: string;
  sent_at_ms: number;
}

/** 会话（我和某个 peer 的 1v1 对话）对应 thrift.ChatThread */
export interface ChatThread {
  peer_user_id: number;
  last_message?: MessagePreview | null;
  last_message_at_ms: number;
  unread_count: number;
}

/** 在线状态（对应 thrift.PresenceStatus） */
export enum PresenceStatus {
  OFFLINE = 0,
  ONLINE = 1,
}

/** 用户在线信息（对应 thrift.UserPresence） */
export interface UserPresence {
  user_id: number;
  status: PresenceStatus;
  last_active_at_ms?: number | null;
}

/** 通用返回（对应 thrift.BaseResp） */
export interface ChatBaseResp {
  is_successful: boolean;
  error_message: string;
  status_code?: number | null;
}

/* =========================
   GetRecentMessages
   ========================= */

export interface GetRecentMessagesReq {
  peer_user_id: number;
  cursor?: string;
  limit?: number; // 1~100，空则后端默认 30
}

export interface GetRecentMessagesResp {
  base: ChatBaseResp;
  messages: ChatMessage[];
  next_cursor?: string | null;
  has_more: boolean;
}

/* =========================
   GetUnseenMessageCounts
   ========================= */

export interface UnseenCountItem {
  peer_user_id: number;
  unseen_count: number;
}

export interface GetUnseenMessageCountsReq {
  peer_user_ids?: number[]; // 可选过滤
}

export interface GetUnseenMessageCountsResp {
  base: ChatBaseResp;
  total_unseen: number;
  items: UnseenCountItem[];
}

/* =========================
   SendMessage
   ========================= */

export interface SendMessageReq {
  to_user_id: number;
  content_type: MessageContentType;
  content: string;
  client_msg_id?: string; // 可选：幂等用
}

export interface SendMessageResp {
  base: ChatBaseResp;
  message?: ChatMessage | null;
}

/* =========================
   GetChatThreads
   ========================= */

export interface GetChatThreadsReq {
  cursor?: string;
  limit?: number; // 1~100，空则后端默认 30
}

export interface GetChatThreadsResp {
  base: ChatBaseResp;
  threads: ChatThread[];
  next_cursor?: string | null;
  has_more: boolean;
}

/* =========================
   BatchGetPresence
   ========================= */

export interface BatchGetPresenceReq {
  user_ids: number[];
}

export interface BatchGetPresenceResp {
  base: ChatBaseResp;
  presences: UserPresence[];
}

export interface RecallMessageReq {
  message_id: number;
}

export interface RecallMessageResp {
  base: ChatBaseResp;
}