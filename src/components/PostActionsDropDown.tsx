// src/components/PostActionsDropdown.tsx
import React from "react";
import { Dropdown } from "react-bootstrap";

interface PostActionsDropdownProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  deleting?: boolean;
}

const PostActionsDropdown: React.FC<PostActionsDropdownProps> = ({
  onEdit,
  onDelete,
  onReport,
  deleting = false,
}) => {
  const hasMenu = !!onEdit || !!onDelete || !!onReport;
  if (!hasMenu) return null;

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        as="span"
        bsPrefix="post-card-toggle"
        className="text-muted"
        style={{
          cursor: "pointer",
          padding: "2px 6px",
          fontSize: "20px",
          lineHeight: "1",
          background: "none",
          border: "none",
          boxShadow: "none",
        }}
      >
        ...
      </Dropdown.Toggle>

      <Dropdown.Menu>
        {onEdit && (
          <Dropdown.Item onClick={onEdit}>
            ✏️ Edit
          </Dropdown.Item>
        )}

        {onDelete && (
          <Dropdown.Item
            className="text-danger"
            onClick={onDelete}
            disabled={deleting}
          >
            🗑 Delete
          </Dropdown.Item>
        )}

        {onReport && (
          <Dropdown.Item onClick={onReport}>
            Report
          </Dropdown.Item>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default PostActionsDropdown;
