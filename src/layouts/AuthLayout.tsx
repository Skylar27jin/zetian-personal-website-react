import React from "react";
import "./AuthLayout.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-layout">
      <img
        src="gopher-dance-long-3x.gif"
        className="auth-gopher auth-gopher-top"
        alt="gopher"
      />

      <div className="auth-content">
        {children}
      </div>

      <img
        src="/gopher-dance-long-3x.gif"
        className="auth-gopher auth-gopher-bottom"
        alt="gopher"
      />
    </div>
  );
}
