import React, { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ResetPasswordModal from "./ResetPasswordModal";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth } from "../firebase";
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
    const emailRegex = /^[^@\s]+@huntsmanoptics\.com$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email syntax");
      setEmail("");
      return;
    }
    try {
      await auth.sendPasswordResetEmail(email);
      toast.success("Password reset email sent successfully!");
      setShowForgotPassword(false);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      toast.error("Failed to send password reset email.");
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  return (
    <div style={bodyStyle}>
      <div className="mobile-auth">
        {!showRegisterMobile ? (
          <div className="mobile-form">
            <LoginForm onForgotPassword={handleForgotPassword} />
            <p className="switch-text">
              Don’t have an account?{" "}
              <button
                className="link-btn"
                onClick={() => setShowRegisterMobile(true)}
              >
                Register
              </button>
            </p>
          </div>
        ) : (
          <div className="mobile-form">
            <RegisterForm onSuccessfulRegistration={() => setShowRegisterMobile(false)} />
            <p className="switch-text">
              Already have an account?{" "}
              <button
                className="link-btn"
                onClick={() => setShowRegisterMobile(false)}
              >
                Login
              </button>
            </p>
          </div>
        )}
      </div>

      {/*Desktop Overlay*/}
      <div
        className={`containerA ${isSignUp ? "right-panel-active" : ""}`}
        id="containerA"
      >
        {isSignUp ? (
          <RegisterForm onSuccessfulRegistration={() => setIsSignUp(false)} />
        ) : (
          <LoginForm onForgotPassword={handleForgotPassword} />
        )}
        <div className="overlay-containerA">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1 className="heading1">Welcome Back!</h1>
              <p>
                To keep connected with us please login with your personal info
              </p>
              <button
                className="ghost cmn-btn"
                onClick={() => setIsSignUp(false)}
              >
                Log In
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1 className="heading1">Hi there</h1>
              <p>Enter your personal details and start journey with us</p>
              <button
                className="ghost cmn-btn"
                onClick={() => setIsSignUp(true)}
              >
                Sign Up
              </button>
            </div>
          </div>
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

const bodyStyle = {
  background: "#f6f5f7",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "column",
  fontFamily: `'Montserrat', sans-serif`,
  height: "100vh",
};

export default SignInSignUpForm;
