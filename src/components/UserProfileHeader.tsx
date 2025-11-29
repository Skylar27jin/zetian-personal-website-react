// src/components/UserProfileHeader.tsx
import React, { useEffect, useState } from "react";
import { Button, Dropdown } from "react-bootstrap";
import type { UserProfile } from "../types/user";
import { followUser, unfollowUser } from "../api/userApi";

interface UserProfileHeaderProps {
  profile: UserProfile;
  onChange?: (next: UserProfile) => void; // optional callback when follow state changes
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  profile,
  onChange,
  onFollowersClick,
  onFollowingClick,
}) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);
  const [loading, setLoading] = useState(false);

  // keep local state in sync when parent profile changes
  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  async function handleFollow() {
    if (localProfile.isMe || loading) return;
    if (localProfile.isFollowing) return;

    setLoading(true);
    try {
      const resp = await followUser(localProfile.id);
      if (!resp.isSuccessful) {
        console.error(resp.errorMessage);
      } else {
        const updated: UserProfile = {
          ...localProfile,
          isFollowing: true,
          followersCount: localProfile.followersCount + 1,
        };
        setLocalProfile(updated);
        onChange?.(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnfollow() {
    if (localProfile.isMe || loading) return;
    if (!localProfile.isFollowing) return;

    setLoading(true);
    try {
      const resp = await unfollowUser(localProfile.id);
      if (!resp.isSuccessful) {
        console.error(resp.errorMessage);
      } else {
        const updated: UserProfile = {
          ...localProfile,
          isFollowing: false,
          followersCount: Math.max(0, localProfile.followersCount - 1),
        };
        setLocalProfile(updated);
        onChange?.(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const showFollowButton = !localProfile.isMe;

  // 按钮文案：优先显示 Follow back
  const followButtonLabel = localProfile.isFollowing
    ? "Following"
    : localProfile.followedYou
    ? "Follow back"
    : "Follow";

  return (
    <div className="d-flex align-items-center justify-content-between mb-3">
      {/* Left: avatar + basic info */}
      <div className="d-flex align-items-center" style={{ gap: "12px" }}>
        <div
          className="rounded-circle overflow-hidden bg-light border"
          style={{ width: 56, height: 56 }}
        >
          {localProfile.avatarUrl ? (
            <img
              src={localProfile.avatarUrl}
              alt={localProfile.userName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div className="w-100 h-100 d-flex align-items-center justify-content-center">
              <span role="img" aria-label="gopher">
                🐹
              </span>
            </div>
          )}
        </div>

        <div>
          {/* 用户名 + Follows you badge */}
          <div
            className="d-flex align-items-center mb-1"
            style={{ gap: "8px" }}
          >
            <div className="fw-semibold">{localProfile.userName}</div>
            {!localProfile.isMe && localProfile.followedYou && (
              <span className="badge bg-light text-muted border small">
                Follows you
              </span>
            )}
          </div>

          {/* stats: big numbers, small labels below */}
          <div className="d-flex text-muted" style={{ gap: "16px" }}>
            {/* followers：整块可点 */}
            <div
              className="d-flex flex-column align-items-start"
              role={onFollowersClick ? "button" : undefined}
              onClick={onFollowersClick}
              style={{
                cursor: onFollowersClick ? "pointer" : "default",
                userSelect: "none",
              }}
            >
              <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                {localProfile.followersCount}
              </div>
              <div className="small">followers</div>
            </div>

            {/* following：整块可点 */}
            <div
              className="d-flex flex-column align-items-start"
              role={onFollowingClick ? "button" : undefined}
              onClick={onFollowingClick}
              style={{
                cursor: onFollowingClick ? "pointer" : "default",
                userSelect: "none",
              }}
            >
              <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                {localProfile.followingCount}
              </div>
              <div className="small">following</div>
            </div>

            {/* likes received：普通展示，不可点 */}
            <div className="d-flex flex-column align-items-start">
              <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                {localProfile.postLikeReceivedCount}
              </div>
              <div className="small">likes received</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: follow button / dropdown */}
      {showFollowButton && (
        <>
          {localProfile.isFollowing ? (
            // 已关注：Dropdown 二级操作，和 PostDetailPage 类似
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="outline-primary"
                size="sm"
                id="profile-followed-dropdown"
                className="py-0 px-3 d-inline-flex align-items-center"
                disabled={loading}
              >
                <span>{followButtonLabel}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={handleUnfollow} disabled={loading}>
                  Unfollow
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            // 未关注：直接 Follow
            <Button
              variant="primary"
              size="sm"
              disabled={loading}
              onClick={handleFollow}
            >
              {followButtonLabel}
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default UserProfileHeader;