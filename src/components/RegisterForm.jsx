import React, { useState } from "react";
import { auth, firestore } from '../firebase';
import { toast } from "react-toastify";
import "./SignUpSignIn.css";
import Loader from "./Loader";

const RegisterForm = ({ onSuccessfulRegistration }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    country: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // New state to handle role selection step
  const [roleSelected, setRoleSelected] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle role button click
  const handleRoleClick = (role) => {
    setFormData({ ...formData, role });
    setRoleSelected(true); // move to form
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { email, password, confirmPassword, name, role, country } = formData;

    // --- Existing validation & signup logic ---
    if (!name) return toast.error("Please enter a name");
    if (!email) return toast.error("Please enter an email");
    if (!password) return toast.error("Please enter a strong password");
    if (!confirmPassword) return toast.error("Please confirm your password");
    if (!role) return toast.error("Please select a role");
    if (!country) return toast.error("Please select your country");
    if (password !== confirmPassword) return toast.error("Passwords do not match");

    const staffRegex = /^[^@\s]+@huntsmanoptics\.com$/;
    const generalEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (role === "staff" && !staffRegex.test(email)) {
      return toast.error("Staff email must be '@huntsmanoptics.com'");
    }
    if ((role === "representative" || role === "dealer" || role === "influencer") && !generalEmailRegex.test(email)) {
      return toast.error("Please enter a valid email");
    }

    try {
      setIsLoading(true);

      const { user } = await auth.createUserWithEmailAndPassword(email, password);
      await user.sendEmailVerification();

      const userId = user.uid;

      await firestore.collection("users").doc(userId).set({
        name,
        email,
        role,
        country,
        emailVerified: false,
      });

      toast.success("Please check your email and verify your account.");

      // Sign out the user immediately so they are not auto-logged in
      await auth.signOut();

      onSuccessfulRegistration();

      setFormData({ name: '', email: '', password: '', confirmPassword: '', role: '', country: '' });
    } catch (error) {
      console.log(error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email already exists. Please use a different email.');
      } else {
        toast.error("Error while creating the user");
      }
      setFormData({ ...formData, email: '' });
    } finally {
      setIsLoading(false);
    }
  };


  const heading = { fontWeight: "bold", marginBottom: "15px" };

  // Render role selection first
  // Render role selection first
  if (!roleSelected) {
    return (
      <div
        className="form-containerA sign-up-containerA"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "15px",
          padding: "3%"


        }}
      >
        <h2 style={heading}>Select Your Role</h2>
        <button
          className="cmn-btn"
          onClick={() => handleRoleClick("staff")}
          style={{ width: "90%", padding: "12px 0", fontSize: "16px" }}
        >
          Staff
        </button>
        <button
          className="cmn-btn"
          onClick={() => handleRoleClick("representative")}
          style={{ width: "90%", padding: "12px 0", fontSize: "16px" }}
        >
          Representative
        </button>
        <button
          className="cmn-btn"
          onClick={() => handleRoleClick("dealer")}
          style={{ width: "90%", padding: "12px 0", fontSize: "16px" }}
        >
          Dealer
        </button>
        <button
          className="cmn-btn"
          onClick={() => handleRoleClick("influencer")}
          style={{ width: "90%", padding: "12px 0", fontSize: "16px" }}
        >
          Influencer
        </button>
      </div>
    );
  }


  // Original form
  return (
    <div className="form-containerA sign-up-containerA">
      {isLoading &&
        <div className="loader1-container">
          <Loader />
        </div>
      }
      <form onSubmit={handleSignUp} className="form1">
        <h2 style={heading}>Create Account </h2>

        <input
          type="text"
          placeholder="Name"
          className="input-common"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />

        <input
          type="email"
          placeholder="Email"
          className="input-common"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />

        <input
          type="password"
          placeholder="Password"
          className="input-common"
          name="password"
          value={formData.password}
          onChange={handleChange}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className="input-common"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
        />

        {/* Keep the role dropdown but preselected and disabled */}
        <select
          name="role"
          value={formData.role}
          className="input-common"
          disabled
        >
          <option value={formData.role}>{formData.role}</option>
        </select>

        <select
          name="country"
          value={formData.country}
          onChange={handleChange}
          className="input-common"
          required
        >
          <option value="" disabled>Select Country</option>
          <option value="Australia">Australia</option>
          <option value="New Zealand">New Zealand</option>
        </select>

        <button type="submit" className="cmn-btn">Sign Up</button>
      </form>
    </div>
  );
};

export default RegisterForm;
