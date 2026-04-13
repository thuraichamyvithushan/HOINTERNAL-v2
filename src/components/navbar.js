import React, { useState, useEffect, useContext } from "react";
import { getAuth } from "firebase/auth";
import { firestore } from "../firebase";
import "./navbar.css";
import { Link } from "react-router-dom";
import UserDetailsModal from "./UserDetailsModal";
import { AuthContext } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnet,
  faBoltLightning,
  faStream,
  faNewspaper,
  faBriefcase,
  faBinoculars,
  faPersonBiking,
  faCrosshairs,
  faPersonHiking,
  faHouse,
  faChevronDown,
  faChevronUp,
  faUserCircle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const searchBarStyle = {
    position: "absolute",
    top: "50%",
    right: "7%",
    transform: "translateY(-50%)",
    display: "flex",
    alignItems: "center",
  };

  const logoStyle = {
    height: "40px",
    marginLeft: "-1.5%",
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    const fetchUserProfilePicture = async () => {
      if (user) {
        try {
          const userDoc = await firestore.collection("users").doc(user.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            setProfilePicture(userData.profilePicture || null);
          }
        } catch (error) {
          console.error("Error fetching user profile picture:", error);
        }
      }
    };

    fetchUserProfilePicture();
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-left">
          {/* Single menu button for all devices */}
          <button
            className="menu-button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <i className="bi bi-list menu" style={{ color: "#fff" }}></i>
          </button>

          <div style={searchBarStyle}>
            {user && user.role === 'admin' && (
              <li className="header-admin-item" style={{ listStyle: 'none' }}>
                <Link to="/admin" className="admin-panel-btn">
                  Admin Panel
                </Link>
              </li>
            )}
            <li className="header-service-item" style={{ listStyle: 'none', marginLeft: '25px' }}>
              <Link to="/service-capability" className="service-panel-btn">
                Our Services
              </Link>
            </li>
            <li style={{ marginTop: "0px", marginLeft: "10%", listStyle: 'none' }}>
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="user-profile-image"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    marginBottom: "0",
                  }}
                  onClick={toggleModal}
                />
              ) : (
                <FontAwesomeIcon
                  icon={faUserCircle}
                  style={{ fontSize: "40px", color: "#ffff" }}
                  onClick={toggleModal}
                />
              )}
              {showModal && <UserDetailsModal />}
            </li>
          </div>

          {/* Overlay for mobile/tablet */}
          {isSidebarOpen && (
            <div className="sidebar-overlay" onClick={closeSidebar}></div>
          )}

          {/* Sidebar */}
          <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
            {/* Close button inside sidebar */}
            <button
              className="close-btn"
              onClick={closeSidebar}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: "24px",
                cursor: "pointer",
                position: "absolute",
                top: "15px",
                right: "15px",
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <Link to="/home" className="menu_links" onClick={closeSidebar}>
              <FontAwesomeIcon icon={faHouse} />
              <span style={{ marginLeft: "10px" }}>Home</span>
            </Link>
            <Link to="/news&update" className="menu_links" onClick={closeSidebar}>
              <FontAwesomeIcon icon={faNewspaper} />
              <span style={{ marginLeft: "10px" }}>News & updates</span>
            </Link>
            <Link to="/social" className="menu_links" onClick={closeSidebar}>
              <FontAwesomeIcon icon={faCrosshairs} />
              <span style={{ marginLeft: "10px" }}>Social Huntsman optics</span>
            </Link>
            <Link to="/service-capability" className="menu_links sidebar-service-link" onClick={closeSidebar}>
              <FontAwesomeIcon icon={faBriefcase} />
              <span style={{ marginLeft: "10px" }}>Our Services</span>
            </Link>
            {user && user.role === 'admin' && (
              <Link to="/admin" className="menu_links sidebar-admin-link" onClick={closeSidebar}>
                <FontAwesomeIcon icon={faUserCircle} />
                <span style={{ marginLeft: "10px" }}>Admin Panel</span>
              </Link>
            )}
            <hr style={{ margin: 0, padding: "5px", height: "10px", color: "#c21b29" }}></hr>
            <Link
              className="menu_links"
              onClick={toggleDropdown}
              style={{ display: "flex", alignItems: "center" }}
            >
              <FontAwesomeIcon icon={faStream} />
              <span style={{ marginLeft: "10px" }}>Business Sub-brand</span>
              <FontAwesomeIcon
                icon={isDropdownOpen ? faChevronUp : faChevronDown}
                style={{ marginLeft: "25px", verticalAlign: "middle" }}
              />
            </Link>
            {isDropdownOpen && (
              <div className="dropdown-content">
                <Link to="/HuntsmanThermo" className="menu_links" onClick={closeSidebar}>
                  <FontAwesomeIcon icon={faBinoculars} />
                  <span style={{ marginLeft: "10px" }}>Huntsman Thermography</span>
                </Link>
                <Link to="/CoastOutdoor" className="menu_links" onClick={closeSidebar}>
                  <FontAwesomeIcon icon={faPersonBiking} />
                  <span style={{ marginLeft: "10px" }}>Coast Outdoor</span>
                </Link>
                <Link to="/DemoDeals" className="menu_links" onClick={closeSidebar}>
                  <FontAwesomeIcon icon={faPersonHiking} />
                  <span style={{ marginLeft: "10px" }}>Outdoor demo deals</span>
                </Link>
                <Link to="/SperosFlashlight" className="menu_links" onClick={closeSidebar}>
                  <FontAwesomeIcon icon={faBoltLightning} />
                  <span style={{ marginLeft: "10px" }}>SperasFlashlights</span>
                </Link>
                <Link to="/MagneTech" className="menu_links" onClick={closeSidebar}>
                  <FontAwesomeIcon icon={faMagnet} />
                  <span style={{ marginLeft: "10px" }}>Magne Tech</span>
                </Link>
              </div>
            )}
          </div>

          <Link to="/home">
            <img src="./images/logo_02.png" style={logoStyle} alt="logo" />
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
