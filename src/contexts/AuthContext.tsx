// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect } from "react";
import { me } from "../api/meApi";

const LS_KEYS = {
  userId: "me:id",
  email: "me:email",
  username: "me:username",
  avatarUrl: "me:avatarUrl",
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

export interface AuthContextValue {
  authLoading: boolean;
  authError: string | null;
  userId: number | null;
  username: string;
  email: string;
  avatarUrl: string;
  /** 手动重新拉一次 /me，比如登录、修改头像后 */
  refreshMe: () => Promise<void>;
  /** 手动清空登录状态，比如退出登录时用 */
  clearAuth: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // 1) 初始化用本地缓存
  const cached = readMeFromLocalStorage();

  const [userId, setUserId] = useState<number | null>(() => cached.id);
  const [username, setUsername] = useState<string>(() => cached.username);
  const [email, setEmail] = useState<string>(() => cached.email);
  const [avatarUrl, setAvatarUrl] = useState<string>(() => cached.avatarUrl);

  // 有缓存时默认不 loading；没缓存时才转圈
  const [authLoading, setAuthLoading] = useState<boolean>(() => !cached.id);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuth = () => {
    clearMeFromLocalStorage();
    setUserId(null);
    setUsername("");
    setEmail("");
    setAvatarUrl("");
    setAuthError(null);
  };

  const refreshMe = async () => {
    setAuthLoading(true);
    try {
      const resp = await me();

      if (resp.is_successful) {
        const newAvatar = resp.avatar_url || "";
        saveMeToLocalStorage(resp.id, resp.email, resp.username, newAvatar);

        setUserId(resp.id);
        setUsername(resp.username);
        setEmail(resp.email);
        setAvatarUrl(newAvatar);
        setAuthError(null);
      } else {
        // jwt 过期 / 未登录
        clearAuth();
        setAuthError(resp.error_message || "Unauthorized");
      }
    } catch (e: any) {
      // 网络等错误：如果本来就没缓存，就视为未登录
      const nowCached = readMeFromLocalStorage();
      if (!nowCached.id) {
        clearAuth();
      }
      setAuthError(e?.message || "Failed to call /me");
    } finally {
      setAuthLoading(false);
    }
  };

  // 组件挂载时统一发一次 /me
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextValue = {
    authLoading,
    authError,
    userId,
    username,
    email,
    avatarUrl,
    refreshMe,
    clearAuth,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};
