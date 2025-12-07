// src/pages/MyForumProfilePage.tsx
import "../components/ColorfulButton.css";
import { useState, useEffect } from "react";
import {
  Container,
  Button,
  Spinner,
  Alert,
  Modal,
  Form,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { useMyProfile } from "../hooks/useMyProfile";
import UserProfileHeader from "../components/UserProfileHeader";
import type { UserProfile } from "../types/user";

import Navbar from "../components/Navbar";
import { useMeAuth } from "../hooks/useMeAuth";
import { usePersonalPosts } from "../hooks/usePersonalPosts";
import { useLikedPosts } from "../hooks/useLikedPosts";
import { useFavedPosts } from "../hooks/useFavedPosts";
import {
  deletePost,
  editPost,
  likePost,
  unlikePost,
  favPost,
  unfavPost,
} from "../api/postApi";
import type { Post } from "../types/post";
import GopherLoader from "../components/GopherLoader";
import PostList from "../components/PostList";
import Editor from "../components/Editor";
import UserListModal from "../components/UserListModal";
import PostSourceTabs, {
  PostSourceKey,
} from "../components/PostSourceTabs";

// --------------------- 通用页面壳子 ---------------------
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

// --------------------- Header ---------------------
function MyForumHeader(props: {
  authLoading: boolean;
  userId?: number | null;
  username?: string | null;
  email?: string | null;
  showCreateButton?: boolean;
  onClickCreate?: () => void;
}) {
  const {
    authLoading,
    userId,
    username,
    showCreateButton = false,
    onClickCreate,
  } = props;

  return (
    <header className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <div className="d-flex align-items-center gap-2">
          <h1 className="fw-bold mb-0">My Forum</h1>

          {!authLoading && userId && (
            <motion.div
              whileTap={{ scale: 1.05 }}
              transition={{ duration: 0.12 }}
            >
              <Button
                variant="outline-secondary"
                size="sm"
                className="py-0 px-2 small-button"
                onClick={() => (window.location.href = `/user/${userId}`)}
              >
                View Public Profile
              </Button>
            </motion.div>
          )}
        </div>

        {false && showCreateButton && !authLoading && userId && (
          <motion.div
            whileTap={{ scale: 1.08 }}
            transition={{ duration: 0.12 }}
          >
            <Button
              className="btn-gradient-animated"
              size="lg"
              onClick={onClickCreate}
            >
              + Create New Post
            </Button>
          </motion.div>
        )}
      </div>
    </header>
  );
}

// --------------------- 页面主体 ---------------------
export default function MyForumProfilePage() {
  const navigate = useNavigate();
  const { authLoading, authError, userId, username, email } = useMeAuth();

  const isLoggedIn = !!userId && !authError;
  const safeUserId = userId ?? 0;
  const enabled = !authLoading && isLoggedIn;

  const {
    profile,
    loading: profileLoading,
    error: profileError,
    setProfile,
  } = useMyProfile(userId ?? null, enabled);

  // 三种数据源
  const personal = usePersonalPosts(safeUserId, enabled);
  const liked = useLikedPosts(safeUserId, enabled);
  const faved = useFavedPosts(safeUserId, enabled);

  // 当前 tab
  const [source, setSource] = useState<PostSourceKey>("posts");

  const handleReportPost = (post: Post) => {
    alert(`Report feature coming soon for post #${post.id}`);
  };

  // 统一的 action 错误反馈（edit/delete/like/fav）
  const [actionError, setActionError] = useState<string | null>(null);

  // 编辑相关状态
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // 删除相关状态
  const [confirmDeletePost, setConfirmDeletePost] = useState<Post | null>(null);
  const [deleteCountdown, setDeleteCountdown] = useState(5);
  const [deleteButtonEnabled, setDeleteButtonEnabled] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  // 删除倒计时
  useEffect(() => {
    if (!confirmDeletePost) return;

    setDeleteCountdown(5);
    setDeleteButtonEnabled(false);

    const timerId = window.setInterval(() => {
      setDeleteCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerId);
          setDeleteButtonEnabled(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [confirmDeletePost]);

  useEffect(() => {
    if (!authLoading && (!userId || authError)) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, userId, authError, navigate]);

  // ======= 统一点赞 / 收藏操作（所有 tab 同步） =======
  const applyUpdateToAllSources = (updater: (p: Post) => Post) => {
    personal.setPosts((prev) => prev.map(updater));
    liked.setPosts((prev) => prev.map(updater));
    faved.setPosts((prev) => prev.map(updater));
  };

  const handleLikeGlobal = async (postId: number) => {
    setActionError(null);
    try {
      const resp = await likePost(postId);
      if (!resp.isSuccessful) {
        setActionError(resp.errorMessage || "Failed to like post.");
        return;
      }

      applyUpdateToAllSources((p) =>
        p.id === postId
          ? {
              ...p,
              is_liked_by_user: true,
              like_count: p.is_liked_by_user ? p.like_count : p.like_count + 1,
            }
          : p
      );
    } catch (e: any) {
      setActionError(e?.message || "Network error while liking.");
    }
  };

  const handleUnlikeGlobal = async (postId: number) => {
    setActionError(null);
    try {
      const resp = await unlikePost(postId);
      if (!resp.isSuccessful) {
        setActionError(resp.errorMessage || "Failed to unlike post.");
        return;
      }
      applyUpdateToAllSources((p) =>
        p.id === postId
          ? {
              ...p,
              is_liked_by_user: false,
              like_count: p.is_liked_by_user ? p.like_count - 1 : p.like_count,
            }
          : p
      );
    } catch (e: any) {
      setActionError(e?.message || "Network error while unliking.");
    }
  };

  const handleFavGlobal = async (postId: number) => {
    setActionError(null);
    try {
      const resp = await favPost(postId);
      if (!resp.isSuccessful) {
        setActionError(resp.errorMessage || "Failed to favorite post.");
        return;
      }
      applyUpdateToAllSources((p) =>
        p.id === postId
          ? {
              ...p,
              is_fav_by_user: true,
              fav_count: p.is_fav_by_user ? p.fav_count : p.fav_count + 1,
            }
          : p
      );
    } catch (e: any) {
      setActionError(e?.message || "Network error while favoriting.");
    }
  };

  const handleUnfavGlobal = async (postId: number) => {
    setActionError(null);
    try {
      const resp = await unfavPost(postId);
      if (!resp.isSuccessful) {
        setActionError(resp.errorMessage || "Failed to unfavorite post.");
        return;
      }
      applyUpdateToAllSources((p) =>
        p.id === postId
          ? {
              ...p,
              is_fav_by_user: false,
              fav_count: p.is_fav_by_user ? p.fav_count - 1 : p.fav_count,
            }
          : p
      );
    } catch (e: any) {
      setActionError(e?.message || "Network error while unfavoriting.");
    }
  };

  // ======= 条件 return =======

  if (!authLoading && (!userId || authError)) {
    return (
      <PageShell>
        <MyForumHeader
          authLoading={authLoading}
          userId={userId}
          username={username}
          email={email}
          showCreateButton={false}
        />
        <div className="d-flex justify-content-center py-5">
          <GopherLoader />
        </div>
      </PageShell>
    );
  }

  if (personal.loadingPosts && personal.posts.length === 0 && isLoggedIn) {
    return (
      <PageShell>
        <MyForumHeader
          authLoading={authLoading}
          userId={userId}
          username={username}
          email={email}
          showCreateButton={false}
        />
        <div className="d-flex justify-content-center py-5">
          <GopherLoader />
        </div>
      </PageShell>
    );
  }

  // 打开编辑弹窗
  const openEditModal = (post: Post) => {
    if (!userId || userId !== post.user_id) return;
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setActionError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    setActionError(null);

    try {
      setEditSaving(true);
      const resp = await editPost({
        id: editingPost.id,
        title: editTitle,
        content: editContent,
      });

      if (!resp.isSuccessful || !resp.post) {
        setActionError(resp.errorMessage || "Failed to edit post.");
        return;
      }

      const updated = resp.post;

      personal.setPosts((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
      liked.setPosts((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
      faved.setPosts((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );

      setEditingPost(null);
    } catch (e: any) {
      setActionError(e?.message || "Network error while editing.");
    } finally {
      setEditSaving(false);
    }
  };

  const requestDeletePost = (post: Post) => {
    if (!userId || userId !== post.user_id) return;
    setActionError(null);
    setConfirmDeletePost(post);
  };

  const handleConfirmDeletePost = async () => {
    if (!confirmDeletePost || !userId || userId !== confirmDeletePost.user_id) {
      return;
    }

    setActionError(null);

    try {
      setDeletingPostId(confirmDeletePost.id);
      const resp = await deletePost({ id: confirmDeletePost.id });

      if (!resp.isSuccessful) {
        setActionError(resp.errorMessage || "Failed to delete post.");
        return;
      }

      // 从三类列表都删掉
      personal.setPosts((prev) =>
        prev.filter((p) => p.id !== confirmDeletePost.id)
      );
      liked.setPosts((prev) =>
        prev.filter((p) => p.id !== confirmDeletePost.id)
      );
      faved.setPosts((prev) =>
        prev.filter((p) => p.id !== confirmDeletePost.id)
      );

      setConfirmDeletePost(null);
    } catch (e: any) {
      setActionError(e?.message || "Network error while deleting.");
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleCloseDeleteModal = () => {
    if (deletingPostId !== null) return;
    setConfirmDeletePost(null);
  };

  // 根据当前 tab 选择显示的数据源
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

  // ======= 正常渲染 =======
  return (
    <PageShell>
      <MyForumHeader
        authLoading={authLoading}
        userId={userId}
        username={username}
        email={email}
        showCreateButton={true}
        onClickCreate={() => (window.location.href = "/post/create")}
      />

      {profile && (
        <div className="mb-3">

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

          <PostSourceTabs
            active={source}
            onChange={setSource}
            isSelf={true}
            postCount={profile.postCount}
            postFavCount={profile.postFavCount}
          />
        </div>
      )}


      {profileError && (
        <Alert variant="warning" className="py-2">
          {profileError}
        </Alert>
      )}

      {actionError && (
        <Alert variant="danger" className="py-2">
          {actionError}
        </Alert>
      )}


      {/* 当前 tab 首次加载时，用 GopherLoader 顶住首屏 */}
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
          canRefresh={!authLoading}
          onLike={handleLikeGlobal}
          onUnlike={handleUnlikeGlobal}
          onFav={handleFavGlobal}
          onUnfav={handleUnfavGlobal}
          viewerId={userId ?? null}
          enableEdit={source === "posts"}
          onEdit={openEditModal}
          onDelete={requestDeletePost}
          deletingPostId={deletingPostId}
          disableLoadMore={authLoading}
          onReport={handleReportPost}
          quotedPosts={currentQuoted}
        />
      )}

      {/* Edit Modal */}
      <Modal show={!!editingPost} onHide={() => setEditingPost(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Post</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter title..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Content</Form.Label>
              <Editor
                value={editContent}
                onChange={setEditContent}
                placeholder="Write something… (supports :emoji_gopher_happy: )"
                minRows={10}
                autoFocus
              />
            </Form.Group>
          </Form>

          {editSaving && (
            <div className="text-muted small">
              <Spinner animation="border" size="sm" /> Saving…
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setEditingPost(null)}
            disabled={editSaving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveEdit}
            disabled={editSaving}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal
        show={!!confirmDeletePost}
        onHide={handleCloseDeleteModal}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete this post?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>🗑️ This will permanently remove the post:</p>
          <p className="fw-semibold">
            “{confirmDeletePost ? confirmDeletePost.title : ""}”
          </p>
          <p className="small text-muted mb-2">
            Hint: Do you really want to say good bye to the post? 🐈‍⬛
          </p>
          <p className="small">
            {deleteButtonEnabled
              ? "If you're sure, click the delete button below."
              : `wait for  ${deleteCountdown}s~ 👀`}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseDeleteModal}
            disabled={deletingPostId !== null}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDeletePost}
            disabled={!deleteButtonEnabled || deletingPostId !== null}
          >
            {deletingPostId !== null ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting…
              </>
            ) : (
              "Yes, delete it"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </PageShell>
  );
}