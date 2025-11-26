// src/components/Navbar.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Navbar, Container, Button } from "react-bootstrap";
import { motion } from "framer-motion";
import { useMeAuth } from "../hooks/useMeAuth";
import AvatarInitials from "./navbar-components/AvatarInitials";
import SearchBar from "./navbar-components/SearchBar";
import "./Navbar.css";

const FEED_TABS = [
  { key: "school", label: "School", to: "/school" },
  { key: "me", label: "Me", to: "/me" },
];

export default function MyNavbar() {
  const location = useLocation();
  const { authError, userId, username } = useMeAuth();
  const isLoggedIn = !!userId && !authError;
  const nav = useNavigate();

  // —— 滚动方向控制（带回差与微抖动过滤） —— //
  const [showTopRow, setShowTopRow] = useState(true);
  const lastY = useRef(0);
  const lastToggleY = useRef(0);
  const ticking = useRef(false);

  const HIDE_MIN_Y = 96;
  const HIDE_DELTA = 64;
  const SHOW_DELTA = 16;
  const NOISE = 6;

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      if (ticking.current) return;

      window.requestAnimationFrame(() => {
        if (y < 8) {
          if (!showTopRow) setShowTopRow(true);
          lastY.current = y;
          lastToggleY.current = y;
          ticking.current = false;
          return;
        }

        const delta = y - lastY.current;
        lastY.current = y;

        if (Math.abs(delta) <= NOISE) {
          ticking.current = false;
          return;
        }

        if (!showTopRow) {
          if (lastToggleY.current - y >= SHOW_DELTA) {
            setShowTopRow(true);
            lastToggleY.current = y;
          }
        } else {
          if (y > HIDE_MIN_Y && y - lastToggleY.current >= HIDE_DELTA && delta > 0) {
            setShowTopRow(false);
            lastToggleY.current = y;
          }
        }

        ticking.current = false;
      });
      ticking.current = true;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showTopRow]);

  return (
    <Navbar bg="light" sticky="top" className="border-bottom shadow-sm">
      <Container className="max-w-3xl d-flex flex-column py-1" style={{ gap: 0 }}>
        {/* Row 1: Avatar | Search | Inbox | Create —— 可折叠 */}
        <div className={`top-row ${showTopRow ? "" : "top-row--hidden"}`}>
          <div className="d-flex align-items-center justify-content-between" style={{ gap: 12 }}>
            {/* Avatar */}
            <div className="d-flex align-items-center" style={{ gap: 4 }}>
              <AvatarInitials
                username={username}
                onSettingsClick={() => nav("/settings")}
                onLogout={() => {
                  localStorage.removeItem("me:id");
                  localStorage.removeItem("me:email");
                  localStorage.removeItem("me:username");
                  window.location.href = "/login";
                }}
              />
            </div>

            {/* Search (flex-1) */}
            <div style={{ flex: 1, minWidth: 140 }}>
              <SearchBar placeholder="Search topics, users..." />
            </div>

            {/* Inbox：纯图标，无边框 */}
            <span
              role="button"
              tabIndex={0}
              title="Inbox (coming soon)"
              className="icon-plain"
              aria-label="Inbox"
              onClick={() => alert("Inbox coming soon~")}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && alert("Inbox coming soon~")}
            >
              ✉️
            </span>

            {/* Create */}
            <motion.div whileTap={{ scale: 1.06 }} transition={{ duration: 0.12 }}>
              <Button
                as={Link as any}
                to="/post/create"
                className="btn-gradient-animated"
                size="sm"
                title="Create New Post"
                aria-label="Create New Post"
              >
                +
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Row 2: Feed Tabs —— 始终可见 */}
        <nav className="feed-tabs feed-tabs--compact">
          {FEED_TABS.map((t) => (
            <Link
              key={t.key}
              to={t.to}
              className={
                "feed-tab" +
                (location.pathname.startsWith(t.to) ? " active" : "")
              }
            >
              {t.label}
            </Link>
          ))}
        </nav>

      </Container>
    </Navbar>
  );
}
