import { useState } from "react";
import { loginUser } from "../api/userApi";
import type { LoginReq, LoginResp } from "../types/user";

export default function LoginPage() {
  const [form, setForm] = useState<LoginReq>({
    email: "",
    password: "",
  });
  const [msg, setMsg] = useState("");

  async function handleLogin() {
    try {
      const resp: LoginResp = await loginUser(form);

      if (resp.isSuccessful) {
        setMsg(`✅ Welcome, ${resp.userName}`);
        // 这里将来可以存 token / cookie 等等
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
