// src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/userApi";
import type { LoginReq, LoginResp } from "../types/user";
import "../components/ColorfulButton.css";

export default function LoginPage() {
  const [form, setForm] = useState<LoginReq>({
    email: "",
    password: "",
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault();
    if (loading) return;

    setLoading(true);
    setMsg("");
    try {
      const resp: LoginResp = await loginUser(form);

      if (resp.isSuccessful) {
        setMsg(`✅ Welcome, ${resp.userName}`);
        setTimeout(() => navigate("/me"), 800);
      } else {
        setMsg(`❌ ${resp.errorMessage}`);
      }
    } catch (e) {
      setMsg("❌ Network/Server error");
    } finally {
      setLoading(false);
    }
  }

  function handleGoSignup() {
    navigate("/signup");
  }

  function handleGoResetPassword() {
    navigate("/reset-password");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // 灰色背景
        background: "#e5e7eb",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
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
          Login
        </h2>

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              htmlFor="email"
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
              id="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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

          {/* Password */}
          <div style={{ marginBottom: "0.75rem" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "0.35rem",
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              Password
            </label>
            <input
              id="password"
              placeholder="••••••••"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
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

          {/* Sign up + Reset password */}
          <div
            style={{
              marginBottom: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <button
              type="button"
              onClick={handleGoSignup}
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                fontSize: "0.85rem",
                color: "#0f172a",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Sign up
            </button>

            <button
              type="button"
              onClick={handleGoResetPassword}
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
              Reset password
            </button>
          </div>

          {/* Login 按钮居中 */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "60%",
                padding: "0.8rem 1rem",
                borderRadius: 999,
                border: "none",
              }}
              className="btn-gradient-animated"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>

        {/* Message */}
        {msg && (
          <p
            style={{
              marginTop: "1.25rem",
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
