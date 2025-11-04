// src/components/Navbar.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar, Container, Nav, Button } from "react-bootstrap";

// 和 UserForumIndex 保持一致的 key
const LS_KEYS = {
  userId: "me:id",
  email: "me:email",
  username: "me:username",
} as const;

type UserInfo = {
  id: string;
  email: string;
  username: string;
};

export default function MyNavbar() {
  const [user, setUser] = useState<UserInfo | null>(null);

  // 组件挂载时，从 localStorage 里读用户信息
  useEffect(() => {
    const id = localStorage.getItem(LS_KEYS.userId);
    const email = localStorage.getItem(LS_KEYS.email);
    const username = localStorage.getItem(LS_KEYS.username) || "";

    if (id && email) {
      setUser({ id, email, username });
    } else {
      setUser(null);
    }
  }, []);

  return (
    <Navbar bg="light" expand="sm" className="border-bottom shadow-sm">
      <Container className="max-w-3xl">
        {/* 左侧：Logo/Title */}
        <Navbar.Brand as={Link} to="/me">
          Go to My Forum
        </Navbar.Brand>

        {/* 手机端折叠菜单按钮 */}
        <Navbar.Toggle aria-controls="main-navbar" />

        <Navbar.Collapse id="main-navbar" className="justify-content-end">
          {/* 右侧：如果已登录，显示用户信息；否则显示 Login / Sign Up */}
          {user ? (
            <div className="d-flex flex-column align-items-end text-muted small">
              <span>
                {user.username || "User"} (ID: {user.id})
              </span>
              <span>{user.email}</span>
            </div>
          ) : (
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
