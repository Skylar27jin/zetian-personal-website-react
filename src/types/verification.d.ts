// src/types/verification.d.ts

export interface SendVeriCodeToEmailReq {
  email: string;
  purpose: string;
}

export interface SendVeriCodeToEmailResp {
  is_successful: boolean;
  error_message: string;
  expire_at: number;
}

export interface VerifyEmailCodeReq {
  email: string;
  code: string;
  purpose: string;
}

export interface VerifyEmailCodeResp {
  is_successful: boolean;
  error_message: string;
}
