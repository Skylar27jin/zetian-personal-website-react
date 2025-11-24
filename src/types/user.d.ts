// src/types/user.d.ts

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
  newPassword: string;
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