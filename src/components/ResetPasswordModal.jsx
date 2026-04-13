import React from "react";
import "./ResetPasswordModal.css";

const ResetPasswordModal = ({ isOpen, onClose, onSubmit, email, handleEmailChange }) => {
  if (!isOpen) return null;

  return (
    <div className="re-modal-overlay">
      <div className="re-modal-content">
        <span className="re-close-button" onClick={onClose}>&times;</span>
        <h3 style={{paddingBottom:"10px"}}>Reset Password</h3>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={handleEmailChange}
          className="re-input-common"
        />
        <button onClick={onSubmit} className="re-cmn-btn" style={{marginTop:"10px"}}>Submit</button>
      </div>
    </div>
  );
};

export default ResetPasswordModal;
