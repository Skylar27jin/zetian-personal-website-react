// src/components/Navbar.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Navbar, Container, Nav, Button, Spinner } from "react-bootstrap";
import { useMeAuth } from "../hooks/useMeAuth";

export default function MyNavbar() {
  const {
    authLoading,
    authError,
    userId,
    username,
    email,
  } = useMeAuth();

  const isLoggedIn = !!userId && !authError;

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
          {/* 右侧：loading 状态 */}
          {authLoading && (
            <div className="d-flex align-items-center text-muted small gap-2">
              <Spinner animation="border" size="sm" />
              <span>Verifying session…</span>
            </div>
          )}

          {/* 右侧：已登录 */}
          {!authLoading && isLoggedIn && (
            <div className="d-flex flex-column align-items-end text-muted small">
              <span>
                {username || "User"} (ID: {userId})
              </span>
              <span>{email}</span>
            </div>
          )}

          {/* 右侧：未登录（或者 token 失效） */}
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