import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, firestore } from '../firebase';
import { getRoleHomePath } from "../utils/authHelpers";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./SignUpSignIn.css";
import Loader from "./Loader";

const LoginForm = ({ onForgotPassword }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter an email");
      return;
    }
    if (!password) {
      toast.error("Please enter the password");
      return;
    }

    try {
      setIsLoading(true);

      // Firebase login
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await auth.signOut();
        toast.error('Please verify your email address before logging in.');
        setIsLoading(false);
        return;
      }

      // Fetch role from Firestore
      const userDoc = await firestore.collection("users").doc(user.uid).get();
      if (!userDoc.exists) {
        toast.error("User data not found. Contact admin.");
        setIsLoading(false);
        return;
      }

      const userData = userDoc.data();

      // Use centralized redirection logic
      const targetPath = getRoleHomePath({ ...userData, uid: user.uid });

      if (targetPath === '/') {
        toast.error("Invalid role. Contact admin.");
      } else {
        toast.success(`Login successful as ${userData.role}`);
        navigate(targetPath, { replace: true });
      }

    } catch (error) {
      console.error('Error logging in:', error);
      if (error.code === 'auth/invalid-credential') {
        toast.error('Invalid credentials');
      } else {
        toast.error("Error during login");
      }
      setEmail('');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-containerA sign-in-containerA">
      {isLoading &&
        <div className="loader2-container">
          <Loader />
        </div>
      }
      <form onSubmit={handleLogin} className="form1">
        <h2 style={{ fontWeight: "bold", marginBottom: "15px" }}>Sign in</h2>
        <input
          type="email"
          placeholder="Email"
          className="input-common"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="input-common"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="anchor" onClick={onForgotPassword}>Forgot your password?</p>
        <button type="submit" className="cmn-btn" disabled={isLoading}>
          Log In
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
