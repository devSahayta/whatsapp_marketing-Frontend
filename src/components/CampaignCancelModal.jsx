// components/CampaignCancelModal.jsx

import React from "react";
import { Ban, X } from "lucide-react";
import "../styles/model.css";

const CampaignCancelModal = ({
  isOpen,
  onClose,
  onConfirm,
  campaignName,
  isProcessing = false,
  isCancelling = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content cancel-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="modal-close"
          onClick={onClose}
          disabled={isCancelling}
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="modal-icon cancel-icon">
          <Ban size={48} />
        </div>

        {/* Title */}
        <h2 className="modal-title">
          {isProcessing ? "Stop Running Campaign?" : "Cancel Campaign?"}
        </h2>

        {/* Item Name */}
        {campaignName && (
          <div className="modal-item-name">
            <strong className="cancel-item-name">"{campaignName}"</strong>
          </div>
        )}

        {/* Warning Message */}
        <div className="modal-warning cancel-warning">
          <p>
            {isProcessing
              ? "This campaign is actively sending messages right now. Cancelling will stop all remaining messages from going out within a few seconds — but messages already sent cannot be recalled."
              : "This will cancel the campaign before it starts. No messages will be sent to this group."}
          </p>
        </div>

        {isProcessing && (
          <div className="modal-warning-note cancel-warning-note">
            <Ban size={16} />
            <span>
              Already-sent messages stay delivered. This cannot be undone.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isCancelling}
          >
            Keep Running
          </button>
          <button
            className="btn btn-warning"
            onClick={onConfirm}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <>
                <div className="btn-spinner"></div>
                Cancelling...
              </>
            ) : isProcessing ? (
              "Stop Campaign"
            ) : (
              "Yes, Cancel"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignCancelModal;
