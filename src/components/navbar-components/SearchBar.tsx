import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar({
  placeholder = "Search...",
}: {
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const nav = useNavigate();

  const onSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    nav(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{
        flex: 1,
        minWidth: 160,
        display: "flex",
        alignItems: "center",
        background: "#fff",
        borderRadius: 999,
        padding: "6px 12px",
        boxShadow: "inset 0 0 0 1px #e7e7e7",
      }}
    >
      <span style={{ marginRight: 8 }}></span>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        style={{
          border: "none",
          outline: "none",
          width: "100%",
          background: "transparent",
          fontSize: 14,
        }}
      />
    </form>
  );
}
