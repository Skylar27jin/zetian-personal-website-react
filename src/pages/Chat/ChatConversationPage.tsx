// src/pages/chat/ChatConversationPage.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Container,
  Spinner,
  Alert,
  Button,
  Form,
  InputGroup,
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";

import { useMeAuth } from "../../hooks/useMeAuth";
import {
  getRecentMessages,
  sendMessage,
  recallMessage,
} from "../../api/chatApi";
import { getUserProfile } from "../../api/userApi";
import type { ChatMessage } from "../../types/chat";
import { MessageContentType } from "../../types/chat";
import type { UserProfile } from "../../types/user";
import {
  chatWsManager,
  WsNewMessagePayload,
  WsRecallPayload,
} from "../../ws/chatWsClient";

function genClientMsgId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // @ts-ignore
    return crypto.randomUUID();
  }
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// 时间分隔文案
function formatTimeSeparatorLabel(tsMs: number): string {
  const d = new Date(tsMs);
  const now = new Date();

  const pad = (n: number) => (n < 10 ? "0" + n : String(n));

  const h = pad(d.getHours());
  const m = pad(d.getMinutes());

  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1
  );
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();

  if (sameDay) return `${h}:${m}`;
  if (isYesterday) return `yesterday ${h}:${m}`;

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )} ${h}:${m}`;
}

const ChatConversationPage: React.FC = () => {
  const { peerId } = useParams<{ peerId: string }>();
  const peerUserId = Number(peerId);

  const { userId } = useMeAuth();
  const myId = userId ?? null;

  const navigate = useNavigate();

  const [peerProfile, setPeerProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState<string>("");

  const [selectedMsgId, setSelectedMsgId] = useState<number | null>(null);
  const [menuOpenMsgId, setMenuOpenMsgId] = useState<number | null>(null);

  const [wsConnected, setWsConnected] = useState<boolean>(
    chatWsManager.isConnected()
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  function scrollToBottom() {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }

  // 订阅 WebSocket 事件
  useEffect(() => {
    if (!myId) return;

    chatWsManager.ensureConnected();

    const offConn = chatWsManager.onConnectionChange((connected) => {
      setWsConnected(connected);
      if (connected && peerUserId) {
        // 连接成功后告诉后端：我正在看这个会话
        chatWsManager.sendRead(peerUserId);
      }
    });

    const offNew = chatWsManager.onNewMessage(
      (payload: WsNewMessagePayload) => {
        if (!myId || !peerUserId) return;

        const isThisConversation =
          (payload.from_user_id === myId &&
            payload.to_user_id === peerUserId) ||
          (payload.to_user_id === myId &&
            payload.from_user_id === peerUserId);

        if (!isThisConversation) return;

        const msg: ChatMessage = {
          id: payload.id,
          from_user_id: payload.from_user_id,
          to_user_id: payload.to_user_id,
          content_type: payload.content_type,
          content: payload.content,
          sent_at_ms: payload.sent_at_ms,
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const next = [...prev, msg];
          next.sort((a, b) => a.sent_at_ms - b.sent_at_ms);
          return next;
        });

        // 我正在这个会话里，顺便 ack 一下
        chatWsManager.sendRead(peerUserId);
        setTimeout(scrollToBottom, 0);
      }
    );

    const offRecall = chatWsManager.onRecall(
      (payload: WsRecallPayload) => {
        if (!myId || !peerUserId) return;

        const isThisConversation =
          (payload.from_user_id === myId &&
            payload.to_user_id === peerUserId) ||
          (payload.to_user_id === myId &&
            payload.from_user_id === peerUserId);

        if (!isThisConversation) return;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.id
              ? { ...m, content_type: MessageContentType.RECALL }
              : m
          )
        );
      }
    );

    return () => {
      offConn();
      offNew();
      offRecall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, peerUserId]);

  // 初次加载历史消息 + 用户信息
  async function loadInitial() {
    if (!peerUserId) return;
    try {
      setError(null);
      setLoading(true);

      const [profileResp, msgResp] = await Promise.all([
        getUserProfile(peerUserId),
        getRecentMessages({ peer_user_id: peerUserId }),
      ]);

      if (profileResp.isSuccessful) {
        setPeerProfile(profileResp.user);
      }

      const ms = msgResp.messages || [];
      ms.sort((a, b) => a.sent_at_ms - b.sent_at_ms);
      setMessages(ms);
      setNextCursor(msgResp.has_more ? msgResp.next_cursor ?? null : null);

      // 刚进入会话也 ack 一次
      chatWsManager.sendRead(peerUserId);
    } catch (e: any) {
      setError(e?.message || "Failed to load conversation");
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 0);
    }
  }

  async function loadOlder() {
    if (!nextCursor || !peerUserId) return;
    try {
      setError(null);
      setLoadingMore(true);

      const resp = await getRecentMessages({
        peer_user_id: peerUserId,
        cursor: nextCursor,
      });

      const older = resp.messages || [];
      older.sort((a, b) => a.sent_at_ms - b.sent_at_ms);

      setMessages((prev) => [...older, ...prev]);
      setNextCursor(resp.has_more ? resp.next_cursor ?? null : null);
    } catch (e: any) {
      setError(e?.message || "Failed to load older messages");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerUserId]);

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!input.trim() || !peerUserId) return;

    try {
      setSending(true);
      setError(null);

      const resp = await sendMessage({
        to_user_id: peerUserId,
        content_type: MessageContentType.TEXT,
        content: input.trim(),
        client_msg_id: genClientMsgId(),
      });

      if (!resp.base.is_successful) {
        setError(resp.base.error_message || "Send message failed");
        return;
      }
      if (!resp.message) {
        setError("Send message failed: empty message");
        return;
      }

      const msg: ChatMessage = resp.message;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        const next = [...prev, msg];
        next.sort((a, b) => a.sent_at_ms - b.sent_at_ms);
        return next;
      });
      setInput("");
      setTimeout(scrollToBottom, 0);

      // 自己发完也发一个 read（基本上未读为 0，但保持语义统一）
      chatWsManager.sendRead(peerUserId);
    } catch (err: any) {
      setError(err?.message || "Send message failed");
    } finally {
      setSending(false);
    }
  }

  async function handleRecall(
    m: ChatMessage,
    e?: React.MouseEvent<HTMLButtonElement>
  ) {
    if (e) e.stopPropagation();
    if (m.content_type === MessageContentType.RECALL) return;

    const now = Date.now();
    const within5Min = now - m.sent_at_ms <= 5 * 60 * 1000;

    if (!within5Min) {
      setError("只能撤回 5 分钟内发送的消息");
      return;
    }

    try {
      setError(null);
      const resp = await recallMessage({ message_id: m.id });

      if (!resp.base.is_successful) {
        setError(resp.base.error_message || "撤回失败");
        return;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === m.id
            ? { ...msg, content_type: MessageContentType.RECALL }
            : msg
        )
      );
      setMenuOpenMsgId(null);
    } catch (err: any) {
      setError(err?.message || "撤回失败");
    }
  }

  function handleReport(
    m: ChatMessage,
    e?: React.MouseEvent<HTMLButtonElement>
  ) {
    if (e) e.stopPropagation();
    setError("Thanks for reporting! Our team will review this message.");
  }

  function handleMessageClick(
    m: ChatMessage,
    e: React.MouseEvent<HTMLDivElement>
  ) {
    e.stopPropagation();
    setMenuOpenMsgId(null);
    setSelectedMsgId((prev) => (prev === m.id ? null : m.id));
  }

  function handleToggleMenu(
    m: ChatMessage,
    e: React.MouseEvent<HTMLButtonElement>
  ) {
    e.stopPropagation();
    setMenuOpenMsgId((prev) => (prev === m.id ? null : m.id));
  }

  function handleMessagesBlankClick() {
    setSelectedMsgId(null);
    setMenuOpenMsgId(null);
  }

  function renderAvatar(profile: UserProfile | null | undefined) {
    const size = 36;
    if (profile?.avatarUrl) {
      return (
        <img
          src={profile.avatarUrl}
          alt={profile.userName}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      );
    }
    const initial = profile?.userName?.[0]?.toUpperCase() ?? "?";
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
        }}
        className="bg-secondary d-flex align-items-center justify-content-center text-white flex-shrink-0"
      >
        {initial}
      </div>
    );
  }

  function renderMessage(m: ChatMessage) {
    const isMine = myId !== null && m.from_user_id === myId;
    const isRecall = m.content_type === MessageContentType.RECALL;
    const isSelected = selectedMsgId === m.id;
    const isMenuOpen = menuOpenMsgId === m.id;
    const withinRecallWindow =
      Date.now() - m.sent_at_ms <= 5 * 60 * 1000 && isMine;

    if (isRecall) {
      const text = isMine
        ? "You recalled a message"
        : "The other side recalled a message";
      return (
        <div
          key={m.id}
          className="d-flex flex-column align-items-center mb-2"
          onClick={(e) => handleMessageClick(m, e)}
        >
          <div
            className="text-muted"
            style={{ fontSize: 12, fontStyle: "italic" }}
          >
            {text}
          </div>
          {isSelected && (
            <div className="mt-1 d-flex justify-content-center">
              <Button
                variant="outline-secondary"
                size="sm"
                className="py-0 px-2"
                onClick={(e) => handleReport(m, e)}
              >
                Report
              </Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={m.id}
        className={`d-flex mb-2 ${
          isMine ? "justify-content-end" : "justify-content-start"
        }`}
        onClick={(e) => handleMessageClick(m, e)}
      >
        {!isMine && renderAvatar(peerProfile)}
        <div
          className={`px-3 py-2 rounded-3 ${
            isMine ? "bg-primary text-white" : "bg-light"
          }`}
          style={{ maxWidth: "70%" }}
        >
          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {m.content}
          </div>

          {isSelected && (
            <>
              <div className="d-flex justify-content-between align-items-center mt-1">
                <small className="text-muted" style={{ fontSize: 11 }}>
                  {new Date(m.sent_at_ms).toLocaleTimeString()}
                </small>
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none"
                  style={{ fontSize: 20, lineHeight: 1, minWidth: 32 }}
                  onClick={(e) => handleToggleMenu(m, e)}
                >
                  ⋯
                </button>
              </div>

              {isMenuOpen && (
                <div className="d-flex justify-content-end mt-2 gap-2">
                  {withinRecallWindow && (
                    <Button
                      variant={isMine ? "outline-light" : "outline-secondary"}
                      size="sm"
                      className="py-0 px-3"
                      onClick={(e) => handleRecall(m, e)}
                    >
                      Recall
                    </Button>
                  )}
                  <Button
                    variant={isMine ? "outline-light" : "outline-secondary"}
                    size="sm"
                    className="py-0 px-3"
                    onClick={(e) => handleReport(m, e)}
                  >
                    Report
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  function renderMessagesList() {
    const elements: JSX.Element[] = [];
    const TEN_MIN_MS = 10 * 60 * 1000;
    let lastTs: number | null = null;

    messages.forEach((m, idx) => {
      const ts = m.sent_at_ms;
      if (idx === 0 || (lastTs !== null && ts - lastTs > TEN_MIN_MS)) {
        const label = formatTimeSeparatorLabel(ts);
        elements.push(
          <div
            key={`sep-${m.id}`}
            className="d-flex justify-content-center my-2"
          >
            <span
              className="px-3 py-1 rounded-pill text-muted bg-light"
              style={{ fontSize: 12 }}
            >
              {label}
            </span>
          </div>
        );
      }

      elements.push(renderMessage(m));
      lastTs = ts;
    });

    return elements;
  }

  return (
    <main className="py-3">
      <Container style={{ maxWidth: 720, height: "calc(100vh - 70px)" }}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="d-flex flex-column h-100"
        >
          {/* Header */}
          <div className="d-flex align-items-center mb-3">
            <Button
              variant="link"
              className="me-2 p-0"
              onClick={() => navigate("/chat")}
            >
              ← Back
            </Button>
            {renderAvatar(peerProfile)}
            <div className="ms-2">
              <div className="fw-bold">
                {peerProfile?.userName ?? `User ${peerUserId}`}
              </div>
              <small className="text-muted">
                Chat {wsConnected ? "(connected)" : "(offline)"}
              </small>
            </div>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {/* Messages area */}
          <div
            className="flex-grow-1 mb-3 border rounded-3 p-3"
            style={{ overflowY: "auto" }}
            onClick={handleMessagesBlankClick}
          >
            {loading && !messages.length ? (
              <div className="d-flex justify-content-center py-5">
                <Spinner animation="border" />
              </div>
            ) : (
              <>
                {nextCursor && (
                  <div className="text-center mb-3">
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={loadOlder}
                      disabled={loadingMore}
                    >
                      {loadingMore ? "Loading..." : "Load older messages"}
                    </Button>
                  </div>
                )}

                {renderMessagesList()}

                {!loading && !messages.length && (
                  <div className="text-center text-muted">
                    No messages yet, say hi!
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <Form onSubmit={handleSend}>
            <InputGroup>
              <Form.Control
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
              />
              <Button
                type="submit"
                variant="primary"
                disabled={sending || !input.trim()}
              >
                {sending ? "Sending..." : "Send"}
              </Button>
            </InputGroup>
          </Form>
        </motion.div>
      </Container>
    </main>
  );
};

export default ChatConversationPage;