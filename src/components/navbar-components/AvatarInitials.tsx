// src/components/navbar-components/AvatarInitials.tsx
import React from "react";
import { Dropdown } from "react-bootstrap";

function getInitials(name?: string | null) {
  if (!name) return "U";
  const chars = Array.from((name || "U").trim());
  return (chars[0] + (chars[1] || "")).toUpperCase();
}

export default function AvatarInitials({
  username,
  onSettingsClick,
  onLogout,
}: {
  username?: string | null;
  onSettingsClick?: () => void;
  onLogout?: () => void;
}) {
  const initials = getInitials(username);

  return (
  <Dropdown
    align="start"
    className="avatar-wrap"
  >
    <Dropdown.Toggle
      id="avatar-dd"
      variant="light"
      className="avatar-toggle p-0 border-0"
      title={username || "User"}
    >
      {initials}
    </Dropdown.Toggle>

    <Dropdown.Menu renderOnMount>

      <Dropdown.Item onClick={onSettingsClick}>Settings</Dropdown.Item>
      <Dropdown.Item href="/me">My Profile</Dropdown.Item>
      <Dropdown.Divider />
      <Dropdown.Item className="text-danger" onClick={onLogout}>
        Logout
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>

  );
}
