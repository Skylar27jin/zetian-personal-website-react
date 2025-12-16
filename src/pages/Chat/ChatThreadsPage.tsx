// src/pages/chat/ChatThreadsPage.tsx
import React, { useEffect, useState } from "react";
import {
  Container,
  ListGroup,
  Badge,
  Spinner,
  Alert,
  Button,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import Navbar from "../../components/Navbar";
import {
  getChatThreads,
  batchGetPresence,
} from "../../api/chatApi";
import { getUserProfile } from "../../api/userApi";
import type { ChatThread, UserPresence } from "../../types/chat";
import type { UserProfile } from "../../types/user";
import { PresenceStatus } from "../../types/chat";
import { useMeAuth } from "../../hooks/useMeAuth";
import {
  chatWsManager,
  WsNewMessagePayload,
} from "../../ws/chatWsClient";

interface PeerExtraInfo {
  profile?: UserProfile;
  presence?: UserPresence;
}

const ChatThreadsPage: React.FC = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [peerExtra, setPeerExtra] = useState<Record<number, PeerExtraInfo>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const { userId } = useMeAuth();
  const myId = userId ?? null;

  const navigate = useNavigate();

  async function fetchThreads(cursor?: string | null, append = false) {
    try {
      setError(null);
      if (append) setLoadingMore(true);
      else setLoading(true);

      const resp = await getChatThreads({
        cursor: cursor || undefined,
        limit: 30,
      });

      const newThreads = resp.threads || [];
      setThreads((prev) => (append ? [...prev, ...newThreads] : newThreads));
      setNextCursor(resp.has_more ? resp.next_cursor ?? null : null);

      const peerIds = newThreads.map((t) => t.peer_user_id);
      if (peerIds.length === 0) return;

      const [presenceResp, profilesList] = await Promise.all([
        batchGetPresence({ user_ids: peerIds }),
        Promise.all(
          peerIds.map((id) =>
            getUserProfile(id)
              .then((r) => r.user)
              .catch(() => null)
          )
        ),
      ]);

      setPeerExtra((prev) => {
        const updated: Record<number, PeerExtraInfo> = { ...prev };

        presenceResp.presences.forEach((p) => {
          updated[p.user_id] = {
            ...(updated[p.user_id] || {}),
            presence: p,
          };
        });

        profilesList.forEach((u) => {
          if (!u) return;
          updated[u.id] = {
            ...(updated[u.id] || {}),
            profile: u,
          };
        });

        return updated;
      });
    } catch (e: any) {
      setError(e?.message || "Failed to load chat threads");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  // 初次加载
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchThreads();
  }, []);

  // 订阅 WebSocket 新消息：有新消息时刷新 thread 列表（保证 unread_count 一致）
  useEffect(() => {
    if (!myId) return;

    chatWsManager.ensureConnected();

    const offNew = chatWsManager.onNewMessage(
      (payload: WsNewMessagePayload) => {
        if (!myId) return;

        const relatedToMe =
          payload.from_user_id === myId || payload.to_user_id === myId;
        if (!relatedToMe) return;

        // 有任何相关新消息，就重新 fetch 一次 thread 列表
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        fetchThreads();
      }
    );

    return () => {
      offNew();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

  function renderAvatar(peerId: number, profile?: UserProfile) {
    const size = 48;
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
          flexShrink: 0,
        }}
        className="bg-secondary d-flex align-items-center justify-content-center text-white"
      >
        {initial}
      </div>
    );
  }

  function renderPresence(presence?: UserPresence) {
    if (!presence) return null;
    const isOnline = presence.status === PresenceStatus.ONLINE;
    return (
      <Badge bg={isOnline ? "success" : "secondary"}>
        {isOnline ? "Online" : "Offline"}
      </Badge>
    );
  }

  function renderThreadItem(thread: ChatThread) {
    const extra = peerExtra[thread.peer_user_id] || {};
    const profile = extra.profile;
    const presence = extra.presence;

    return (
      <ListGroup.Item
        key={thread.peer_user_id}
        action
        onClick={() => navigate(`/chat/${thread.peer_user_id}`)}
        className="d-flex align-items-center gap-3"
      >
        {renderAvatar(thread.peer_user_id, profile)}
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <strong>
                {profile?.userName ?? `User ${thread.peer_user_id}`}
              </strong>
              {renderPresence(presence)}
            </div>
            <small className="text-muted">
              {thread.last_message_at_ms
                ? new Date(thread.last_message_at_ms).toLocaleString()
                : ""}
            </small>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-1">
            <small className="text-muted text-truncate">
              {thread.last_message?.content ?? ""}
            </small>
            {thread.unread_count > 0 && (
              <Badge bg="primary" pill>
                {thread.unread_count}
              </Badge>
            )}
          </div>
        </div>
      </ListGroup.Item>
    );
  }

  return (
    <>
      <Navbar />
      <main className="py-3">
        <Container style={{ maxWidth: 720 }}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="mb-3">Messages</h3>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading && !threads.length ? (
              <div className="d-flex justify-content-center py-5">
                <Spinner animation="border" />
              </div>
            ) : (
              <ListGroup>
                {threads.map((t) => renderThreadItem(t))}
                {!threads.length && !loading && (
                  <ListGroup.Item className="text-center text-muted">
                    No conversations yet.
                  </ListGroup.Item>
                )}
              </ListGroup>
            )}

            <div className="d-flex justify-content-center mt-3 gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => fetchThreads()}
                disabled={loading}
              >
                Refresh
              </Button>

              {nextCursor && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => fetchThreads(nextCursor, true)}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </Button>
              )}
            </div>
          </motion.div>
        </Container>
      </main>
    </>
  );
};

export default ChatThreadsPage;