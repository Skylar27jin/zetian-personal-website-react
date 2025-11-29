// src/components/UserListModal.tsx
import React, { useEffect, useState } from "react";
import { Modal, Button, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import type { SimpleUserProfile } from "../types/user";
import {
  getFollowers,
  getFollowees,
  followUser,
  unfollowUser,
} from "../api/userApi";
import "./UserListModal.css";
const DEFAULT_AVATAR = "../gopher_front.png";

export interface UserListModalProps {
  show: boolean;
  onClose: () => void;

  // 要查看 whose followers/following
  userId: number;

  // followers or following
  type: "followers" | "following";

  // 可选标题，比如 "Followers" / "Following"
  title?: string;
}

const UserListModal: React.FC<UserListModalProps> = ({
  show,
  onClose,
  userId,
  type,
  title,
}) => {
  const navigate = useNavigate();

  const [users, setUsers] = useState<SimpleUserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false); // load more
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<number | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [busyMap, setBusyMap] = useState<Record<number, boolean>>({}); // per-user follow/unfollow 中的 loading

  // 初次打开 / 切换 userId / type 时重置并拉第一页
  useEffect(() => {
    if (!show) return;

    setUsers([]);
    setError(null);
    setNextCursor(undefined);
    setHasMore(false);

    let cancelled = false;

    const loadFirstPage = async () => {
      setLoading(true);
      try {
        const resp =
          type === "followers"
            ? await getFollowers({ user_id: userId })
            : await getFollowees({ user_id: userId });

        if (cancelled) return;

        if (!resp.isSuccessful) {
          setError(resp.errorMessage || "Failed to load users.");
          return;
        }

        setUsers(
          resp.users
        );
        setNextCursor(resp.nextCursor);
        setHasMore(resp.hasMore);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Network error.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFirstPage();

    return () => {
      cancelled = true;
    };
  }, [show, userId, type]);

  // Load more
  const handleLoadMore = async () => {
    if (!hasMore || !nextCursor) return;
    setPageLoading(true);
    setError(null);
    try {
      const resp =
        type === "followers"
          ? await getFollowers({ user_id: userId, cursor: nextCursor })
          : await getFollowees({ user_id: userId, cursor: nextCursor });

      if (!resp.isSuccessful) {
        setError(resp.errorMessage || "Failed to load more.");
        return;
      }

      const list = resp.users;
      setUsers((prev) => [...prev, ...list]);
      setNextCursor(resp.nextCursor);
      setHasMore(resp.hasMore);
    } catch (e: any) {
      setError(e?.message || "Network error.");
    } finally {
      setPageLoading(false);
    }
  };

  // 统一更新某个用户在列表里的状态
  const updateUserInList = (id: number, updater: (u: SimpleUserProfile) => SimpleUserProfile) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? updater(u) : u)));
  };

  const setUserBusy = (id: number, busy: boolean) => {
    setBusyMap((prev) => ({ ...prev, [id]: busy }));
  };

  // follow / unfollow
  const handleFollowToggle = async (u: SimpleUserProfile) => {
    if (u.isMe) return;
    if (busyMap[u.id]) return;

    setUserBusy(u.id, true);
    try {
      if (u.isFollowing) {
        const resp = await unfollowUser(u.id);
        if (!resp.isSuccessful) {
          console.error(resp.errorMessage);
        } else {
          updateUserInList(u.id, (old) => ({
            ...old,
            isFollowing: false,
          }));
        }
      } else {
        const resp = await followUser(u.id);
        if (!resp.isSuccessful) {
          console.error(resp.errorMessage);
        } else {
          updateUserInList(u.id, (old) => ({
            ...old,
            isFollowing: true,
          }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUserBusy(u.id, false);
    }
  };

  const renderFollowButtonLabel = (u: SimpleUserProfile) => {
    if (u.isFollowing) return "Following";
    if (u.followedYou) return "Follow back";
    return "Follow";
  };

  const modalTitle =
    title ||
    (type === "followers" ? "Followers" : "Following");

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{modalTitle}</Modal.Title>
      </Modal.Header>

      {/* ✅ 加一个 className，方便整体控制 */}
      <Modal.Body
        className="user-list-modal-body"
        style={{ maxHeight: "60vh", overflowY: "auto" }}
      >
        {loading && (
          <div className="d-flex justify-content-center py-4">
            <Spinner animation="border" />
          </div>
        )}

        {!loading && error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {!loading && !error && users.length === 0 && (
          <div className="text-muted text-center py-3 small">
            No users to show.
          </div>
        )}

        {!loading && !error && users.length > 0 && (
          // ✅ 给 list-group 一个自定义 class
          <div className="list-group user-list-group">
            {users.map((u) => {
              const busy = !!busyMap[u.id];
              const avatar = u.avatarUrl?.trim()
                ? u.avatarUrl
                : DEFAULT_AVATAR;

              return (
                <button
                  key={u.id}
                  type="button"
                  // ✅ 每个 item 也加一个 class
                  className="list-group-item list-group-item-action user-list-item d-flex align-items-center"
                  onClick={() => navigate(`/user/${u.id}`)}
                >
                  <div className="user-list-avatar-wrapper">
                    <img
                      src={avatar}
                      alt={u.userName}
                      className="user-list-avatar"
                    />
                  </div>

                  <div className="flex-grow-1 text-start">
                    <div className="d-flex align-items-center user-list-name-row">
                      <span className="fw-semibold user-list-username">
                        {u.userName || `User #${u.id}`}
                      </span>
                      {u.isMe && (
                        <span className="badge bg-secondary bg-opacity-25 text-muted small">
                          You
                        </span>
                      )}
                      {!u.isMe && u.followedYou && (
                        <span className="badge bg-light text-muted border small">
                          Follows you
                        </span>
                      )}
                    </div>
                  </div>

                  {!u.isMe && (
                    <div
                      onClick={(e) => e.stopPropagation()} // 不要触发跳转
                    >
                      <Button
                        variant={u.isFollowing ? "outline-primary" : "primary"}
                        size="sm"
                        disabled={busy}
                        className="user-list-follow-btn"
                        onClick={() => handleFollowToggle(u)}
                      >
                        {busy ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          renderFollowButtonLabel(u)
                        )}
                      </Button>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {!loading && !error && hasMore && (
          <div className="d-flex justify-content-center mt-3">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleLoadMore}
              disabled={pageLoading}
            >
              {pageLoading ? (
                <>
                  <Spinner
                    animation="border"
                    size="sm"
                    className="me-2"
                  />
                  Loading…
                </>
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default UserListModal;