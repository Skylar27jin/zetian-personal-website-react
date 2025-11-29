// src/pages/ResetPasswordPage.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  sendVerificationCode,
  verifyEmailCode,
} from "../api/verificationApi";
import { ResetPassword } from "../api/userApi";
import type { ResetPasswordReq } from "../types/user";
import "../components/ColorfulButton.css";
import CreatePasswordInput from "../components/CreatePasswordInput";
import AuthLayout from "../layouts/AuthLayout";

export default function ResetPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1 - send verification code
  const handleSendCode = async () => {
    if (!email) {
      setMsg("❌ Please enter your email first.");
      return;
    }
    if (loading) return;

    setLoading(true);
    setMsg("");
    try {
      const res = await sendVerificationCode({
        email,
        purpose: "resetpassword", // ✅ 注意 purpose
      });
      if (res.is_successful) {
        setMsg(
          "✅ Verification code sent, please check inbox (may be in Spam)."
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

  // Step 2 - verify code
  const handleVerifyCode = async () => {
    if (!code) {
      setMsg("❌ Please enter the verification code.");
      return;
    }
    if (loading) return;

    setLoading(true);
    setMsg("");
    try {
      const res = await verifyEmailCode({
        email,
        code,
        purpose: "resetpassword", // ✅ 注意 purpose
      });
      if (res.is_successful) {
        setMsg("✅ Email verified, you can set a new password.");
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

  // Step 3 - reset password
  const handleResetPassword = async () => {
    if (!newPassword) {
      setMsg("❌ Password cannot be empty.");
      return;
    }
    if (newPassword.length < 8) {
      setMsg("❌ Password must be at least 8 characters.");
      return;
    }
    if (loading) return;

    setLoading(true);
    setMsg("");
    try {
      const req: ResetPasswordReq = {
        email,
        new_password: newPassword, // ✅ 对应 thrift 里的 new_password
      };
      const res = await ResetPassword(req);

      if (res.isSuccessful) {
        setMsg(
          "🎉 Password reset successfully, redirecting to login page..."
        );
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setMsg("❌ " + res.errorMessage);
      }
    } catch (e: any) {
      console.error("reset password error", e);
      setMsg("❌ Network/Server error while resetting password.");
    } finally {
      setLoading(false);
    }
  };

  // 当前步骤对应的主按钮
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
      : {
          text: loading ? "Resetting..." : "Reset password",
          onClick: handleResetPassword,
        };

  return (
    <AuthLayout>
      <div
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.4)",
          borderRadius: 18,
          padding: "2.5rem 2rem",
          boxShadow: "0 16px 40px rgba(15,23,42,0.18)",
          boxSizing: "border-box",
          backdropFilter: "blur(12px)",
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
          Reset password
        </h2>
        <p
          style={{
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
            color: "#64748b",
            textAlign: "center",
          }}
        >
          Step {step} of 3 · Secure your account
        </p>

        {/* Step 内容 */}
        {step === 1 && (
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              htmlFor="reset-email"
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
              id="reset-email"
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
              htmlFor="reset-code"
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
              id="reset-code"
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
            <CreatePasswordInput
              id="reset-password"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              show={showPassword}
              setShow={setShowPassword}
            />
          </>
        )}

        {/* 主按钮 */}
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

        {/* 底部：回登录 */}
        <div
          style={{
            marginTop: "1rem",
            textAlign: "center",
            fontSize: "0.85rem",
          }}
        >
          Remember your password?{" "}
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
    </AuthLayout>
  );
}