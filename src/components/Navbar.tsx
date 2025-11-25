// src/components/Navbar.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Navbar, Container, Nav, Button, Spinner } from "react-bootstrap";
import { useMeAuth } from "../hooks/useMeAuth";

export default function MyNavbar() {
  const { authLoading, authError, userId, username } = useMeAuth();

  const isLoggedIn = !!userId && !authError;

  // 小小的 logout：清理 localStorage，然后刷新页面即可
  const handleLogout = () => {
    localStorage.removeItem("me:id");
    localStorage.removeItem("me:email");
    localStorage.removeItem("me:username");
    window.location.href = "/login"; // 或者 "/"
  };

  return (
    <Navbar bg="light" expand="sm" className="border-bottom shadow-sm">
      <Container className="max-w-3xl">
      {/* 左侧 Nav 图标组 */}
      <div className="d-flex align-items-center gap-4">

        {/* Forum */}
        <Link
          to="/me"
          className="text-decoration-none text-dark d-flex flex-column align-items-center"
          style={{ fontSize: "0.85rem" }}
        >
          <span style={{ fontSize: "1.5rem", lineHeight: "1" }}>🏠</span>
          <span>My Index</span>
        </Link>

        {/* School Index */}
        <Link
          to="/school"
          className="text-decoration-none text-dark d-flex flex-column align-items-center"
          style={{ fontSize: "0.85rem" }}
        >
          <span style={{ fontSize: "1.5rem", lineHeight: "1" }}>🎓</span>
          <span>To School</span>
        </Link>

      </div>

        {/* 手机端 toggle */}
        <Navbar.Toggle aria-controls="main-navbar" />

        <Navbar.Collapse id="main-navbar" className="justify-content-end">

          {/* loading 状态 */}
          {authLoading && (
            <div className="d-flex align-items-center text-muted small gap-2">
              <Spinner animation="border" size="sm" />
              <span>Verifying session…</span>
            </div>
          )}

          {/* 已登录 */}
          {!authLoading && isLoggedIn && (
            <div className="d-flex flex-column align-items-end text-muted small">
              {/* 第一行：显示用户信息 */}
              <span>
                {username || "User"} (ID: {userId})
              </span>

              {/* 第二行：Logout 小按钮 */}
              <Button
                variant="outline-danger"
                size="sm"
                className="mt-1 py-0 px-2"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          )}

          {/* 未登录 */}
          {!authLoading && !isLoggedIn && (
            <Nav className="align-items-center gap-2">
              <Button
                as={Link as any}
                to="/login"
                variant="outline-secondary"
                size="sm"
              >
                Login
              </Button>
              <Button
                as={Link as any}
                to="/signup"
                variant="dark"
                size="sm"
              >
                Sign Up
              </Button>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
