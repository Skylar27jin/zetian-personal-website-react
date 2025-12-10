// src/pages/UserProfilePage.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Container, Button, Spinner, Alert } from "react-bootstrap";
import { motion } from "framer-motion";

import Navbar from "../components/Navbar";
import { useMeAuth } from "../hooks/useMeAuth";
import { usePersonalPosts } from "../hooks/usePersonalPosts";
import { useLikedPosts } from "../hooks/useLikedPosts";
import { useFavedPosts } from "../hooks/useFavedPosts";
import { getUserProfile } from "../api/userApi";
import {
  likePost,
  unlikePost,
  favPost,
  unfavPost,
} from "../api/postApi";
import type { UserProfile } from "../types/user";
import type { Post } from "../types/post";
import GopherLoader from "../components/GopherLoader";
import PostList from "../components/PostList";
import UserProfileHeader from "../components/UserProfileHeader";
import UserListModal from "../components/UserListModal";
import PostSourceTabs, {
  PostSourceKey,
} from "../components/PostSourceTabs";
import { PostUpdater, usePostReactions } from "../hooks/usePostReactions";

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
  const { id } = useParams<{ id: string }>();
  const targetUserId = id ? Number(id) : NaN;

  const { authLoading, authError, userId: viewerId, username } = useMeAuth();

  if (Number.isNaN(targetUserId)) {
    return (
      <PageShell>
        <Alert variant="danger">Invalid user id in URL.</Alert>
      </PageShell>
    );
  }

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const handleReportPost = (post: Post) => {
    alert(`Report feature coming soon for post #${post.id}`);
  };

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

  const personal = usePersonalPosts(targetUserId, enabled);
  const liked = useLikedPosts(targetUserId, enabled);
  const faved = useFavedPosts(targetUserId, enabled);

  const [source, setSource] = useState<PostSourceKey>("posts");
  const [actionError, setActionError] = useState<string | null>(null);

  const applyUpdateToAllSources = (updater: (p: Post) => Post) => {
    personal.setPosts((prev) => prev.map(updater));
    liked.setPosts((prev) => prev.map(updater));
    faved.setPosts((prev) => prev.map(updater));
  };

  // 封装成 PostUpdater，给 usePostReactions 用
  const updatePostGlobal: PostUpdater = (postId, patch) => {
    applyUpdateToAllSources((p) => (p.id === postId ? patch(p) : p));
  };

  const {
    handleLike: handleLikeGlobal,
    handleUnlike: handleUnlikeGlobal,
    handleFav: handleFavGlobal,
    handleUnfav: handleUnfavGlobal,
  } = usePostReactions(updatePostGlobal, {
    setActionError, // 统一错误展示
    // 这里不传 ensureLogin，未登录时 PostReactionButtons 自己会拦截
  });

  if (!userLoading && userError) {
    return (
      <PageShell>
        <Alert variant="danger">{userError}</Alert>
      </PageShell>
    );
  }


  const isSelf = viewerId === targetUserId;
  const displayName = profile?.userName || `User #${targetUserId}`;



  // 选择当前数据源
  let currentPosts = personal.posts;
  let currentLoading = personal.loadingPosts;
  let currentError = personal.postsError;
  let currentHasMore = personal.hasMore;
  let currentLoadMore = personal.loadMore;
  let currentSetPosts = personal.setPosts;
  let currentSetHasMore = personal.setHasMore;
  let currentQuoted = personal.quotedPosts;

  if (source === "liked") {
    currentPosts = liked.posts;
    currentLoading = liked.loadingPosts;
    currentError = liked.postsError;
    currentHasMore = liked.hasMore;
    currentLoadMore = liked.loadMore;
    currentSetPosts = liked.setPosts;
    currentSetHasMore = liked.setHasMore;
    currentQuoted = liked.quotedPosts;
  } else if (source === "faved") {
    currentPosts = faved.posts;
    currentLoading = faved.loadingPosts;
    currentError = faved.postsError;
    currentHasMore = faved.hasMore;
    currentLoadMore = faved.loadMore;
    currentSetPosts = faved.setPosts;
    currentSetHasMore = faved.setHasMore;
    currentQuoted = faved.quotedPosts;
  }

// ======= normal render =======
  return (
    <PageShell>
      <header className="mb-4">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h4 className="fw-bold mb-0">
            {isSelf && "You are previewing your public profile"}
          </h4>

          {isSelf && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => (window.location.href = "/me")}
            >
              Back to My Forum
            </Button>
          )}
        </div>


        {profile && (
          <>

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
          </>
        )}

        <PostSourceTabs
          active={source}
          onChange={setSource}
          isSelf={isSelf}
          postCount={profile?.postCount}
          postFavCount={profile?.postFavCount}
        />

        {(authLoading || userLoading) && (
          <p className="text-secondary mb-0">
            <Spinner animation="border" size="sm" /> Loading…
          </p>
        )}
      </header>

    {actionError && (
      <Alert variant="danger" className="py-2">
        {actionError}
      </Alert>
    )}

    {/* ⭐ 当前 tab 首次加载，用 GopherLoader 顶住 */}
    {currentLoading && currentPosts.length === 0 ? (
      <div className="d-flex justify-content-center py-5">
        <GopherLoader />
      </div>
    ) : (
      <PostList
        posts={currentPosts}
        loadingPosts={currentLoading}
        postsError={currentError}
        hasMore={currentHasMore}
        loadMore={currentLoadMore}
        onRefresh={() => {
          currentSetPosts([]);
          currentSetHasMore(true);
          setTimeout(() => currentLoadMore(), 0);
        }}
        canRefresh={!authLoading && !userLoading && enabled}
        onLike={handleLikeGlobal}
        onUnlike={handleUnlikeGlobal}
        onFav={handleFavGlobal}
        onUnfav={handleUnfavGlobal}
        viewerId={viewerId ?? null}
        enableEdit={false}
        disableLoadMore={!enabled}
        onReport={handleReportPost}
        quotedPosts={currentQuoted}
      />
    )}
  </PageShell>
);
}