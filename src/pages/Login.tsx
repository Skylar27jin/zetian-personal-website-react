import { useState } from "react";
import { loginUser } from "../api/userApi";
import type { LoginReq, LoginResp } from "../types/user";
import { Navigate, useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [form, setForm] = useState<LoginReq>({
    email: "",
    password: "",
  });
  const [msg, setMsg] = useState("");
  const navigate = useNavigate(); // ✅ Hook 初始化
  async function handleLogin() {
    try {
      const resp: LoginResp = await loginUser(form);

      if (resp.isSuccessful) {
        setMsg(`✅ Welcome, ${resp.userName} \n navigating to the index`);
        setTimeout(() => navigate("/talk"), 1000);
      } else {
        setMsg(`❌ ${resp.errorMessage}`);
      }
    } catch (e) {
      setMsg("❌ Network/Server error");
    }
  }

  return (
    <div>
      <h1>Login</h1>

      <input
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <input
        placeholder="Password"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      <button onClick={handleLogin}>Login</button>

      <p>{msg}</p>
    </div>
  );
}
