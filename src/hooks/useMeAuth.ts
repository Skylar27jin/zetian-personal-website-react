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

function readMeFromLocalStorage() {
  const idStr = localStorage.getItem(LS_KEYS.userId);
  const email = localStorage.getItem(LS_KEYS.email) || "";
  const username = localStorage.getItem(LS_KEYS.username) || "";
  const id = idStr ? Number(idStr) : null;
  return { id, email, username };
}

export function useMeAuth() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(() => readMeFromLocalStorage().id);
  const [username, setUsername] = useState<string>(() => readMeFromLocalStorage().username);
  const [email, setEmail] = useState<string>(() => readMeFromLocalStorage().email);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await me();
        if (!mounted) return;

        if (resp.is_successful) {
          saveMeToLocalStorage(resp.id, resp.email, resp.username);
          setUserId(resp.id);
          setUsername(resp.username);
          setEmail(resp.email);
          setAuthError(null);
        } else {
          setAuthError(resp.error_message || "Unauthorized");
          setUserId(null);
        }
      } catch (e: any) {
        if (!mounted) return;
        setAuthError(e?.message || "Failed to call /me");
        setUserId(null);
      } finally {
        if (mounted) setAuthLoading(false);
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
