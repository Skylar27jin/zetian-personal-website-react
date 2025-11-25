// src/pages/SignupPage.tsx 
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendVerificationCode, verifyEmailCode } from "../api/verificationApi";
import { signUpUser } from "../api/userApi";
import type { SignUpReq } from "../types/user";
import "../components/ColorfulButton.css";
import CreatePasswordInput from "../components/CreatePasswordInput";

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // ✅ 新增
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  /** Step 1 - send verification code */
  const handleSendCode = async () => {
    if (!email) {
      setMsg("❌ Please enter your email first.");
      return;
    }
    if (loading) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await sendVerificationCode({ email, purpose: "signup" });
      if (res.is_successful) {
        setMsg(
          "✅ Verification code sent, please check inbox (might be in Spam)."
        );
        setStep(2);
      } else {
        setMsg(
          "There is an error :( " +
            res.error_message +
            "\nPlease refresh the page and try again."
        );
      }
    } catch (e) {
      setMsg("❌ Network/Server error while sending code.");
    } finally {
      setLoading(false);
    }
  };

  /** Step 2 - Verify the code */
  const handleVerifyCode = async () => {
    if (!code) {
      setMsg("❌ Please enter the verification code.");
      return;
    }
    if (loading) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await verifyEmailCode({ email, code, purpose: "signup" });
      if (res.is_successful) {
        setMsg("✅ Email verified!");
        setStep(3);
      } else {
        setMsg("❌ " + res.error_message);
      }
    } catch (e) {
      setMsg("❌ Network/Server error while verifying code.");
    } finally {
      setLoading(false);
    }
  };

  /** Step 3 - Register Account */
  const handleSignup = async () => {
    if (!username || !password) {
      setMsg("❌ Username and password cannot be empty.");
      return;
    }
    if (password.length < 8) {
      setMsg("❌ Password must be at least 8 characters.");
      return;
    }
    if (loading) return;

    setLoading(true);
    setMsg("");
    try {
      const req: SignUpReq = { username, email, password };
      const res = await signUpUser(req);

      if (res.isSuccessful) {
        setMsg(
          "🎉 Registered successfully, navigating to login page in 3 seconds..."
        );
        setTimeout(() => navigate("/login"), 3000);
      } else {
        const msg = (res.errorMessage || "").toLowerCase();

        if (msg.includes("already")) {
          setMsg(
            "❌ This email is already registered. Redirecting you to login..."
          );
          setTimeout(() => navigate("/login"), 1000);
        } else {
          setMsg("❌ " + res.errorMessage);
        }
      }
    } catch (e: any) {
      console.error("signup error", e);

      const backendMsg =
        e?.response?.data?.errorMessage || e?.response?.data?.message;

      if (
        typeof backendMsg === "string" &&
        backendMsg.toLowerCase().includes("already")
      ) {
        setMsg(
          "❌ This email is already registered. Redirecting you to login..."
        );
        setTimeout(() => navigate("/login"), 1000);
      } else {
        setMsg("❌ Network/Server error while registering.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 当前步骤对应的主按钮文字 & handler
  const primaryAction =
    step === 1
      ? {
          text: loading ? "Sending..." : "Send verification code",
          onClick: handleSendCode,
        }
      : step === 2
      ? {
          text: loading ? "Verifying..." : "Verify code",
          onClick: handleVerifyCode,
        }
      : { text: loading ? "Signing up..." : "Sign up", onClick: handleSignup };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#e5e7eb", // 灰色背景
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#ffffff",
          borderRadius: 18,
          padding: "2.5rem 2rem",
          boxShadow: "0 16px 40px rgba(15,23,42,0.18)",
        }}
      >
        <h2
          style={{
            marginBottom: "0.25rem",
            fontSize: "1.75rem",
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          Sign up
        </h2>
        <p
          style={{
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
            color: "#64748b",
            textAlign: "center",
          }}
        >
          Step {step} of 3 · Create your account
        </p>

        {/* Step 专属表单内容 */}
        {step === 1 && (
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              htmlFor="signup-email"
              style={{
                display: "block",
                marginBottom: "0.35rem",
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              Email
            </label>
            <input
              id="signup-email"
              placeholder="gopher@tt.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "0.65rem 0.8rem",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                fontSize: "0.95rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {step === 2 && (
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              htmlFor="signup-code"
              style={{
                display: "block",
                marginBottom: "0.35rem",
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              Verification code
            </label>
            <input
              id="signup-code"
              placeholder="Enter the code from your email"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                width: "100%",
                padding: "0.65rem 0.8rem",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                fontSize: "0.95rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "0.8rem",
                color: "#64748b",
              }}
            >
              Sent to: <strong>{email}</strong>
            </p>
          </div>
        )}

        {step === 3 && (
          <>
            <div style={{ marginBottom: "1.0rem" }}>
              <label
                htmlFor="signup-username"
                style={{
                  display: "block",
                  marginBottom: "0.35rem",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                }}
              >
                Username
              </label>
              <input
                id="signup-username"
                placeholder="Your nickname"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.8rem",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <CreatePasswordInput
              id="signup-password"
              label="Password"
              value={password}
              onChange={setPassword}
              show={showPassword}            // ✅ 传入 show
              setShow={setShowPassword}      // ✅ 传入 setShow
            />
          </>
        )}

        {/* 主按钮（居中 + 渐变） */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "0.5rem",
          }}
        >
          <button
            type="button"
            disabled={loading}
            onClick={primaryAction.onClick}
            style={{
              width: "70%",
              padding: "0.8rem 1rem",
              borderRadius: 999,
              border: "none",
            }}
            className="btn-gradient-animated"
          >
            {primaryAction.text}
          </button>
        </div>

        {/* 底部：已有账号？去登录 */}
        <div
          style={{
            marginTop: "1rem",
            textAlign: "center",
            fontSize: "0.85rem",
          }}
        >
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              fontSize: "0.85rem",
              color: "#6366f1",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Login
          </button>
        </div>

        {/* Message */}
        {msg && (
          <p
            style={{
              marginTop: "1.0rem",
              fontSize: "0.9rem",
              textAlign: "center",
              whiteSpace: "pre-line",
            }}
          >
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}
