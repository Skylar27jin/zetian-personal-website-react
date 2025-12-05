// src/components/LoginRequiredModal.tsx
import React from "react";
import { Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

interface LoginRequiredModalProps {
  show: boolean;
  onHide: () => void;
  message?: string;
}

const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({
  show,
  onHide,
  message = "Please log in first to like or favorite this post.",
}) => {
  const navigate = useNavigate();

  const handleGoLogin = () => {
    onHide();
    navigate("/login");
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Body className="text-center">
        {/* gopher 表情 */}
        <div className="mb-3">
          <img
            src="/gopher-construction.png"
            alt="gopher"
            style={{ width: 80, height: 80 }}
          />
        </div>
        <h5 className="fw-semibold mb-2">Heads up!</h5>
        <p className="text-muted mb-0">{message}</p>
      </Modal.Body>
      <Modal.Footer className="justify-content-center">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={onHide}
        >
          Maybe later
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleGoLogin}
        >
          Go to Login
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LoginRequiredModal;