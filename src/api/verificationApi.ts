import type {
  SendVeriCodeToEmailReq,
  SendVeriCodeToEmailResp,
  VerifyEmailCodeReq,
  VerifyEmailCodeResp,
} from "../types/verification";

const BASE_URL = import.meta.env.VITE_HERTZ_BASE_URL;

/** 发送邮箱验证码 */
export async function sendVerificationCode(
  req: SendVeriCodeToEmailReq
): Promise<SendVeriCodeToEmailResp> {
  const res = await fetch(`${BASE_URL}/verification/email/send-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    credentials: "include", // ✅ 必须带 cookie
  });
  return (await res.json()) as SendVeriCodeToEmailResp;
}

/** 校验邮箱验证码 */
export async function verifyEmailCode(
  req: VerifyEmailCodeReq
): Promise<VerifyEmailCodeResp> {
  const res = await fetch(`${BASE_URL}/verification/email/verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    credentials: "include",
  });
  return (await res.json()) as VerifyEmailCodeResp;
}
