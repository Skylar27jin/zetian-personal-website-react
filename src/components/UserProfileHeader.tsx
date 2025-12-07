import React, { useEffect, useState } from "react";
import { Button, Dropdown, Modal, Form } from "react-bootstrap";
import type { UserProfile } from "../types/user";
import { followUser, unfollowUser } from "../api/userApi";
import "./UserProfileHeader.css";

interface UserProfileHeaderProps {
  profile: UserProfile;
  onChange?: (next: UserProfile) => void;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  secondaryActionLabel?: string;            // View public profile / Back to forum
  onSecondaryActionClick?: () => void;
}

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  profile,
  onChange,
  onFollowersClick,
  onFollowingClick,
  secondaryActionLabel,
  onSecondaryActionClick,
}) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);
  const [loading, setLoading] = useState(false);

  // 分享 Modal 状态
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // 统一背景：用户没设置时用默认图
  const backgroundUrl =
    localProfile.backgroundUrl || "/default-background.jpg";

  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/user/${localProfile.id}`
      : `/user/${localProfile.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("copy failed", e);
    }
  };

  const renderRightAction = () => {
    // 优先显示 Follow
    if (showFollowButton) {
      return localProfile.isFollowing ? (
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
      );
    }

  // 没有 Follow 时，用灰色二级按钮展示 View / Back
  if (secondaryActionLabel && onSecondaryActionClick) {
    return (
      <Button
        variant="outline-secondary"
        size="sm"
        className="user-profile-secondary-btn"   // 使用自定义小号灰按钮
        onClick={onSecondaryActionClick}
      >
        {secondaryActionLabel}
      </Button>
    );
  }

    return null;
  };

  return (
    <>
      <div className="mb-3">
        {/* 顶部背景 banner */}
        <div className="user-profile-header-banner">
          <div
            className="user-profile-header-bg"
            style={{ backgroundImage: `url(${backgroundUrl})` }}
          />
          <div className="user-profile-header-overlay" />

          {/* 右上角：三个点菜单 */}
          <div className="user-profile-kebab">
            <Dropdown align="end">
              <Dropdown.Toggle
                id="profile-kebab"
                className="user-profile-kebab-toggle"
              >
                ⋯
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setShowShareModal(true)}>
                  Share profile
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>

          {/* 下边沿：头像 + 名字 */}
          <div className="user-profile-header-content">
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
          </div>
        </div>

        {/* banner 下方：左 stats / 右 action */}
        <div className="mt-2 user-profile-header-info">
          <div className="user-profile-header-bottom">
            <div className="user-profile-stats-row text-muted">
              <div
                className="user-profile-stat-block"
                role={onFollowersClick ? "button" : undefined}
                onClick={onFollowersClick}
                style={{
                  cursor: onFollowersClick ? "pointer" : "default",
                  userSelect: "none",
                }}
              >
                <span className="value">{localProfile.followersCount}</span>
                <span className="label">followers</span>
              </div>

              <div
                className="user-profile-stat-block"
                role={onFollowingClick ? "button" : undefined}
                onClick={onFollowingClick}
                style={{
                  cursor: onFollowingClick ? "pointer" : "default",
                  userSelect: "none",
                }}
              >
                <span className="value">{localProfile.followingCount}</span>
                <span className="label">following</span>
              </div>

              <div className="user-profile-stat-block">
                <span className="value">
                  {localProfile.postLikeReceivedCount}
                </span>
                <span className="label">likes got</span>
              </div>
            </div>

            <div className="user-profile-actions">{renderRightAction()}</div>
          </div>

          {(localProfile.school || localProfile.description) && (
            <div className="mt-2">
              {localProfile.school && (
                <div className="small text-muted">
                  {localProfile.school}
                </div>
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

      {/* Share Modal */}
      <Modal
        show={showShareModal}
        onHide={() => setShowShareModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Share profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted mb-1">Profile link</p>
          <div className="d-flex align-items-center gap-2">
            <Form.Control type="text" value={profileUrl} readOnly />
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleCopyLink}
            >
              Copy
            </Button>
          </div>
          {copied && (
            <div className="small text-success mt-2">
              Copied to clipboard.
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default UserProfileHeader;