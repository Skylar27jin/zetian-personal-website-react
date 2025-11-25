// src/layout/BaseLayout.tsx
import React from "react";
import MyNavbar from "../components/Navbar";

interface BaseLayoutProps {
  children: React.ReactNode;
}

export default function BaseLayout({ children }: BaseLayoutProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffffff",
      }}
    >
      {/* 顶部导航栏 */}
      <MyNavbar />

      {/* 三栏布局 */}
      <div
        style={{
          display: "flex",
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "1rem",
          gap: "1.5rem",
        }}
      >
        {/* 左侧区域
        <aside
          style={{
            width: "220px",
            minWidth: "220px",
            background: "white",
            borderRadius: "12px",
            padding: "1rem",
            boxShadow: "0px 2px 10px rgba(0,0,0,0.05)",
            height: "fit-content",
          }}
        >
          <h6 className="fw-bold mb-3">Left Panel</h6>
          <p className="text-muted" style={{ fontSize: "0.9rem" }}>
            You can put navigation links, user info, or categories here.
          </p>
        </aside> */}

        {/* 中间主内容 */}
        <main style={{ flex: 1 }}>{children}</main>

        {/* 右侧区域 */}
        {/* <aside
          style={{
            width: "260px",
            minWidth: "260px",
            background: "white",
            borderRadius: "12px",
            padding: "1rem",
            boxShadow: "0px 2px 10px rgba(0,0,0,0.05)",
            height: "fit-content",
          }}
        >
          <h6 className="fw-bold mb-3">Right Panel</h6>
          <p className="text-muted" style={{ fontSize: "0.9rem" }}>
            You can put trending posts, ads, etc.
          </p>
        </aside> */}
      </div>
    </div>
  );
}
