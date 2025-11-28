// src/hooks/useMeAuth.ts
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export function useMeAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useMeAuth must be used within AuthProvider");
  }
  return ctx;
}
