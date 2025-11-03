import { useState } from "react";
import { sendVerificationCode, verifyEmailCode } from "../api/verificationApi";
import { signUpUser } from "../api/userApi";
import type { SignUpReq } from "../types/user";
import { useNavigate } from "react-router-dom";

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate(); // ✅ Hook 初始化

  /** Step 1 - send verification code */
  const handleSendCode = async () => {
    const res = await sendVerificationCode({ email, purpose: "signup" });
    if (res.is_successful) {
      setMsg("✅ Verification code sent, please check inbox(might be in Spam Section)");
      setStep(2);
    } else {
      setMsg("There is an error :( " + res.error_message + "\n please refresh the page and try again");
    }
  };

  /** Step 2 - Verify the code */
  const handleVerifyCode = async () => {
    const res = await verifyEmailCode({ email, code });
    if (res.is_successful) {
      setMsg("✅ Mail Verified!");
      setStep(3);
    } else {
      setMsg("❌ " + res.error_message);
    }
  };

  /** Step 3 - Register Account */
  const handleSignup = async () => {
    const req: SignUpReq = { username, email, password };
    const res = await signUpUser(req);
    if (res.isSuccessful) {
      setMsg("🎉 Registered Successfully, navigating to login page in 3 second...");
      // ✅ navigate to login page
      setTimeout(() => navigate("/login"), 3000);
    } else {
      setMsg("❌ " + res.errorMessage);
    }
  };

  return (
    <div>
      <h1>YOoO! This is the Sign Up page!</h1>
      <p>{msg}</p>

      {step === 1 && (
        <div>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={handleSendCode}>Send Verification Code</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <input
            placeholder="Verification Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button onClick={handleVerifyCode}>Verify the Code</button>
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
          <button onClick={handleSignup}>Register</button>
        </div>
      )}
    </div>
  );
}
