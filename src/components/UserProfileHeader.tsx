import React, { useEffect, useState } from "react";
import { Button, Dropdown } from "react-bootstrap";
import type { UserProfile } from "../types/user";
import { followUser, unfollowUser } from "../api/userApi";
import "./UserProfileHeader.css";

interface UserProfileHeaderProps {
  profile: UserProfile;
  onChange?: (next: UserProfile) => void;
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
  const followButtonLabel = localProfile.isFollowing
    ? "Following"
    : localProfile.followedYou
    ? "Follow back"
    : "Follow";

  const hasBackground = !!localProfile.backgroundUrl;

  // ========== 有背景图：banner 只放头像 + 名字 ==========
  if (hasBackground) {
    return (
      <div className="mb-3">
        {/* 顶部背景 banner */}
        <div className="user-profile-header-banner">
          <div
            className="user-profile-header-bg"
            style={{ backgroundImage: `url(${localProfile.backgroundUrl})` }}
          />
          <div className="user-profile-header-overlay" />

          <div className="user-profile-header-content">
            {/* 左侧：头像 + 名字 + Follows you */}
            <div className="user-profile-header-left">
              <div className="user-profile-avatar-wrap">
                {localProfile.avatarUrl ? (
                  <img
                    src={localProfile.avatarUrl}
                    alt={localProfile.userName}
                    className="user-profile-avatar-img"
                  />
                ) : (
                  <img
                    src="../gopher_front.png"
                    className="user-profile-avatar-img"
                    alt="avatar"
                  />
                )}
              </div>

              <div className="user-profile-text-main">
                <div className="user-profile-name-row">
                  <span className="name">{localProfile.userName}</span>
                  {!localProfile.isMe && localProfile.followedYou && (
                    <span className="badge bg-light text-dark border">
                      Follows you
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 右侧：follow / unfollow */}
            {showFollowButton && (
              <>
                {localProfile.isFollowing ? (
                  <Dropdown align="end">
                    <Dropdown.Toggle
                      variant="outline-light"
                      size="sm"
                      id="profile-followed-dropdown"
                      className="py-0 px-3 d-inline-flex align-items-center"
                      disabled={loading}
                    >
                      <span>{followButtonLabel}</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item
                        onClick={handleUnfollow}
                        disabled={loading}
                      >
                        Unfollow
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                ) : (
                  <Button
                    variant="light"
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
        </div>

        {/* banner 下方：统计 + 学校 + 简介 */}
        <div className="mt-2 user-profile-header-info">
          <div className="d-flex text-muted" style={{ gap: "16px" }}>
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

            <div className="d-flex flex-column align-items-start">
              <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                {localProfile.postLikeReceivedCount}
              </div>
              <div className="small">likes got</div>
            </div>
          </div>

          {(localProfile.school || localProfile.description) && (
            <div className="mt-2">
              {localProfile.school && (
                <div className="small text-muted">{localProfile.school}</div>
              )}
              {localProfile.description && (
                <div
                  className="small text-muted"
                  style={{ maxWidth: 420, whiteSpace: "pre-wrap" }}
                >
                  {localProfile.description}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== 无背景图：原来的浅色布局 ==========
  return (
    <div className="user-profile-header-plain mb-3">
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
            <img
              src="../gopher_front.png"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              alt="avatar"
            />
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

          {/* stats */}
          <div className="d-flex text-muted" style={{ gap: "16px" }}>
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

            <div className="d-flex flex-column align-items-start">
              <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                {localProfile.postLikeReceivedCount}
              </div>
              <div className="small">likes got</div>
            </div>
          </div>

          {(localProfile.school || localProfile.description) && (
            <div className="mt-2">
              {localProfile.school && (
                <div className="small text-muted">{localProfile.school}</div>
              )}
              {localProfile.description && (
                <div
                  className="small text-muted"
                  style={{ maxWidth: 420, whiteSpace: "pre-wrap" }}
                >
                  {localProfile.description}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: follow button / dropdown */}
      {showFollowButton && (
        <>
          {localProfile.isFollowing ? (
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