import React, { useState } from "react";
import { toast } from "react-toastify";
import { auth } from "../firebase";
import { API_URL } from "../config";
import "./SignUpSignIn.css";

const AcceptInvite = () => {
  const hashQuery = window.location.hash.split("?")[1];
  const params = new URLSearchParams(hashQuery);

  const inviteId = params.get("inviteId");
  const token = params.get("token");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isCreating, setIsCreating] = useState(false);

  const acceptInvite = async () => {
    if (isCreating) return;

    if (!inviteId || !token) {
      toast.error("Invalid invite link");
      return;
    }

    if (!name || !email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setIsCreating(true);

      const userCredential = await auth.createUserWithEmailAndPassword(
        email,
        password
      );

      const uid = userCredential.user.uid;

      const response = await fetch(`${API_URL}/api/invites/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inviteId,
          token,
          uid,
          name
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept invite");
      }

      await auth.currentUser.getIdToken(true);

      toast.success("Account created successfully!");
      window.location.href = "/#/";

    } catch (error) {
      toast.error(error.message);
      setIsCreating(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
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

      <div className="auth-right-section">
        <div className="auth-form-box">
          <div className="auth-form-step">
            <div className="auth-form-header">
              <h2>Accept Invite</h2>
              <p className="form-subtitle">
                Create your account to access the Huntsman Portal
              </p>
            </div>

            <div className="invite-form-fields">
              <input
                className="auth-input"
                type="text"
                placeholder="Full name"
                value={name}
                disabled={isCreating}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                className="auth-input"
                type="email"
                placeholder="Invited email address"
                value={email}
                disabled={isCreating}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                className="auth-input"
                type="password"
                placeholder="Create password"
                value={password}
                disabled={isCreating}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                className="auth-submit-btn"
                onClick={acceptInvite}
                disabled={isCreating}
              >
                {isCreating ? "Creating Account..." : "Create Account"}
              </button>
            </div>

            <div className="auth-footer">
              <p>
                Already created your account?
                <button
                  className="auth-toggle-btn"
                  disabled={isCreating}
                  onClick={() => (window.location.href = "/#/")}
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvite;