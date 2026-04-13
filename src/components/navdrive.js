import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

import "./navdrive.css";

const Navbar2 = () => {
  const { user } = useContext(AuthContext);
  const menu2Links = [
    { text: "NZ Influencers Footages", href: "https://drive.google.com/drive/folders/1V3gjwNL47zpfL6U8wOIeydiEJGv-qnY_?usp=drive_link" },
    { text: "M15 Trail Camera", href: "https://drive.google.com/drive/folders/1-fScARk0L1Lv4u_wei1eAK6IUs6RpIyV?usp=drive_link" },
    { text: "M15 Trail Cam Videos", href: "https://drive.google.com/drive/folders/1-iNh60sjfvCK6EIFl15jaehAO68U0GPR?usp=drive_link" },
    { text: "How To Upload Video To Drive", href: "https://drive.google.com/drive/folders/1ieveJlpTcHL0F__1XrKj5ydrsjoV4Esr?usp=drive_link" },
    { text: "Habrok Pro", href: "https://drive.google.com/drive/folders/1iHlrQ3VuxCp84BU15haT1nF_aHW2lg5M?usp=drive_link" },
    { text: "Condor", href: "https://drive.google.com/drive/folders/13xYD8XuL8wO3sm6GuDZea8B9kQPmcNWf?usp=drive_link" },
    { text: "AU Influencers Footages", href: "https://drive.google.com/drive/folders/1CQXwYHU0mG66NbZ9aQICYTj1RDbEyY8Z?usp=drive_link" },
    { text: "Panther 2.0 Ballistic Calculator", href: "https://drive.google.com/drive/folders/1-2WsKlhUm_wBKmWfxtEkW6Rl1_Gu91XP?usp=drive_link" },
    { text: "Alpex 4k", href: "https://drive.google.com/drive/folders/1-8bSyLQMlFN-ARwvHdBTg2YyMG2S3f9S?usp=drive_link" },
    { text: "Christi Viljoen", href: "https://drive.google.com/drive/folders/1rdA6opyo7SNhffkeokzXTBv47ekuud3x?usp=drive_link" },
    { text: "Falcon FQ50", href: "https://drive.google.com/drive/folders/1Wl68DKFguLWksHRtHcQFfQKR0-tWS6U1?usp=drive_link" },
    { text: "Stella 3.0", href: "https://drive.google.com/drive/folders/1--2D_T2a-udopuCvU_HfrJ-08RVoe8xe" },
    { text: "Steve Riley", href: "https://drive.google.com/drive/folders/1H6gyf7RbS6fyjgc-J-NPJba3GL7Z3xfl?usp=drive_link" },
    { text: "Thunder 2.0 tq35", href: "https://drive.google.com/drive/folders/1LJP_d1MMVketvyiMmlkJkhD3Dss7cuPr?usp=drive_link" },
    { text: "Thunder Zoom", href: "https://drive.google.com/drive/folders/1VtInWL64ySgTlaOiG71zv0U1dCZLflyb?usp=drive_link" },
    { text: "Youtube Guides And Clips", href: "https://drive.google.com/drive/folders/1i2EVwM8WDwKvdzuaoMgNwHPxEOtXSJ7i?usp=drive_link" },
  ];

  const menu3Links = [
    { text: "HO Website Tools", href: "https://drive.google.com/drive/folders/1-ovlEUCAc4dTYYx5bJwmQoqoaM7jh44r" },
    { text: "HO-Users Guides", href: "https://drive.google.com/drive/folders/1il1jgGukwrhckWrXqWswdnAfN4UJoZII" },
    { text: "HO-Product Ranges-Inventory Control", href: "https://drive.google.com/drive/folders/1tNr7FjcDYMB5Xs19jHPBsMWDcf1XMWk2" },
    { text: "HO-HMRMA Repairs-Fault Claims", href: "https://drive.google.com/drive/folders/1AgQEFP2br5buKUy6G8aJhfWE7ImlKhhn" },
    {
      text: "HO-Marketting For Everything",
      nested: [
        { text: "Sub Brand Marketing Folder", href: "https://drive.google.com/drive/folders/1Zgc4ZmZbgWyzvr2ZesQS5g2FaXpcPeM-" },
        { text: "HO-Onsite Marketing", href: "https://drive.google.com/drive/folders/1b7zNvTKx7DG50S3SzTpEO8llIqTDfeEv" },
        { text: "HO-Online Marketing", href: "https://drive.google.com/drive/folders/1jSN_rQl_WScCN-UGEJck249AykvBsbaO" },
        { text: "HO-Office Marketing Inc Assets", href: "https://drive.google.com/drive/folders/1HlXHyZTzhUjCvOoP-_JOHkgV641Cz2RB" },
        { text: "HO-Influencers", href: "https://drive.google.com/drive/folders/1bt80D2SltzkAqIZOQCFn47WnEhrrZAM9" },
        { text: "2024 HO AU & NZ Marketing Claim Invoices", href: "https://hointernal.com/#" },
        { text: " HO Marketing Plan.xlsx", href: "https://docs.google.com/spreadsheets/d/1MGnct_h26UbZ8b0zUPqSLTsFpJ79LNt1/edit?usp=drive_link" },
        { text: "Haris Role Actions", href: "https://docs.google.com/spreadsheets/d/1ACHgxXFRfJxk7FmCJ_ThE9D6md7J3ip26V1_S1QPdf8/edit?usp=drive_link" },
        { text: "Graphic Request Form (Responses) ", href: "https://docs.google.com/spreadsheets/d/1X4Q4hztOAdn_OuqndinbHALRwOKvcP6CIrlpxz6TSwE/edit?usp=drive_link" },
        { text: "2024 HO AU NZ-HM Cotribution Charges For Entire 2024", href: "https://docs.google.com/spreadsheets/d/1ExqV45hitEBkE5ypYYEteX-lX-BQmZ9Y/edit?gid=997184239" },
        { text: "2024 HO AU NZ-HM Cotribution Charges ", href: "https://docs.google.com/spreadsheets/d/1Y68j56z9ICGb8X9YnjKg7_4eWDq1zuve/edit?gid=825278834" },
      ],
    },
  ];

  const menu4Links = [
    {
      text: "HO Customer Dealer",
      nested: [
        { text: "Online Assets ", href: "https://drive.google.com/drive/folders/1wDCQbY6ZbI1pnG5xk30YTMLeo7HfqSz7" },
        { text: "Offline Assets", href: "https://drive.google.com/drive/folders/1KEDAW5Jv3RXaNCtR4B9e6Ki7TUQaPLyM?usp=drive_link" },
      ],
    },
    { text: "Pricelist New Zealand", href: "https://docs.google.com/spreadsheets/d/1Bvf248HxoUFFN23DEA1VU2wGBla2IvOuKiramYlnbsU/edit?usp=drive_link" },
    { text: "Pricelist Australia", href: "https://docs.google.com/spreadsheets/d/1DMCdgtofDFZxcD10uJu-PG5_hwq58fADITBtqAbr2SE/edit?gid=184096475" },
    { text: "Social Media Sharing ", href: "https://drive.google.com/drive/folders/1_sguKQ36eUJgzOpWlH9EZsf1zD20cmAd?usp=drive_link" },
    { text: "Youtube Videos For Retailors", href: "https://drive.google.com/drive/folders/1TfWif24UFFUUN-xfA0Rv6nEmAeKfsZtC" },
  ];

  const menu2Ref = useRef(null);
  const menu4Ref = useRef(null);
  const nestedRef = useRef(null);
  const menu3NestedRef = useRef(null);
  const [menu2OpenLeft, setMenu2OpenLeft] = useState(false);
  const [menu4OpenLeft, setMenu4OpenLeft] = useState(false);
  const [nestedOpenLeft, setNestedOpenLeft] = useState(false);
  const [nestedOpen, setNestedOpen] = useState(false);
  const [menu3NestedOpen, setMenu3NestedOpen] = useState(false);
  const [menu3NestedOpenLeft, setMenu3NestedOpenLeft] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setNestedOpenLeft(true);
    setMenu3NestedOpenLeft(true);

    const checkPosition = () => {
      if (menu2Ref.current) {
        const rect2 = menu2Ref.current.getBoundingClientRect();
        setMenu2OpenLeft(window.innerWidth - rect2.right < 500);
      }
      if (menu4Ref.current) {
        const rect4 = menu4Ref.current.getBoundingClientRect();
        setMenu4OpenLeft(window.innerWidth - rect4.right < 300);
      }

      document.documentElement.style.setProperty('--menu4-parent-right', `0px`);
      document.documentElement.style.setProperty('--menu4-parent-left', `auto`);
      document.documentElement.style.setProperty('--parent-right', `0px`);
      document.documentElement.style.setProperty('--parent-left', `auto`);
    };

    window.addEventListener("resize", checkPosition);
    checkPosition();
    return () => window.removeEventListener("resize", checkPosition);
  }, []);

  // Mobile touch handling for dropdowns
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleMobileDropdowns = () => {
      if (window.innerWidth <= 768) {
        // Handle main dropdown toggles
        const dropdowns = document.querySelectorAll('.navbar2-dropdown');
        dropdowns.forEach(dropdown => {
          const button = dropdown.querySelector('.navbar2-dropbtn');
          const content = dropdown.querySelector('.navbar2-dropdown-content');

          if (button && content) {
            const handleClick = (e) => {
              e.preventDefault();
              e.stopPropagation();

              // Close other dropdowns
              dropdowns.forEach(otherDropdown => {
                if (otherDropdown !== dropdown) {
                  otherDropdown.classList.remove('active');
                }
              });

              // Toggle current dropdown
              dropdown.classList.toggle('active');
            };

            button.addEventListener('click', handleClick);

            // Cleanup function
            return () => {
              button.removeEventListener('click', handleClick);
            };
          }
        });

        // Handle nested dropdown toggles
        const nestedWrappers = document.querySelectorAll('.navbar2-nested-wrapper');
        nestedWrappers.forEach(wrapper => {
          const button = wrapper.querySelector('.navbar2-nested-btn');

          if (button) {
            const handleNestedClick = (e) => {
              e.preventDefault();
              e.stopPropagation();

              // Close other nested dropdowns
              nestedWrappers.forEach(otherWrapper => {
                if (otherWrapper !== wrapper) {
                  otherWrapper.classList.remove('active');
                }
              });

              // Toggle current nested dropdown
              wrapper.classList.toggle('active');
            };

            button.addEventListener('click', handleNestedClick);

            // Cleanup function
            return () => {
              button.removeEventListener('click', handleNestedClick);
            };
          }
        });

        // Close dropdowns when clicking outside
        const handleOutsideClick = (e) => {
          if (!e.target.closest('.navbar2-dropdown')) {
            dropdowns.forEach(dropdown => {
              dropdown.classList.remove('active');
            });
            nestedWrappers.forEach(wrapper => {
              wrapper.classList.remove('active');
            });
          }
        };

        document.addEventListener('click', handleOutsideClick);

        // Cleanup function
        return () => {
          document.removeEventListener('click', handleOutsideClick);
        };
      }
    };

    // Run on component mount and window resize
    const cleanup = handleMobileDropdowns();
    window.addEventListener('resize', handleMobileDropdowns);

    return () => {
      window.removeEventListener('resize', handleMobileDropdowns);
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <nav className="navbar2-drive">
      <div className="navbar2-drive-left">
        {/* Hamburger menu for mobile */}
        <button
          className="navbar2-hamburger"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <span className="navbar2-bar"></span>
          <span className="navbar2-bar"></span>
          <span className="navbar2-bar"></span>
        </button>
        <Link to="/home">
          <img src="./images/logo_02.png" alt="Logo" className="navbar2-drive-logo" />
        </Link>
      </div>

      {/* Sidebar for mobile */}
      <div className={`navbar2-sidebar ${isSidebarOpen ? "active" : ""}`}>
        <button className="navbar2-close" onClick={() => setIsSidebarOpen(false)}>&times;</button>
        <div className="navbar2-sidebar-content">
          {user && user.role === 'admin' && (
            <Link to="/admin" className="navbar2-admin-btn" onClick={() => setIsSidebarOpen(false)}>
              Admin Panel
            </Link>
          )}
          <Link to="/service-capability" className="navbar2-sidebar-link sidebar-service-link" onClick={() => setIsSidebarOpen(false)}>
            Our Services
          </Link>
          <Link to="/nav" className="navbar2-sidebar-link" onClick={() => setIsSidebarOpen(false)}>
            HO Internal Main Drive
          </Link>
          <Link to="/img1" className="navbar2-sidebar-link" onClick={() => setIsSidebarOpen(false)}>
            Thermal Footage Influencers
          </Link>
          <Link to="/img2" className="navbar2-sidebar-link" onClick={() => setIsSidebarOpen(false)}>
            HO Internal
          </Link>
          <Link to="/img3" className="navbar2-sidebar-link" onClick={() => setIsSidebarOpen(false)}>
            HO Internal Drive For Customers
          </Link>
        </div>
      </div>

      {isSidebarOpen && <div className="navbar2-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

      <div className="navbar2-drive-right header-links-desktop">
        {user && user.role === 'admin' && (
          <div className="navbar2-menu1">
            <Link to="/admin" className="admin-panel-btn" style={{ margin: '10px' }}>
              Admin Panel
            </Link>
          </div>
        )}
        <div className="navbar2-menu1">
          <NavLink
            to="/nav"
            className={({ isActive }) =>
              `navbar2-dropbtn my-link-button ${isActive ? "active-link" : ""}`
            }
          >
            HO Internal Main Drive
          </NavLink>
        </div>
        <div className="navbar2-menu1">
          <NavLink
            to="/service-capability"
            className={({ isActive }) =>
              `service-panel-btn ${isActive ? "active-link" : ""}`
            }
          >
            Our Services
          </NavLink>
        </div>

        <div ref={menu2Ref} className={`navbar2-dropdown ${menu2OpenLeft ? "navbar2-open-left" : ""}`}>
          <Link to="/img1" className="my-link-button">
            <button className="navbar2-dropbtn">Thermal Footage Influencers</button>
          </Link>
          <div className="navbar2-dropdown-content navbar2-grid-4x4">
            {menu2Links.map((link, idx) => (
              <a href={link.href} target="_blank" rel="noopener noreferrer" key={idx} className="navbar2-dropdown-link">
                {link.text}
              </a>
            ))}
          </div>
        </div>

        <div className="navbar2-dropdown">
          <Link to="/img2" className="my-link-button">
            <button className="navbar2-dropbtn">HO Internal</button>
          </Link>
          <div className="navbar2-dropdown-content">
            {menu3Links.map((link, idx) =>
              link.nested ? (
                <div
                  key={idx}
                  className="navbar2-nested-wrapper"
                  onMouseEnter={() => setMenu3NestedOpen(true)}
                  onMouseLeave={() => setMenu3NestedOpen(false)}
                >
                  <button className="navbar2-nested-btn">{link.text}</button>
                  <div
                    ref={menu3NestedRef}
                    className={`navbar2-nested-dropdown-grid navbar2-grid-4x3 ${menu3NestedOpen ? "navbar2-show" : ""} ${menu3NestedOpenLeft ? "navbar2-open-left" : ""}`}
                  >
                    {link.nested.map((sublink, subIdx) => (
                      <a href={sublink.href} target="_blank" rel="noopener noreferrer" key={subIdx} className="navbar2-nested-link">
                        {sublink.text}
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <a href={link.href} target="_blank" rel="noopener noreferrer" key={idx} className="navbar2-dropdown-item">
                  {link.text}
                </a>
              )
            )}
          </div>
        </div>

        <div ref={menu4Ref} className={`navbar2-dropdown ${menu4OpenLeft ? "navbar2-open-left" : ""}`}>
          <Link to="/img3" className="my-link-button">
            <button className="navbar2-dropbtn">HO Internal Drive For Customers</button>
          </Link>
          <div className="navbar2-dropdown-content">
            {menu4Links.map((link, idx) =>
              link.nested ? (
                <div
                  key={idx}
                  className="navbar2-nested-wrapper"
                  onMouseEnter={() => setNestedOpen(true)}
                  onMouseLeave={() => setNestedOpen(false)}
                >
                  <button className="navbar2-nested-btn">{link.text}</button>
                  <div
                    ref={nestedRef}
                    className={`navbar2-nested-dropdown-simple ${nestedOpen ? "navbar2-show" : ""} ${nestedOpenLeft ? "navbar2-open-left" : ""}`}
                  >
                    {link.nested.map((sublink, subIdx) => (
                      <a href={sublink.href} target="_blank" rel="noopener noreferrer" key={subIdx} className="navbar2-nested-link">
                        {sublink.text}
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <a href={link.href} target="_blank" rel="noopener noreferrer" key={idx} className="navbar2-dropdown-item">
                  {link.text}
                </a>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar2;