// src/api/me.ts
import type { MeResp } from "../types/me";

const BASE_URL = import.meta.env.VITE_HERTZ_BASE_URL;

/** Get current user info via cookie-authenticated session. */
export async function me(): Promise<MeResp> {
  const res = await fetch(`${BASE_URL}/me`, {
    method: "GET",
    credentials: "include", // must include cookies
  });
  if (!res.ok) {
    throw new Error(`GET /me failed with status ${res.status}`);
  }
  return (await res.json()) as MeResp;
}
