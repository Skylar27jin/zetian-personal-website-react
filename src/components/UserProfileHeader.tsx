// src/components/UserProfileHeader.tsx
import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import type { UserProfile } from "../types/user";
import { followUser, unfollowUser } from "../api/userApi";

interface UserProfileHeaderProps {
  profile: UserProfile;
  onChange?: (next: UserProfile) => void; // optional callback when follow state changes
}

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({ profile, onChange }) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);
  const [loading, setLoading] = useState(false);

  // keep local state in sync when parent profile changes
  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  async function handleToggleFollow() {
    if (localProfile.isMe || loading) return;

    setLoading(true);
    try {
      if (localProfile.isFollowing) {
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
      } else {
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
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const showFollowButton = !localProfile.isMe;

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
          <div className="fw-semibold mb-1">{localProfile.userName}</div>

          {/* stats: big numbers, small labels below */}
          <div className="d-flex text-muted" style={{ gap: "16px" }}>
            <div className="d-flex flex-column align-items-start">
              <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                {localProfile.followersCount}
              </div>
              <div className="small">followers</div>
            </div>

            <div className="d-flex flex-column align-items-start">
              <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                {localProfile.followingCount}
              </div>
              <div className="small">following</div>
            </div>

            <div className="d-flex flex-column align-items-start">
              <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                {localProfile.postLikeReceivedCount}
              </div>
              <div className="small">likes received</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: follow button */}
      {showFollowButton && (
        <Button
          variant={localProfile.isFollowing ? "outline-primary" : "primary"}
          size="sm"
          disabled={loading}
          onClick={handleToggleFollow}
        >
          {localProfile.isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  );
};

export default UserProfileHeader;
