// src/hooks/useMyProfile.ts
import { useState, useEffect, useCallback } from "react";
import { getUserProfile } from "../api/userApi";
import type { UserProfile } from "../types/user";

type MyProfileCache = {
  userId: number;
  profile: UserProfile | null;
};

let myProfileCache: MyProfileCache | null = null;

export function useMyProfile(userId: number | null | undefined, enabled: boolean) {
  const uid = userId ?? 0;

  // 初始化：如果缓存里就是这个 user，就直接用缓存
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (myProfileCache && myProfileCache.userId === uid) {
      return myProfileCache.profile;
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 把最新的 profile 同步回模块级缓存
  useEffect(() => {
    if (!enabled || !uid) return;
    myProfileCache = {
      userId: uid,
      profile,
    };
  }, [enabled, uid, profile]);

  // 首次加载：只有在没有缓存时才打接口
  useEffect(() => {
    if (!enabled || !uid) return;

    // 有缓存的话就不自动请求了（只在刷新后才重新拉）
    if (myProfileCache && myProfileCache.userId === uid && myProfileCache.profile) {
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await getUserProfile(uid);
        if (cancelled) return;

        if (!resp.isSuccessful) {
          setError(resp.errorMessage || "Failed to load profile.");
          setProfile(null);
        } else {
          setProfile(resp.user);
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Network error while loading profile.");
        setProfile(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, uid]);

  // 手动刷新（比如以后有人改了头像、改了 follow 逻辑想强制同步）
  const refresh = useCallback(async () => {
    if (!enabled || !uid) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await getUserProfile(uid);
      if (!resp.isSuccessful) {
        setError(resp.errorMessage || "Failed to reload profile.");
        return;
      }
      setProfile(resp.user);
    } catch (e: any) {
      setError(e?.message || "Network error while reloading profile.");
    } finally {
      setLoading(false);
    }
  }, [enabled, uid]);

  return {
    profile,
    loading,
    error,
    setProfile, // 方便被 UserProfileHeader 的 onChange 调整本地状态
    refresh,
  };
}
