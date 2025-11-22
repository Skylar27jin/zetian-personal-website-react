// src/api/schoolApi.ts
import type { GetAllSchoolsResp } from "../types/school";

const BASE_URL = import.meta.env.VITE_HERTZ_BASE_URL;

export async function getAllSchools(): Promise<GetAllSchoolsResp> {
  const res = await fetch(`${BASE_URL}/school/all`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`GET /school/all failed with status ${res.status}`);
  }
  return (await res.json()) as GetAllSchoolsResp;
}
