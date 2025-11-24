// src/pages/NotFoundPage.tsx
import { useNavigate, useLocation } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        padding: "1.5rem",
        color: "#ffffffff",
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: 480,
        }}
      >
        <h1
          style={{
            fontSize: "3rem",
            marginBottom: "0.5rem",
            fontWeight: 800,
          }}
        >
          404
        </h1>
        <p
          style={{
            fontSize: "1.1rem",
            marginBottom: "0.75rem",
          }}
        >
            Yike! The page you are looking for does not exist.
        </p>
        <p
          style={{
            fontSize: "0.9rem",
            marginBottom: "1.5rem",
            opacity: 0.8,
          }}
        >
          the url:<code>{location.pathname}</code>
        </p>

        <button
          onClick={() => navigate("/me")}
            className="btn-gradient-animated"
        >
          go home
        </button>
      </div>
    </div>
  );
}
