// src/types/me.d.ts
export interface MeReq {} // empty by design

export interface MeResp {
  is_successful: boolean;
  error_message: string;
  id: number;
  email: string;
  username: string;
  avatar_url: string;
}
