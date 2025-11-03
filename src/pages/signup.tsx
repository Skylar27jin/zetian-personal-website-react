import { useState } from "react";
import { sendVerificationCode, verifyEmailCode } from "../api/verificationApi";
import { signUpUser } from "../api/userApi";
import type { SignUpReq } from "../types/user";
import { useNavigate } from "react-router-dom"; // ✅ 新增

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate(); // ✅ Hook 初始化

  /** Step 1 - 发送验证码 */
  const handleSendCode = async () => {
    const res = await sendVerificationCode({ email, purpose: "signup" });
    if (res.is_successful) {
      setMsg("✅ 验证码已发送，请查收邮箱");
      setStep(2);
    } else {
      setMsg("❌ " + res.error_message);
    }
  };

  /** Step 2 - 校验验证码 */
  const handleVerifyCode = async () => {
    const res = await verifyEmailCode({ email, code });
    if (res.is_successful) {
      setMsg("✅ 邮箱验证成功");
      setStep(3);
    } else {
      setMsg("❌ " + res.error_message);
    }
  };

  /** Step 3 - 注册账号 */
  const handleSignup = async () => {
    const req: SignUpReq = { username, email, password };
    const res = await signUpUser(req);
    if (res.isSuccessful) {
      setMsg("🎉 注册成功，正在跳转到登录页面...");
      // ✅ 延迟跳转到登录页
      setTimeout(() => navigate("/login"), 1500);
    } else {
      setMsg("❌ " + res.errorMessage);
    }
  };

  return (
    <div>
      <h1>Sign Up</h1>
      <p>{msg}</p>

      {step === 1 && (
        <div>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={handleSendCode}>发送验证码</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <input
            placeholder="Verification Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button onClick={handleVerifyCode}>验证邮箱</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleSignup}>注册</button>
        </div>
      )}
    </div>
  );
}
