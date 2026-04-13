import React from "react";
import "./Footer.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhoneVolume } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faInstagram, faYoutube, faTiktok, faLinkedin } from '@fortawesome/free-brands-svg-icons';


const Footer = () => {
  return (
    <footer>
      <div className="content">
        <div className="left box">
          <div className="upper">
            <img src="./images/logo_02.png" className="foot-logo" alt="footer-logo" />
            <div className="topic">About us</div>
            <p>
              Huntsman Optics, Australia & New Zealands Exclusive Sole Distributor of HIKMICRO Outdoor Products              </p>
          </div>

        </div>
        <div className="middle box">
          <div className="topic">Employee Resource</div>
          <div>
            <a href="https://www.xero.com/au/" target="_blank" rel="noreferrer" >Xero</a>
          </div>
          <div>
            <a href="https://www.youtube.com/watch?v=bifQBimylKw" target="_blank" rel="noreferrer">How to use Xero?</a>
          </div>
          <div>
            <a href="https://www.youtube.com/watch?v=R3LhrLndEjY" target="_blank" rel="noreferrer">How to apply Leave?</a>
          </div>
        </div>
        <div className="right box">
          <div className="lower">
            <div className="topic">Contact us</div>
            <div className="contact-info">
              <div className="phone">
                <a href="https://wa.me/+61450662270" target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faPhoneVolume} style={{ marginRight: "15px" }} /> +61450662270
                </a>
              </div>
              <div className="email">
                <a href="mailto:Haris@huntsmanoptics.com" target="_blank" rel="noreferrer">
                  <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: "15px" }} /> Haris@huntsmanoptics.com
                </a>
              </div>
            </div>
          </div>
          <div className="media-icons">
            <a target="_blank" href="https://www.facebook.com/huntsmanoptics/" rel="noreferrer">
              <FontAwesomeIcon icon={faFacebook} />
            </a>
            {/* fb link copied for avoid error warning */}
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
          Copyright © 2026 <a target="_blank" href="https://www.huntsmanoptics.com/" rel="noreferrer">HuntsmanOptics</a> All rights reserved
        </p>
      </div>
    </footer>
  );
};

export default Footer;