// src/pages/settings/SettingsPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import { motion } from "framer-motion";

import Navbar from "../../components/Navbar";
import { useMeAuth } from "../../hooks/useMeAuth";
import { LogoutUser } from "../../api/userApi";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { userId, username, email, authLoading, clearAuth } = useMeAuth();
  const isLoggedIn = !!userId;

  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    if (logoutLoading) return;
    setLogoutLoading(true);
    setLogoutError(null);

    try {
      await LogoutUser({});
    } catch (err: any) {
      setLogoutError(
        err?.message || "Logout request failed, local state will be cleared."
      );
    } finally {
      clearAuth();
      setLogoutLoading(false);
      navigate("/login");
    }
  }

  function goProfileSettings() {
    navigate("/settings/profile");
  }

  function goSecuritySettings() {
    navigate("/settings/security");
  }

  return (
    <>
      <Navbar />
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="mb-3">Settings</h2>

              {/* 用户信息简单展示 */}
              <Card className="mb-4">
                <Card.Body>
                  <div className="fw-semibold mb-1">
                    {authLoading ? "Loading..." : username || "Guest"}
                  </div>
                  <div className="text-muted small mb-1">
                    {email || "No email"}
                  </div>
                  {isLoggedIn && (
                    <div className="text-muted small">
                      ID: <code>{userId}</code>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* 1. Profile Settings 入口 */}
                <Card className="mb-3">
                  <Card.Header>Profile</Card.Header>
                  <Card.Body>
                  <p className="text-muted small mb-3">
                    Edit your avatar, profile background, display name, school,
                    and bio.
                  </p>
                  <Button
                    variant="primary"
                    onClick={goProfileSettings}
                    disabled={!isLoggedIn}
                  >
                    Go to Profile Settings
                  </Button>
                </Card.Body>
              </Card>

              {/* 2. Security Settings 入口 */}
              <Card className="mb-3">
                <Card.Header>Security</Card.Header>
                <Card.Body>
                  <p className="text-muted small mb-3">
                    Manage your account security, including password reset.
                  </p>
                  <Button
                    variant="outline-secondary"
                    onClick={goSecuritySettings}
                    disabled={!isLoggedIn}
                  >
                    Go to Security Settings
                  </Button>
                </Card.Body>
              </Card>

              {/* 3. Logout */}
              <Card>
                <Card.Header>Logout</Card.Header>
                <Card.Body>
                  {logoutError && (
                    <Alert variant="danger" className="py-2">
                      {logoutError}
                    </Alert>
                  )}
                  <Button
                    variant="danger"
                    onClick={handleLogout}
                    disabled={logoutLoading || !isLoggedIn}
                  >
                    {logoutLoading && (
                      <Spinner
                        animation="border"
                        size="sm"
                        className="me-2"
                      />
                    )}
                    Logout
                  </Button>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </>
  );
}