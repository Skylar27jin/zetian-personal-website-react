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
import { deletePost, editPost } from "../api/postApi";
import type { Post } from "../types/post";
import GopherLoader from "../components/GopherLoader";
import PostList from "../components/PostList";
import Editor from "../components/Editor";
import UserListModal from "../components/UserListModal";

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
    // email 暂时没用到，先留着
    showCreateButton = false,
    onClickCreate,
  } = props;

  return (
    <header className="mb-4">
      {/* 第一行：左边 My Forum + View，右边 Create */}
      <div className="d-flex justify-content-between align-items-center mb-1">
        {/* 左侧：My Forum + View Public Profile */}
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

        {/* 右侧：Create New Post */}
        {false && showCreateButton && !authLoading && userId 
        && (
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
        )
        }
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
  } = usePersonalPosts(safeUserId, enabled);

  const handleReportPost = (post: Post) => {
    alert(`Report feature coming soon for post #${post.id}`);
  };

  // 统一的 action 错误反馈（edit/delete）
  const [actionError, setActionError] = useState<string | null>(null);

  // 编辑相关状态
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // 删除相关状态：要删除哪一篇 + 倒计时
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

  // 首次加载帖子中（已登录）
  if (loadingPosts && posts.length === 0 && isLoggedIn) {
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

  // 保存编辑
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
      setPosts((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );

      setEditingPost(null);
    } catch (e: any) {
      setActionError(e?.message || "Network error while editing.");
    } finally {
      setEditSaving(false);
    }
  };

  // 点击 Delete（来自卡片上的菜单），只是打开确认 Modal
  const requestDeletePost = (post: Post) => {
    if (!userId || userId !== post.user_id) return;
    setActionError(null);
    setConfirmDeletePost(post);
  };

  // 真正执行删除
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

      setPosts((prev) => prev.filter((p) => p.id !== confirmDeletePost.id));
      setConfirmDeletePost(null);
    } catch (e: any) {
      setActionError(e?.message || "Network error while deleting.");
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleCloseDeleteModal = () => {
    if (deletingPostId !== null) return; // 正在删的时候不要关
    setConfirmDeletePost(null);
  };

  // ======= 正常渲染 =======
  return (
    <PageShell>
      {/* Header：左标题+登录信息*/}
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
        </div>
        
      )}

      {profileError && (
        <Alert variant="warning" className="py-2">
          {profileError}
        </Alert>
      )}

      {/* action 错误提示（edit/delete） */}
      {actionError && (
        <Alert variant="danger" className="py-2">
          {actionError}
        </Alert>
      )}

      {/* 帖子列表 */}
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
        canRefresh={!authLoading}
        onLike={handleLike}
        onUnlike={handleUnlike}
        onFav={handleFav}
        onUnfav={handleUnfav}
        viewerId={userId ?? null}
        enableEdit={true}
        onEdit={openEditModal}
        onDelete={requestDeletePost}
        deletingPostId={deletingPostId}
        disableLoadMore={authLoading}
        onReport={handleReportPost}
        quotedPosts={quotedPosts}
      />

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
                value={editContent}              // 占位符文本（含 :emoji_xxx:）
                onChange={setEditContent}        // 实时回传占位符文本
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

      {/* Cute Delete Modal with 5s countdown */}
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