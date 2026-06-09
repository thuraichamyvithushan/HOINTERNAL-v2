import React, { useState, useEffect } from "react";
import "./Footer.css";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhoneVolume } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faInstagram, faYoutube, faTiktok, faLinkedin } from '@fortawesome/free-brands-svg-icons';

const DealerFooter = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <footer>
      <div
        className="content"
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          gap: "2%",
          alignContent:"center",
     
        }}
      >
        {/* Left Box */}
        <div
          className="left box"
          style={{
            flex: "1 1 50%",
            maxWidth: isMobile ? "100%" : "49%",
            padding: "20px",
          }}
        >
          <div className="upper">
            <img
              src="./images/logo_02.png"
              className="foot-logo"
              alt="footer-logo"
              style={{ maxWidth: "180px", marginBottom: "15px" }}
            />
            <div className="topic" style={{ fontWeight: "bold", fontSize: "18px" }}>
              About us
            </div>
            <p>
              Huntsman Optics, Australia & New Zealands Exclusive Sole Distributor of HIKMICRO Outdoor Products
            </p>
          </div>
        </div>

        {/* Right Box */}
        <div
          className="right box"
          style={{
            flex: "1 1 50%",
            maxWidth: isMobile ? "100%" : "49%",
            padding: "20px",
          }}
        >
          <div className="lower">
            <div className="topic" style={{ fontWeight: "bold", fontSize: "18px" }}>
              Contact us
            </div>
            <div className="contact-info">
              <div className="phone" style={{ marginBottom: "10px" }}>
                <a
                  href="https://wa.me/+61450662270"
                  target="_blank"
                  rel="noopener noreferrer"
                
                >
                  <FontAwesomeIcon icon={faPhoneVolume} style={{ marginRight: "10px" }} />
                  +61450662270
                </a>
              </div>
              <div className="email">
                <a
                  href="mailto:Haris@huntsmanoptics.com"
                  target="_blank"
                  rel="noreferrer"
                
                >
                  <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: "10px" }} />
                  Haris@huntsmanoptics.com
                </a>
              </div>
            </div>
          </div>

          <div
            className="media-icons"
            style={{ display: "flex", gap: "15px", marginTop: "15px", fontSize: "18px" }}
          >
            <a target="_blank" href="https://www.facebook.com/huntsmanoptics/" rel="noreferrer">
              <FontAwesomeIcon icon={faFacebook} />
            </a>
            <a target="_blank" href="https://www.instagram.com/huntsmanoptics/" rel="noreferrer">
              <FontAwesomeIcon icon={faInstagram} />
            </a>
            <a target="_blank" href="https://www.tiktok.com/@huntsman.optics?_t=8m8XFKjbfT0&&_r=1" rel="noreferrer">
              <FontAwesomeIcon icon={faTiktok} />
            </a>
            <a target="_blank" href="https://www.youtube.com/@huntsmanoptics8102" rel="noreferrer">
              <FontAwesomeIcon icon={faYoutube} />
            </a>
            <a target="_blank" href="https://www.linkedin.com/company/huntsman-optics-ltd/" rel="noreferrer">
              <FontAwesomeIcon icon={faLinkedin} />
            </a>
          </div>
        </div>
      </div>

      <hr />

      <div className="bottom">
        <p style={{ textAlign: "center" }}>
          Copyright © 2025{" "}
          <a target="_blank" href="https://www.huntsmanoptics.com/" rel="noreferrer">
            HuntsmanOptics
          </a>{" "}
          All rights reserved
        </p>
      </div>
    </footer>
  );
};

export default DealerFooter;
