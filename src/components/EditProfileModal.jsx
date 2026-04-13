import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth, updateProfile } from 'firebase/auth';
import { firestore } from '../firebase';
import ResetPasswordModal from "./ResetPasswordModal";
import { auth } from '../firebase';

const EditProfileModal = ({ show, onClose, onUpdate, userData }) => {
  const [name, setName] = useState(userData?.name || '');
  const [email, setEmail] = useState(userData?.email || '');
  const [profilePicture, setProfilePicture] = useState(userData?.profilePicture || '');
  const [newProfilePicture, setNewProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleForgotPassword = () => setShowForgotPassword(true);
  const closeForgotPasswordModal = () => setShowForgotPassword(false);

  const handleForgotPasswordSubmit = async () => {
    try {
      await auth.sendPasswordResetEmail(email);
      toast.success('Password reset email sent successfully!');
      setShowForgotPassword(false);
    } catch (error) {
      toast.error('Failed to send password reset email.');
    }
  };

  const handleEmailChange = (e) => setEmail(e.target.value);

  useEffect(() => {
    const fetchUserData = async () => {
      const authInstance = getAuth();
      const user = authInstance.currentUser;
      if (user) {
        setLoading(true);
        try {
          const userDoc = await firestore.collection('users').doc(user.uid).get();
          if (userDoc.exists) {
            const data = userDoc.data();
            setName(data.name);
            setEmail(data.email);
            setProfilePicture(data.profilePicture || '/images/dp.jpg');
          }
        } catch {
          toast.error('Failed to fetch user data.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUserData();
  }, [show]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setNewProfilePicture(e.target.files[0]);
      setProfilePicture(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleDeleteProfilePicture = async () => {
    const authInstance = getAuth();
    const user = authInstance.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      if (user.photoURL && user.photoURL !== '/images/dp.jpg') {
        const storage = getStorage();
        const storageRef = ref(storage, `profilePictures/${user.uid}/${user.photoURL.split('/').pop()}`);
        await deleteObject(storageRef).catch(err => { if (err.code !== 'storage/object-not-found') throw err; });

        const defaultPic = '/images/dp.jpg';
        setProfilePicture(defaultPic);

        await updateProfile(user, { photoURL: defaultPic });
        await firestore.collection('users').doc(user.uid).update({ profilePicture: defaultPic });
        toast.success('Profile picture deleted successfully!');
      } else {
        toast.info('No profile picture to delete.');
      }
    } catch {
      toast.error('Failed to delete profile picture.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let profilePicURL = profilePicture;
      const authInstance = getAuth();
      const user = authInstance.currentUser;
      if (!user) throw new Error('User not authenticated');

      if (newProfilePicture) {
        const storage = getStorage();
        const storageRef = ref(storage, `profilePictures/${user.uid}/${newProfilePicture.name}`);
        await uploadBytes(storageRef, newProfilePicture);
        profilePicURL = await getDownloadURL(storageRef);
      }

      await updateProfile(user, { displayName: name, photoURL: profilePicURL });
      await firestore.collection('users').doc(user.uid).update({ name, profilePicture: profilePicURL });
      onUpdate({ name, email, profilePicture: profilePicURL });
      toast.success('Profile updated successfully!');
      onClose();
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  // Inline responsive styles
  const overlayStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  };

  const contentStyle = {
    width: window.innerWidth <= 480 ? '90%' : '100%',
    maxWidth: '450px',
    padding: window.innerWidth <= 480 ? '20px 15px' : '30px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    position: 'relative',
    textAlign: 'center',
    border: '1px solid rgba(139, 0, 0, 0.3)',
  };

  const profilePictureStyle = {
    width: window.innerWidth <= 480 ? '80px' :
      window.innerWidth <= 768 ? '100px' : '120px',
    height: window.innerWidth <= 480 ? '80px' :
      window.innerWidth <= 768 ? '100px' : '120px',
    objectFit: 'cover',
    borderRadius: '50%',
    marginBottom: '10px',
  };

  const buttonStyle = {
    width: '120px',
    padding: '10px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    margin: '5px',
    color: '#fff',
  };

  return show ? (
    <div style={overlayStyle}>
      <div style={contentStyle}>
        <form onSubmit={handleSubmit}>
          {/* Close Icon */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <FontAwesomeIcon
              icon={faTimes}
              style={{
                cursor: 'pointer',
                color: '#dc143c',
                fontSize: '1.5rem',
                padding: '8px',
                borderRadius: '50%',
                background: 'rgba(220,20,60,0.1)',
              }}
              onClick={onClose}
            />
          </div>

          {/* Profile Picture */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
            <img
              src={profilePicture || '/images/dp.jpg'}
              alt="Profile"
              style={profilePictureStyle}
            />
            <div style={{ position: 'absolute', top: '0', right: '-10px', display: 'flex', gap: '8px' }}>
              <FontAwesomeIcon icon={faEdit} style={{ cursor: 'pointer', color: '#fff' }} onClick={() => document.getElementById('file-input').click()} />
              <FontAwesomeIcon icon={faTrash} style={{ cursor: 'pointer', color: '#fff' }} onClick={handleDeleteProfilePicture} />
            </div>
            <input type="file" id="file-input" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          </div>

          {/* Name Input */}
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#fff' }}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '12px',
                border: '2px solid transparent',
                background: '#2d2d2d',
                color: '#fff',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Email Input */}
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#fff' }}>Email</label>
            <input
              type="email"
              value={email}
              disabled
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '12px',
                border: '2px solid transparent',
                background: '#2d2d2d',
                color: '#fff',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Change Password */}
          <div style={{ marginBottom: '15px' }}>
            <button
              type="button"
              onClick={handleForgotPassword}
              style={{ ...buttonStyle, background: '#333', width: '100%' }}
            >
              Change Password
            </button>
          </div>

          {/* Save / Cancel Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="submit" style={{ ...buttonStyle, background: '#b22222' }} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={onClose} style={{ ...buttonStyle, background: '#555' }} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>

        <ResetPasswordModal
          isOpen={showForgotPassword}
          onClose={closeForgotPasswordModal}
          onSubmit={handleForgotPasswordSubmit}
          email={email}
          handleEmailChange={handleEmailChange}
        />
      </div>
    </div>
  ) : null;
};

export default EditProfileModal;
