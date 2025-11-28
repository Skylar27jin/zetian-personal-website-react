import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Button,
  Spinner,
  Alert,
  Form,
  Card,
} from "react-bootstrap";
import { motion } from "framer-motion";

import Navbar from "../components/Navbar";
import { useMeAuth } from "../hooks/useMeAuth";
import { useSchoolPosts } from "../hooks/useSchoolPosts";
import PostList from "../components/PostList";
import GopherLoader from "../components/GopherLoader";
import type { Post } from "../types/post";
import {
  likePost,
  unlikePost,
  favPost,
  unfavPost,
} from "../api/postApi";
import { getAllSchools } from "../api/schoolApi";
import type { School } from "../types/school";
import { formatTimeAgo } from "../pkg/TimeFormatter";

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

const DEFAULT_SCHOOL_ID = 1; // BU

export default function SchoolFeedPage() {
  // URL: /school/:id?   -> 如果没传，默认 BU
  const { id } = useParams<{ id?: string }>();

  const initialId = id ? Number(id) : DEFAULT_SCHOOL_ID;
  const schoolId = Number.isNaN(initialId) ? DEFAULT_SCHOOL_ID : initialId;

  const { authLoading, authError, userId: viewerId, username } = useMeAuth();

  const enabled = !authLoading;

  const {
    posts,
    quotedPosts,
    loadingPosts,
    postsError,
    hasMore,
    oldestTime,
    loadMore,
    setPosts,
    setHasMore,
  } = useSchoolPosts(schoolId, enabled);

  // 从帖子里推断当前学校名字（没帖子时 fallback）
  const schoolName: string = useMemo(() => {
    if (posts.length > 0 && posts[0].school_name) {
      return posts[0].school_name;
    }
    if (schoolId === DEFAULT_SCHOOL_ID) return "BU";
    return `School #${schoolId}`;
  }, [posts, schoolId]);

  // like / unlike / fav / unfav（本页内部维护 posts 状态）
  const updatePostLocal = (
    postId: number,
    patch: (p: Post) => Post
  ): void => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? patch(p) : p)));
  };

  const handleLike = async (postId: number) => {
    updatePostLocal(postId, (p) =>
      p.is_liked_by_user
        ? p
        : {
            ...p,
            is_liked_by_user: true,
            like_count: (p.like_count ?? 0) + 1,
          }
    );
    try {
      await likePost(postId);
    } catch {
      updatePostLocal(postId, (p) => ({
        ...p,
        is_liked_by_user: false,
        like_count: Math.max(0, (p.like_count ?? 1) - 1),
      }));
    }
  };

  const handleUnlike = async (postId: number) => {
    updatePostLocal(postId, (p) =>
      !p.is_liked_by_user
        ? p
        : {
            ...p,
            is_liked_by_user: false,
            like_count: Math.max(0, (p.like_count ?? 1) - 1),
          }
    );
    try {
      await unlikePost(postId);
    } catch {
      updatePostLocal(postId, (p) => ({
        ...p,
        is_liked_by_user: true,
        like_count: (p.like_count ?? 0) + 1,
      }));
    }
  };

  const handleFav = async (postId: number) => {
    updatePostLocal(postId, (p) =>
      p.is_fav_by_user
        ? p
        : {
            ...p,
            is_fav_by_user: true,
            fav_count: (p.fav_count ?? 0) + 1,
          }
    );
    try {
      await favPost(postId);
    } catch {
      updatePostLocal(postId, (p) => ({
        ...p,
        is_fav_by_user: false,
        fav_count: Math.max(0, (p.fav_count ?? 1) - 1),
      }));
    }
  };

  const handleUnfav = async (postId: number) => {
    updatePostLocal(postId, (p) =>
      !p.is_fav_by_user
        ? p
        : {
            ...p,
            is_fav_by_user: false,
            fav_count: Math.max(0, (p.fav_count ?? 1) - 1),
          }
    );
    try {
      await unfavPost(postId);
    } catch {
      updatePostLocal(postId, (p) => ({
        ...p,
        is_fav_by_user: true,
        fav_count: (p.fav_count ?? 0) + 1,
      }));
    }
  };

  const handleReportPost = (post: Post) => {
    alert(`Report feature coming soon for post #${post.id}`);
  };

  // ======= 各种状态渲染 =======

  // 首屏加载 + 没有任何帖子
  if (loadingPosts && posts.length === 0) {
    return (
      <PageShell>
        <header className="mb-4">
          <h1 className="fw-bold mb-1">{schoolName}</h1>
          <p className="text-muted small mb-0">
            Discover posts from students in {schoolName}.
          </p>
        </header>

        <SchoolSelectorForFeed currentSchoolId={schoolId} />

        <div className="d-flex justify-content-center py-5">
          <GopherLoader />
        </div>
      </PageShell>
    );
  }

  // 错误 + 无数据
  if (postsError && posts.length === 0) {
    return (
      <PageShell>
        <header className="mb-4">
          <h1 className="fw-bold mb-1">{schoolName}</h1>
        </header>

        <SchoolSelectorForFeed currentSchoolId={schoolId} />

        <Alert variant="danger" className="mt-3">
          {postsError}
        </Alert>
      </PageShell>
    );
  }

  // ======= 正常渲染 =======
  return (
    <PageShell>
      {/* Header */}
      <header className="mb-3">
        <h1 className="fw-bold mb-1">Welcome to {schoolName}'s Index!</h1>

        <p className="text-muted small mb-1">
          {authLoading ? (
            <>
            </>
          ) : authError ? (
            `You are viewing ${schoolName}'s index as a guest.`
          ) : viewerId ? (
            `You are viewing ${schoolName}'s index as ${username}.`
          ) : (
            `You are viewing ${schoolName}'s index.`
          )}
        </p>

      </header>

      {/* 学校选择：样式和 CreatePostPage 保持统一 */}
      <SchoolSelectorForFeed currentSchoolId={schoolId} />

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
        canRefresh={enabled}
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

/**
 * 学校选择组件（Feed 专用）
 * 样式尽量贴近 CreatePostPage 里的学校选择区域：
 * - 上面一个搜索框
 * - 下面一个带滚动的学校列表
 */
function SchoolSelectorForFeed(props: { currentSchoolId: number }) {
  const { currentSchoolId } = props;

  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolError, setSchoolError] = useState<string | null>(null);
  const [schoolSearch, setSchoolSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setSchoolsLoading(true);
        setSchoolError(null);

        const resp = await getAllSchools();
        if (cancelled) return;

        if (!resp.isSuccessful) {
          setSchoolError(resp.errorMessage || "Failed to load schools");
          return;
        }
        const list = resp.Schools || [];
        setSchools(list);

        // 如果当前 URL 中有 schoolId，就把搜索框初始值设成对应学校名
        const currentSchool = list.find((s) => s.id === currentSchoolId);
        if (currentSchool) {
          setSchoolSearch(currentSchool.short_name || currentSchool.name);
        }
      } catch (e: any) {
        if (!cancelled) {
          setSchoolError(e?.message || "Network error while loading schools");
        }
      } finally {
        if (!cancelled) {
          setSchoolsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentSchoolId]);

  const filteredSchools = schools.filter((s) => {
    if (!schoolSearch.trim()) return true;
    const q = schoolSearch.trim().toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.short_name.toLowerCase().includes(q) ||
      (s.aliases || []).some((a) => a.toLowerCase().includes(q))
    );
  });

  // 点击某个 school：直接跳 URL，交给 Router + useSchoolPosts 处理
  const handleSelectSchool = (s: School) => {
    window.location.href = `/school/${s.id}`;
  };

  const selectedId = currentSchoolId;

  return (
    <Card className="mb-3 border-0 shadow-sm">
      <Card.Body>
        <Form.Group className="mb-2">
          <Form.Label className="fw-semibold">School</Form.Label>
          <Form.Control
            type="text"
            value={schoolSearch}
            onChange={(e) => setSchoolSearch(e.target.value)}
            placeholder="Type to search your school (e.g. BU, Boston)"
          />
        </Form.Group>

        <div
          className="border rounded"
          style={{
            maxHeight: "200px",
            overflowY: "auto",
            background: "#ffffffff",
          }}
        >
          {schoolsLoading && (
            <div className="p-2 text-muted small">
              <Spinner animation="border" size="sm" /> Loading schools…
            </div>
          )}

          {!schoolsLoading && schoolError && (
            <div className="p-2 text-danger small">{schoolError}</div>
          )}

          {!schoolsLoading && !schoolError && filteredSchools.length === 0 && (
            <div className="p-2 text-muted small">
              No school matches your search.
            </div>
          )}

          {!schoolsLoading &&
            !schoolError &&
            filteredSchools.map((s) => {
              const selected = s.id === selectedId;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`w-100 text-start btn btn-sm ${
                    selected ? "btn-light" : "btn-light"
                  }`}
                  style={
                    selected
                      ? {
                          backgroundColor: "#f3f3f3",
                          borderColor: "#e0e0e0",
                        }
                      : {}
                  }
                  onClick={() => handleSelectSchool(s)}
                >
                  <strong>{s.short_name || s.name}</strong>{" "}
                  <span className="text-muted small">
                    · {s.name} · id={s.id}
                  </span>
                </button>
              );
            })}
        </div>

      </Card.Body>
    </Card>
  );
}
