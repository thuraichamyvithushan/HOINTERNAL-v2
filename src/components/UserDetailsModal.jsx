import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserEdit, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { getAuth } from "firebase/auth";
import Loader from "./Loader";
import "./UserDetailsModal.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import EditProfileModal from './EditProfileModal';
import { firestore } from "../firebase";

import ReactDOM from 'react-dom';

const UserDetailsModal = () => {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [profilePicture, setProfilePicture] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const modalRef = useRef(null);

  const handleEditProfile = () => {
    setShowUserDetailsModal(false);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setShowUserDetailsModal(true);
  };

  const handleUpdateProfile = (updatedData) => {
    setUserData(updatedData);
    setProfilePicture(updatedData.profilePicture);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success("Logout successful! See You Again!");
      navigate("/");
    } catch (error) {
      toast.error("Failed to logout. Please try again.");
    }
  };

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        setLoading(true);
        try {
          const userDoc = await firestore.collection("users").doc(user.uid).get();
          if (userDoc.exists) {
            setUserData(userDoc.data());
            setProfilePicture(user.photoURL || "/images/dp.jpg");
          } else {
            toast.error("User data not found. Please ensure the document exists.");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast.error("Failed to fetch user data. Please try again or check permissions.");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Close modal on outside click
  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setShowUserDetailsModal(false);
    }
  };

  useEffect(() => {
    if (showUserDetailsModal) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserDetailsModal]);

  const modalContent = (
    <>
      {showUserDetailsModal && (
        <div className="user-details-modal-overlay">
          <div className="user-profile-container" ref={modalRef}>
            {loading ? (
              <div className="loader-container">
                <p style={{ color: 'white', marginTop: '100px' }}>Loading Data...</p>
                <Loader className="loader" />
              </div>
            ) : (
              <div className="modal-content-wrapper">
                <img
                  src={profilePicture || (user && user.photoURL) || "/images/dp.jpg"}
                  alt="Profile"
                  className="user-profile-image"
                  style={{ display: 'block', margin: '0 auto 15px' }}
                />

                <div className="user-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h4 className="user-name" style={{ color: '#ffffff', fontSize: '20px', fontWeight: '700', margin: '0 0 5px' }}>
                    {(userData && userData.name) || (user && user.displayName) || "Influencer Account"}
                  </h4>
                  <p className="user-email" style={{ color: '#cccccc', fontSize: '14px', margin: '0 0 15px' }}>
                    {(user && user.email) || "Email Not Available"}
                  </p>

                  <hr style={{ width: '100%', marginBottom: '20px' }} />

                  <div className="user-actions">
                    <button className="edit-profile bUtton" onClick={handleEditProfile}>
                      <FontAwesomeIcon icon={faUserEdit} style={{ paddingRight: "5px" }} />
                      Update Profile
                    </button>
                    <button className="logout bUtton" onClick={handleLogout}>
                      <FontAwesomeIcon icon={faSignOutAlt} style={{ paddingRight: "5px" }} />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <EditProfileModal
        show={showEditModal}
        onClose={handleCloseEditModal}
        onUpdate={handleUpdateProfile}
      />
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default UserDetailsModal;
