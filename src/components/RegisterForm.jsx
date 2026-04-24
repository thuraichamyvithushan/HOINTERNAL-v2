import React, { useState } from "react";
import { auth, firestore } from '../firebase';
import { toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock, faGlobe, faUserTag } from '@fortawesome/free-solid-svg-icons';
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
  const [roleSelected, setRoleSelected] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleClick = (role) => {
    setFormData({ ...formData, role });
    setRoleSelected(true);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { email, password, confirmPassword, name, role, country } = formData;

    if (!name) return toast.error("Please enter a name");
    if (!email) return toast.error("Please enter an email");
    if (!password) return toast.error("Please enter a strong password");
    if (!confirmPassword) return toast.error("Please confirm your password");
    if (!role) return toast.error("Please select a role");
    if (!country) return toast.error("Please select your country");
    if (password !== confirmPassword) return toast.error("Passwords do not match");

    try {
      setIsLoading(true);
      const { user } = await auth.createUserWithEmailAndPassword(email, password);
      await user.sendEmailVerification();
      await firestore.collection("users").doc(user.uid).set({
        name,
        email,
        role,
        country,
        emailVerified: false,
      });

      toast.success("Please check your email and verify your account.");
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
    } finally {
      setIsLoading(false);
    }
  };

  if (!roleSelected) {
    return (
      <div className="role-selection-container">
        <h3 style={{ marginBottom: '20px', fontWeight: '800', textAlign: 'left' }}>SELECT YOUR ROLE</h3>
        <div className="role-grid">
          {['staff', 'representative', 'dealer', 'influencer'].map((r) => (
            <button key={r} className="cmn-btn" onClick={() => handleRoleClick(r)}>
              {r}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="register-form-container">
      {isLoading && <div className="loader1-container"><Loader /></div>}
      <form onSubmit={handleSignUp} className="form1">
        <div className="input-group">
          <FontAwesomeIcon icon={faUser} className="input-icon" />
          <input type="text" placeholder="Full Name" className="input-common" name="name" value={formData.name} onChange={handleChange} />
        </div>

        <div className="input-group">
          <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
          <input type="email" placeholder="Email Address" className="input-common" name="email" value={formData.email} onChange={handleChange} />
        </div>

        <div className="input-group">
          <FontAwesomeIcon icon={faLock} className="input-icon" />
          <input type="password" placeholder="Password" className="input-common" name="password" value={formData.password} onChange={handleChange} />
        </div>

        <div className="input-group">
          <FontAwesomeIcon icon={faLock} className="input-icon" />
          <input type="password" placeholder="Confirm Password" className="input-common" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
        </div>

        <div className="input-group">
          <FontAwesomeIcon icon={faUserTag} className="input-icon" />
          <select name="role" value={formData.role} className="input-common" disabled>
            <option value={formData.role}>{formData.role.toUpperCase()}</option>
          </select>
        </div>

        <div className="input-group">
          <FontAwesomeIcon icon={faGlobe} className="input-icon" />
          <select name="country" value={formData.country} onChange={handleChange} className="input-common" required>
            <option value="" disabled>Select Country</option>
            <option value="Australia">Australia</option>
            <option value="New Zealand">New Zealand</option>
          </select>
        </div>

        <button type="submit" className="cmn-btn" disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Sign Up"}
        </button>
        <p className="anchor" style={{textAlign: 'center', width: '100%'}} onClick={() => setRoleSelected(false)}>Change Role</p>
      </form>
    </div>
  );
};

export default RegisterForm;
