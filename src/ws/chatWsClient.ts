// src/ws/chatWsClient.ts
import { MessageContentType } from "../types/chat";

export interface WsEnvelope<T = any> {
  type: string;
  data?: T;
}

export interface WsNewMessagePayload {
  id: number;
  from_user_id: number;
  to_user_id: number;
  content_type: MessageContentType;
  content: string;
  sent_at_ms: number;
}

export interface WsRecallPayload {
  id: number;
  from_user_id: number;
  to_user_id: number;
  content_type: MessageContentType;
  sent_at_ms: number;
}

type NewMessageHandler = (payload: WsNewMessagePayload) => void;
type RecallMessageHandler = (payload: WsRecallPayload) => void;
type ConnectionChangeHandler = (connected: boolean) => void;

const WS_PING_INTERVAL_MS = 10000; // 10 秒心跳

// Build ws URL from VITE_HERTZ_BASE_URL, fallback to current origin
function buildChatWsUrl(): string {
  const base = import.meta.env.VITE_HERTZ_BASE_URL as string | undefined;

  if (base) {
    try {
      const u = new URL(base);
      u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
      u.pathname = "/ws/chat";
      u.search = "";
      return u.toString();
    } catch {
      // fall through
    }
  }

  const u = new URL("/ws/chat", window.location.origin);
  u.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return u.toString();
}

class ChatWsManager {
  private socket: WebSocket | null = null;
  private connected = false;
  private connecting = false;
  private closedByUser = false;
  private pingTimer: number | null = null;

  private connectionHandlers = new Set<ConnectionChangeHandler>();
  private newMessageHandlers = new Set<NewMessageHandler>();
  private recallHandlers = new Set<RecallMessageHandler>();

  ensureConnected() {
    if (this.connected || this.connecting) return;
    this.closedByUser = false;
    this.connectInternal();
  }

  disconnect() {
    this.closedByUser = true;
    if (this.pingTimer !== null) {
      window.clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  isConnected() {
    return this.connected;
  }

  onConnectionChange(handler: ConnectionChangeHandler): () => void {
    this.connectionHandlers.add(handler);
    // 立即推一次当前状态
    handler(this.connected);
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  onNewMessage(handler: NewMessageHandler): () => void {
    this.newMessageHandlers.add(handler);
    return () => {
      this.newMessageHandlers.delete(handler);
    };
  }

  onRecall(handler: RecallMessageHandler): () => void {
    this.recallHandlers.add(handler);
    return () => {
      this.recallHandlers.delete(handler);
    };
  }

  /** 发一个 “chat.read” 通知后端：我在看和 peer_user_id 的会话 */
  sendRead(peerUserId: number) {
    if (!peerUserId) return;
    this.send("chat.read", { peer_user_id: peerUserId });
  }

  /** 发送原始 ws 消息 */
  send(type: string, data?: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    const env: WsEnvelope = { type, data };
    this.socket.send(JSON.stringify(env));
  }

  // ----------------- private -----------------

  private connectInternal() {
    this.connecting = true;
    const url = buildChatWsUrl();
    const ws = new WebSocket(url);
    this.socket = ws;

    ws.onopen = () => {
      this.connected = true;
      this.connecting = false;
      this.emitConnectionChange(true);

      // 心跳
      this.pingTimer = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, WS_PING_INTERVAL_MS);
    };

    ws.onmessage = (event) => {
      let env: WsEnvelope;
      try {
        env = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (env.type) {
        case "pong":
          // ignore
          break;
        case "message.new":
          this.handleNewMessage(env.data as WsNewMessagePayload);
          break;
        case "message.recall":
          this.handleRecall(env.data as WsRecallPayload);
          break;
        default:
          // ignore unknown
          break;
      }
    };

    ws.onclose = () => {
      this.connected = false;
      this.connecting = false;
      this.emitConnectionChange(false);

      if (this.pingTimer !== null) {
        window.clearInterval(this.pingTimer);
        this.pingTimer = null;
      }

      if (!this.closedByUser) {
        // 简单重连策略：3 秒后重试
        setTimeout(() => {
          this.ensureConnected();
        }, 3000);
      }
    };

    ws.onerror = () => {
      // 交给 onclose 清理
    };
  }

  private emitConnectionChange(connected: boolean) {
    this.connectionHandlers.forEach((h) => {
      try {
        h(connected);
      } catch {
        // ignore handler error
      }
    });
  }

  private handleNewMessage(payload: WsNewMessagePayload) {
    this.newMessageHandlers.forEach((h) => {
      try {
        h(payload);
      } catch {
        // ignore
      }
    });
  }

  private handleRecall(payload: WsRecallPayload) {
    this.recallHandlers.forEach((h) => {
      try {
        h(payload);
      } catch {
        // ignore
      }
    });
  }
}

export const chatWsManager = new ChatWsManager();