// src/pages/settings/SettingsSecurityPage.tsx
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar";
import { useMeAuth } from "../../hooks/useMeAuth";

export default function SettingsSecurityPage() {
  const navigate = useNavigate();
  const { userId } = useMeAuth();
  const isLoggedIn = !!userId;

  function handleGoResetPassword() {
    navigate("/reset-password");
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
              <h2 className="mb-3">Security Settings</h2>

              <Card className="mb-3">
                <Card.Header>Security</Card.Header>
                <Card.Body>
                  <p className="text-muted small mb-3">
                    You can reset your account password here.
                  </p>
                  <Button
                    variant="outline-secondary"
                    onClick={handleGoResetPassword}
                    disabled={!isLoggedIn}
                  >
                    Reset password
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