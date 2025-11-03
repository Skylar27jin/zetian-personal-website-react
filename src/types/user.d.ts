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
