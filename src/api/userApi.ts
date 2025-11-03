// src/api/userApi.ts
import type {
  LoginReq,
  LoginResp,
  SignUpReq,
  SignUpResp,
} from "../types/user";

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

  if (!response.ok) {
    // 这里是网络层失败，比如 500 / 404 / CORS
    throw new Error("Login request failed");
  }

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

  if (!response.ok) {
    throw new Error("Signup request failed");
  }

  const resp = (await response.json()) as SignUpResp;
  return resp;
}
