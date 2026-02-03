// components/DeleteConfirmModal.jsx

import React from "react";
import { AlertTriangle, X } from "lucide-react";
import "../styles/model.css";

const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Delete Group",
  itemName,
  warningMessage,
  confirmText = "Yes, Delete",
  cancelText = "Cancel",
  isDeleting = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close" onClick={onClose} disabled={isDeleting}>
          <X size={20} />
        </button>

        {/* Warning Icon */}
        <div className="modal-icon warning-icon">
          <AlertTriangle size={48} />
        </div>

        {/* Title */}
        <h2 className="modal-title">{title}</h2>

        {/* Item Name */}
        {itemName && (
          <div className="modal-item-name">
            <strong>"{itemName}"</strong>
          </div>
        )}

        {/* Warning Message */}
        <div className="modal-warning">
          <p>{warningMessage}</p>
        </div>

        {/* Additional Info */}
        <div className="modal-info">
          <ul>
            <li>✗ All contacts in this group</li>
            <li>✗ All messages and chat history</li>
            <li>✗ All campaigns associated with this group</li>
            <li>✗ All analytics and reports</li>
          </ul>
        </div>

        <div className="modal-warning-note">
          <AlertTriangle size={16} />
          <span>This action cannot be undone!</span>
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={isDeleting}
          >
            {cancelText}
          </button>
          <button 
            className="btn btn-danger" 
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="btn-spinner"></div>
                Deleting...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;