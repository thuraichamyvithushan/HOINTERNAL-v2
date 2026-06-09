import React, { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ResetPasswordModal from "./ResetPasswordModal";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth, firestore } from "../firebase";
import { API_URL } from "../config";
import "./SignUpSignIn.css";

const SignInSignUpForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showRegisterMobile, setShowRegisterMobile] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState("");

  const handleForgotPassword = () => {
    setEmail("");
    setShowForgotPassword(true);
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false);
  };

  const handleForgotPasswordSubmit = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/check-user?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error("Failed to verify email");
      }

      const data = await response.json();

      if (!data.exists) {
        toast.error("User details not found, please contact admin.");
        return;
      }

      await auth.sendPasswordResetEmail(email);
      toast.success("Password reset email sent successfully!");
      setShowForgotPassword(false);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      if (error.code === 'auth/invalid-email') {
        toast.error("Please enter a valid email address.");
      } else {
        toast.error("User details not found, please contact admin.");
      }
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  return (
    <div className="auth-page-wrapper">
      {/* Left Section: Image and Branding */}
      <div className="auth-left-section">
        <div 
          className="auth-image-bg" 
          style={{ backgroundImage: `url('/auth_bg_optics_1777007948086.png')` }}
        ></div>
        <div className="auth-image-overlay">
          <div className="auth-brand-content">
            <h1>HUNTSMAN OPTICS</h1>
            <p>Precision • Clarity • Performance</p>
          </div>
        </div>
      </div>

      {/* Right Section: Form */}
      <div className="auth-right-section">
        <div className="auth-form-box">
          {!isSignUp ? (
            <div className="auth-form-step">
              <div className="auth-form-header">
                <h2>Sign In</h2>
                <p className="form-subtitle">Welcome back to the portal</p>
              </div>
              <LoginForm onForgotPassword={handleForgotPassword} />
              <div className="auth-footer">
                <p>Don't have an account? 
                  <button className="auth-toggle-btn" onClick={() => setIsSignUp(true)}>
                    Register
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <div className="auth-form-step">
              <div className="auth-form-header">
                <h2>Register</h2>
                <p className="form-subtitle">Join the Huntsman network</p>
              </div>
              <RegisterForm onSuccessfulRegistration={() => setIsSignUp(false)} />
              <div className="auth-footer">
                <p>Already have an account? 
                  <button className="auth-toggle-btn" onClick={() => setIsSignUp(false)}>
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={showForgotPassword}
        onClose={closeForgotPasswordModal}
        onSubmit={handleForgotPasswordSubmit}
        email={email}
        handleEmailChange={handleEmailChange}
      />
    </div>
  );
};

const bodyStyle = {}; // Not used anymore as handled in CSS

export default SignInSignUpForm;
