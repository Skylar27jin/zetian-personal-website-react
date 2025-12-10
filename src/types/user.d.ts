// src/types/user.d.ts

export interface UserProfile {
  id: number;
  userName: string;
  avatarUrl: string;

  followersCount: number;
  followingCount: number;
  postLikeReceivedCount: number;

  isFollowing: boolean;
  followedYou: boolean;
  isMe: boolean;

  postCount: number;
  postFavCount: number;
  backgroundUrl: string;
  school: string;
  schoolId: number;
  description: string;
}

export interface SimpleUserProfile {
  id: number;
  userName: string;
  avatarUrl: string;

  isFollowing: boolean;
  followedYou: boolean;
  isMe: boolean;
}

export interface GetFollowersReq {
  user_id: number;
  cursor?: number;
  limit?: number;
}

export interface GetFollowersResp {
  isSuccessful: boolean;
  errorMessage: string;
  users: SimpleUserProfile[];
  nextCursor?: number;
  hasMore: boolean;
}

export interface GetFolloweesReq {
  user_id: number;
  cursor?: number;
  limit?: number;
}

export interface GetFolloweesResp {
  isSuccessful: boolean;
  errorMessage: string;
  users: SimpleUserProfile[];
  nextCursor?: number;
  hasMore: boolean;
}

export interface GetUserProfileResp {
  isSuccessful: boolean;
  errorMessage: string;
  user: UserProfile;
}

export interface FollowUserResp {
  isSuccessful: boolean;
  errorMessage: string;
}

export interface UnfollowUserResp {
  isSuccessful: boolean;
  errorMessage: string;
}

// === Login ===
export interface LoginReq {
  email: string;
  password: string;
}

export interface LoginResp {
  isSuccessful: boolean;
  errorMessage: string;
  userName: string;
  email: string;
}

export interface LogoutReq {
  // nothing needed, backend will destroy the JWT in cookie
}

export interface LogoutResp {
  isSuccessful: boolean;
  errorMessage: string;
}

export interface ResetPasswordReq {
  email: string;
  new_password: string; // 对应 thrift: newPassword (api.body="new_password")
}

export interface ResetPasswordResp {
  isSuccessful: boolean;
  errorMessage: string;
}

// === SignUp ===
export interface SignUpReq {
  username: string;
  email: string;
  password: string;
}

export interface SignUpResp {
  isSuccessful: boolean;
  errorMessage: string;
  userName: string;
  email: string;
}

export interface GetUserReq {
  id?: number;
  name?: string;
}

export interface GetUserResp {
  isSuccessful: boolean;
  errorMessage: string;
  userName: string;
  id: number;
}

// Avatar
export interface UploadAvatarResp {
  isSuccessful: boolean;
  errorMessage: string;
  avatarUrl: string; // 对应 thrift 字段 avatarUrl
}

/**
 * Reset username
 * body: { "user_name": "NewName" }
 * thrift: ResetUsernameReq.userName (api.body="user_name")
 */
export interface ResetUsernameReq {
  user_name: string;
}

export interface ResetUsernameResp {
  isSuccessful: boolean;
  errorMessage: string;
}

/**
 * Update school
 * body: { "school": "Boston University" }
 */
export interface UpdateSchoolReq {
  school: string;
  school_id: number;
}

export interface UpdateSchoolResp {
  isSuccessful: boolean;
  errorMessage: string;
}

/**
 * Update description / bio
 * body: { "description": "CS student at BU" }
 */
export interface UpdateDescriptionReq {
  description: string;
}

export interface UpdateDescriptionResp {
  isSuccessful: boolean;
  errorMessage: string;
}

/**
 * Update background image
 * body: multipart/form-data, field name: "background"
 * thrift: UpdateBackgroundReq {} + UpdateBackgroundResp
 */
export interface UpdateBackgroundResp {
  isSuccessful: boolean;
  errorMessage: string;
}
