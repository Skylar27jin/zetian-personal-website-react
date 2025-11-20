// src/hooks/useMeAuth.ts
import { useEffect, useState } from "react";
import { me } from "../api/meApi";

const LS_KEYS = {
  userId: "me:id",
  email: "me:email",
  username: "me:username",
} as const;

function saveMeToLocalStorage(id: number, email: string, username: string) {
  localStorage.setItem(LS_KEYS.userId, String(id));
  localStorage.setItem(LS_KEYS.email, email);
  localStorage.setItem(LS_KEYS.username, username);
}

function clearMeFromLocalStorage() {
  localStorage.removeItem(LS_KEYS.userId);
  localStorage.removeItem(LS_KEYS.email);
  localStorage.removeItem(LS_KEYS.username);
}

function readMeFromLocalStorage() {
  const idStr = localStorage.getItem(LS_KEYS.userId);
  const email = localStorage.getItem(LS_KEYS.email) || "";
  const username = localStorage.getItem(LS_KEYS.username) || "";
  const id = idStr ? Number(idStr) : null;
  return { id, email, username };
}

export function useMeAuth() {
  // 先从 localStorage 里读一次，避免重复调用
  const cached = readMeFromLocalStorage();

  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [userId, setUserId] = useState<number | null>(() => cached.id);
  const [username, setUsername] = useState<string>(() => cached.username);
  const [email, setEmail] = useState<string>(() => cached.email);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const resp = await me();
        if (!mounted) return;

        if (resp.is_successful) {
          // ✅ 成功：更新 localStorage + 内存状态
          saveMeToLocalStorage(resp.id, resp.email, resp.username);
          setUserId(resp.id);
          setUsername(resp.username);
          setEmail(resp.email);
          setAuthError(null);
        } else {
          // ❌ 失败：清 localStorage + 清掉内存里的用户信息
          clearMeFromLocalStorage();
          setUserId(null);
          setUsername("");
          setEmail("");
          setAuthError(resp.error_message || "Unauthorized");
        }
      } catch (e: any) {
        if (!mounted) return;
        // ❌ 调用 /me 出错，同样当作未登录处理
        clearMeFromLocalStorage();
        setUserId(null);
        setUsername("");
        setEmail("");
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
  };
}
