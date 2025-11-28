// src/hooks/useMeAuth.ts
import { useEffect, useState } from "react";
import { me } from "../api/meApi";

const LS_KEYS = {
  userId: "me:id",
  email: "me:email",
  username: "me:username",
  avatarUrl: "me:avatarUrl", // 新增
} as const;

function saveMeToLocalStorage(
  id: number,
  email: string,
  username: string,
  avatarUrl: string
) {
  localStorage.setItem(LS_KEYS.userId, String(id));
  localStorage.setItem(LS_KEYS.email, email);
  localStorage.setItem(LS_KEYS.username, username);
  if (avatarUrl) {
    localStorage.setItem(LS_KEYS.avatarUrl, avatarUrl);
  } else {
    localStorage.removeItem(LS_KEYS.avatarUrl);
  }
}

function clearMeFromLocalStorage() {
  localStorage.removeItem(LS_KEYS.userId);
  localStorage.removeItem(LS_KEYS.email);
  localStorage.removeItem(LS_KEYS.username);
  localStorage.removeItem(LS_KEYS.avatarUrl);
}

function readMeFromLocalStorage() {
  const idStr = localStorage.getItem(LS_KEYS.userId);
  const email = localStorage.getItem(LS_KEYS.email) || "";
  const username = localStorage.getItem(LS_KEYS.username) || "";
  const avatarUrl = localStorage.getItem(LS_KEYS.avatarUrl) || "";
  const id = idStr ? Number(idStr) : null;
  return { id, email, username, avatarUrl };
}

export function useMeAuth() {
  const cached = readMeFromLocalStorage();

  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [userId, setUserId] = useState<number | null>(() => cached.id);
  const [username, setUsername] = useState<string>(() => cached.username);
  const [email, setEmail] = useState<string>(() => cached.email);
  const [avatarUrl, setAvatarUrl] = useState<string>(() => cached.avatarUrl);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const resp = await me();
        if (!mounted) return;

        if (resp.is_successful) {
          // 注意：这里 resp.avatar_url 是蛇形
          const newAvatar = resp.avatar_url || "";

          saveMeToLocalStorage(resp.id, resp.email, resp.username, newAvatar);
          setUserId(resp.id);
          setUsername(resp.username);
          setEmail(resp.email);
          setAvatarUrl(newAvatar);
          setAuthError(null);
        } else {
          clearMeFromLocalStorage();
          setUserId(null);
          setUsername("");
          setEmail("");
          setAvatarUrl("");
          setAuthError(resp.error_message || "Unauthorized");
        }
      } catch (e: any) {
        if (!mounted) return;
        clearMeFromLocalStorage();
        setUserId(null);
        setUsername("");
        setEmail("");
        setAvatarUrl("");
        setAuthError(e?.message || "Failed to call /me");
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

return {
  authLoading,
  authError,
  userId,
  username,
  email,
  avatarUrl,
  // NEW 新增一个 setMe，供前端修改 avatarUrl 用
  setMe: (updater: any) => {
    const next = updater({
      userId,
      username,
      email,
      avatarUrl,
      authLoading,
      authError,
    });

    // 写回 state
    setUserId(next.userId);
    setUsername(next.username);
    setEmail(next.email);
    setAvatarUrl(next.avatarUrl);

    // 写回 localStorage
    saveMeToLocalStorage(
      next.userId,
      next.email,
      next.username,
      next.avatarUrl
    );
  },
};

}
