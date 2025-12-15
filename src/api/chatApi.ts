// src/api/chatApi.ts
import {
  MessageContentType,
  ChatMessage,
  ChatThread,
  UserPresence,
  GetRecentMessagesReq,
  GetRecentMessagesResp,
  GetUnseenMessageCountsReq,
  GetUnseenMessageCountsResp,
  SendMessageReq,
  SendMessageResp,
  GetChatThreadsReq,
  GetChatThreadsResp,
  BatchGetPresenceReq,
  BatchGetPresenceResp,
  RecallMessageReq,
  RecallMessageResp,
} from "../types/chat";

const BASE_URL = import.meta.env.VITE_HERTZ_BASE_URL;

/**
 * 支持数组参数（peer_user_ids, user_ids）的 query 构造
 * 例如：?user_ids=1&user_ids=2
 */
function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== undefined && v !== null && v !== "") {
          q.append(key, String(v));
        }
      });
    } else {
      q.append(key, String(value));
    }
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
   GetRecentMessages (GET)
   /chat/messages/recent
   ================================ */
export async function getRecentMessages(
  req: GetRecentMessagesReq
): Promise<GetRecentMessagesResp> {
  const url = `${BASE_URL}/chat/messages/recent${buildQuery({
    peer_user_id: req.peer_user_id,
    cursor: req.cursor,
    limit: req.limit,
  })}`;
  return getJSON<GetRecentMessagesResp>(url);
}

/* ================================
   GetUnseenMessageCounts (GET)
   /chat/unseen_counts
   ================================ */
export async function getUnseenMessageCounts(
  req: GetUnseenMessageCountsReq = {}
): Promise<GetUnseenMessageCountsResp> {
  const url = `${BASE_URL}/chat/unseen_counts${buildQuery({
    peer_user_ids: req.peer_user_ids,
  })}`;
  return getJSON<GetUnseenMessageCountsResp>(url);
}

/* ================================
   SendMessage (POST)
   /chat/messages/send
   ================================ */
export async function sendMessage(
  req: SendMessageReq
): Promise<SendMessageResp> {
  return postJSON<SendMessageResp>(`${BASE_URL}/chat/messages/send`, req);
}

/* ================================
   GetChatThreads (GET)
   /chat/threads
   ================================ */
export async function getChatThreads(
  req: GetChatThreadsReq = {}
): Promise<GetChatThreadsResp> {
  const url = `${BASE_URL}/chat/threads${buildQuery({
    cursor: req.cursor,
    limit: req.limit,
  })}`;
  return getJSON<GetChatThreadsResp>(url);
}

/* ================================
   BatchGetPresence (GET)
   /chat/presence
   ================================ */
export async function batchGetPresence(
  req: BatchGetPresenceReq
): Promise<BatchGetPresenceResp> {
  const url = `${BASE_URL}/chat/presence${buildQuery({
    user_ids: req.user_ids,
  })}`;
  return getJSON<BatchGetPresenceResp>(url);
}


// 新增撤回
export async function recallMessage(
  req: RecallMessageReq
): Promise<RecallMessageResp> {
  return postJSON<RecallMessageResp>(`${BASE_URL}/chat/messages/recall`, req);
}
