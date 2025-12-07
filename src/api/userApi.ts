// src/api/userApi.ts
import type {
  LoginReq,
  LoginResp,
  SignUpReq,
  SignUpResp,
  LogoutReq,
  LogoutResp,
  ResetPasswordReq,
  ResetPasswordResp,
  UploadAvatarResp,
  UnfollowUserResp,
  FollowUserResp,
  GetUserProfileResp,
  GetFollowersReq,
  GetFollowersResp,
  GetFolloweesReq,
  GetFolloweesResp,
  ResetUsernameReq,
  ResetUsernameResp,
  UpdateSchoolReq,
  UpdateSchoolResp,
  UpdateDescriptionReq,
  UpdateDescriptionResp,
  UpdateBackgroundResp,
  GetUserResp,
} from "../types/user";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_HERTZ_BASE_URL;

/**
 * Login
 * POST /login
 * body: { email, password }
 * returns: LoginResp
 */
export async function loginUser(req: LoginReq): Promise<LoginResp> {
  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
    credentials: "include",
  });

  const resp = (await response.json()) as LoginResp;
  return resp;
}

/**
 * SignUp
 * POST /signup
 * body: { username, email, password }
 * returns: SignUpResp
 */
export async function signUpUser(req: SignUpReq): Promise<SignUpResp> {
  const response = await fetch(`${BASE_URL}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
    credentials: "include",
  });

  const resp = (await response.json()) as SignUpResp;
  return resp;
}

/**
 * Get user information
 * GET /user/get?id=xxx or ?name=xxx
 * returns: GetUserResp
 */
export async function getUser(params: {
  id?: number;
  name?: string;
}): Promise<GetUserResp> {
  const usp = new URLSearchParams();

  if (params.id != null) usp.set("id", String(params.id));
  if (params.name != null) usp.set("name", params.name);

  const response = await fetch(`${BASE_URL}/user/get?${usp.toString()}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("GetUser request failed");
  }

  const resp = (await response.json()) as GetUserResp;
  return resp;
}

/**
 * Logout user
 * POST /logout
 */
export async function LogoutUser(req: LogoutReq): Promise<LogoutResp> {
  const response = await fetch(`${BASE_URL}/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
    credentials: "include",
  });

  const resp = (await response.json()) as LogoutResp;
  return resp;
}

/**
 * Reset password
 * POST /user/reset-password
 * body: { email, new_password }
 */
export async function ResetPassword(
  req: ResetPasswordReq
): Promise<ResetPasswordResp> {
  const response = await fetch(`${BASE_URL}/user/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
    credentials: "include",
  });

  const resp = (await response.json()) as ResetPasswordResp;
  return resp;
}

/**
 * Upload avatar
 * POST /user/update-avatar
 * form-data: avatar=<file>
 */
export async function uploadAvatar(file: File | Blob): Promise<void> {
  const formData = new FormData();
  formData.append("avatar", file);

  await axios.post<UploadAvatarResp>(
    `${BASE_URL}/user/update-avatar`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    }
  );
}

/**
 * Get user profile (public info + stats)
 * GET /user/profile?id=xxx
 */
export async function getUserProfile(
  userId: number
): Promise<GetUserProfileResp> {
  const resp = await axios.get<GetUserProfileResp>(
    `${BASE_URL}/user/profile`,
    {
      params: { id: userId },
      withCredentials: true,
    }
  );
  return resp.data;
}

/**
 * Follow / Unfollow
 */
export async function followUser(
  targetUserId: number
): Promise<FollowUserResp> {
  const resp = await axios.post<FollowUserResp>(
    `${BASE_URL}/user/follow`,
    null,
    {
      params: { id: targetUserId },
      withCredentials: true,
    }
  );
  return resp.data;
}

export async function unfollowUser(
  targetUserId: number
): Promise<UnfollowUserResp> {
  const resp = await axios.post<UnfollowUserResp>(
    `${BASE_URL}/user/unfollow`,
    null,
    {
      params: { id: targetUserId },
      withCredentials: true,
    }
  );
  return resp.data;
}

/**
 * Followers / Followees list
 */
export async function getFollowers(
  req: GetFollowersReq
): Promise<GetFollowersResp> {
  const resp = await axios.get<GetFollowersResp>(`${BASE_URL}/user/followers`, {
    params: {
      user_id: req.user_id,
      cursor: req.cursor,
      limit: req.limit,
    },
    withCredentials: true,
  });

  return resp.data;
}

export async function getFollowees(
  req: GetFolloweesReq
): Promise<GetFolloweesResp> {
  const resp = await axios.get<GetFolloweesResp>(
    `${BASE_URL}/user/followees`,
    {
      params: {
        user_id: req.user_id,
        cursor: req.cursor,
        limit: req.limit,
      },
      withCredentials: true,
    }
  );

  return resp.data;
}

/**
 * Reset username
 * POST /user/reset-username
 * body: { "user_name": "NewName" }
 */
export async function resetUsername(
  req: ResetUsernameReq
): Promise<ResetUsernameResp> {
  const response = await fetch(`${BASE_URL}/user/reset-username`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
    credentials: "include",
  });

  const resp = (await response.json()) as ResetUsernameResp;
  return resp;
}

/**
 * Update school
 * POST /user/update-school
 * body: { "school": "Boston University" }
 */
export async function updateSchool(
  req: UpdateSchoolReq
): Promise<UpdateSchoolResp> {
  const response = await fetch(`${BASE_URL}/user/update-school`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
    credentials: "include",
  });

  const resp = (await response.json()) as UpdateSchoolResp;
  return resp;
}

/**
 * Update description (bio)
 * POST /user/update-description
 * body: { "description": "CS student at BU" }
 */
export async function updateDescription(
  req: UpdateDescriptionReq
): Promise<UpdateDescriptionResp> {
  const response = await fetch(`${BASE_URL}/user/update-description`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
    credentials: "include",
  });

  const resp = (await response.json()) as UpdateDescriptionResp;
  return resp;
}

/**
 * Upload background image
 * POST /user/update-background
 * form-data: background=<file>
 */
export async function uploadBackground(
  file: File | Blob
): Promise<UpdateBackgroundResp> {
  const formData = new FormData();
  formData.append("background", file);

  const resp = await axios.post<UpdateBackgroundResp>(
    `${BASE_URL}/user/update-background`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    }
  );

  return resp.data;
}
