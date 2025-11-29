// src/pages/UserProfilePage.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Container, Button, Spinner, Alert } from "react-bootstrap";
import { motion } from "framer-motion";

import Navbar from "../components/Navbar";
import { useMeAuth } from "../hooks/useMeAuth";
import { usePersonalPosts } from "../hooks/usePersonalPosts";
import { getUserProfile } from "../api/userApi";
import type { UserProfile } from "../types/user";
import type { Post } from "../types/post";
import GopherLoader from "../components/GopherLoader";
import PostList from "../components/PostList";
import UserProfileHeader from "../components/UserProfileHeader";
import UserListModal from "../components/UserListModal";

// --------------------- Shell ---------------------
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />
      <main className="flex-grow-1 py-4">
        <Container className="max-w-3xl">{children}</Container>
      </main>
    </div>
  );
}

// --------------------- Main Page ---------------------
export default function UserProfilePage() {
  // URL: /user/:id
  const { id } = useParams<{ id: string }>();
  const targetUserId = id ? Number(id) : NaN;

  const { authLoading, authError, userId: viewerId, username } = useMeAuth();

  // invalid user id
  if (Number.isNaN(targetUserId)) {
    return (
      <PageShell>
        <Alert variant="danger">Invalid user id in URL.</Alert>
      </PageShell>
    );
  }

  // profile info (from /user/profile)
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);


  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const handleReportPost = (post: Post) => {
    alert(`Report feature coming soon for post #${post.id}`);
  };

  // call /user/profile to check existence and get profile info
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setUserLoading(true);
      setUserError(null);
      try {
        const resp = await getUserProfile(targetUserId);
        if (cancelled) return;

        if (!resp.isSuccessful) {
          setUserError(resp.errorMessage || "User not found");
          setProfile(null);
        } else {
          setProfile(resp.user);
        }
      } catch (e: any) {
        if (cancelled) return;
        setUserError(e?.message || "Network error");
        setProfile(null);
      } finally {
        if (!cancelled) {
          setUserLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [targetUserId]);

  const enabled = !userLoading && !userError && profile != null;

  const {
    posts,
    loadingPosts,
    postsError,
    hasMore,
    loadMore,
    handleLike,
    handleUnlike,
    handleFav,
    handleUnfav,
    setPosts,
    setHasMore,
    quotedPosts,
  } = usePersonalPosts(targetUserId, enabled);

  // user not found
  if (!userLoading && userError) {
    return (
      <PageShell>
        <Alert variant="danger">{userError}</Alert>
      </PageShell>
    );
  }

  // user info loading & no posts yet → show loader
  if (userLoading && posts.length === 0) {
    return (
      <PageShell>
        <header className="mb-4">
          <h1 className="fw-bold">User Profile</h1>
        </header>

        <div className="d-flex justify-content-center py-5">
          <GopherLoader />
        </div>
      </PageShell>
    );
  }

  const isSelf = viewerId === targetUserId;
  const displayName = profile?.userName || `User #${targetUserId}`;

  // posts first load (user profile already loaded)
  if (!userLoading && profile && loadingPosts && posts.length === 0) {
    return (
      <PageShell>
        <header className="mb-4">
          <h1 className="fw-bold mb-3">
            {isSelf ? "My Public Profile" : `${displayName}'s Posts`}
          </h1>

          {profile && (
              <UserProfileHeader 
                profile={profile} 
                onChange={setProfile} 
                  onFollowersClick={() => setShowFollowers(true)}
                  onFollowingClick={() => setShowFollowing(true)} 
                />

          )}

          {(authLoading || userLoading) && (
            <p className="text-secondary mb-0">
              <Spinner animation="border" size="sm" /> Loading…
            </p>
          )}
        </header>

        <div className="d-flex justify-content-center py-5">
          <GopherLoader />
        </div>
      </PageShell>
    );
  }

  // ======= normal render =======
  return (
    <PageShell>
      <header className="mb-4">
        {/* title + back button (for self) */}
        <div className="d-flex align-items-center gap-2 mb-2">
          <h1 className="fw-bold mb-0">
            {isSelf ? "My Public Profile" : `${displayName}'s Posts`}
          </h1>

          {isSelf && (
            <motion.div
              whileTap={{ scale: 1.05 }}
              transition={{ duration: 0.12 }}
            >
              <Button
                variant="outline-secondary"
                size="sm"
                className="py-0 px-2 small-button"
                onClick={() => (window.location.href = "/me")}
              >
                Back to My Forum
              </Button>
            </motion.div>
          )}
        </div>

        {/* profile header: avatar + stats + follow button */}
        {profile && (
          <div className="mb-2">
            <UserProfileHeader 
              profile={profile} 
              onChange={setProfile} 
              onFollowersClick={() => setShowFollowers(true)}
              onFollowingClick={() => setShowFollowing(true)} 
            />
            <UserListModal
              show={showFollowers}
              onClose={() => setShowFollowers(false)}
              userId={profile.id}
              type="followers"
              title="Followers"
              />
            <UserListModal
              show={showFollowing}
              onClose={() => setShowFollowing(false)}
              userId={profile.id}
              type="following"
              title="Following"
              />
          </div>
        )}

        {/* description text */}
        {(authLoading || userLoading) && (
          <p className="text-secondary mb-0">
            <Spinner animation="border" size="sm" /> Loading…
          </p>
        )}

      </header>

      {/* post list */}
      <PostList
        posts={posts}
        loadingPosts={loadingPosts}
        postsError={postsError}
        hasMore={hasMore}
        loadMore={loadMore}
        onRefresh={() => {
          setPosts([]);
          setHasMore(true);
          setTimeout(() => loadMore(), 0);
        }}
        canRefresh={!authLoading && !userLoading && enabled}
        onLike={handleLike}
        onUnlike={handleUnlike}
        onFav={handleFav}
        onUnfav={handleUnfav}
        viewerId={viewerId ?? null}
        enableEdit={false}
        disableLoadMore={!enabled}
        onReport={handleReportPost}
        quotedPosts={quotedPosts}
      />
    </PageShell>
  );
}
