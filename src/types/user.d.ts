// src/types/user.d.ts

export interface UserProfile {
  id: number;
  userName: string;
  avatarUrl: string;
  followersCount: number;
  followingCount: number;
  postLikeReceivedCount: number;
  isFollowing: boolean;
  isMe: boolean;
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
  //nothing needed, backend will destroy the JWT in cookie
}

export interface LogoutResp {
  isSuccessful: boolean;
  errorMessage: string;
}


export interface ResetPasswordReq {
  email: string;
  new_password: string;
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

// export interface UploadAvatarReq {
// }

export interface UploadAvatarResp {
  isSuccessful: boolean;
  errorMessage: string;
  avatar_url: string;
}