import React from "react";
import Navbar2 from "./navdrive";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import "./drive.css";

const Drive = () => {
  return (
    <>
      <Navbar2 />

      {/* Main Container */}
      <div className="drive-container" style={{ marginBottom: "80px", marginTop: "80px", width: "80%" }}>

        <div className="drive-grid">
          {/* Card 1 */}
          <div className="drive-col">
            <div className="drive-card">
              <div className="drive-card-body">
                <Link to="/img1">
                  <img height="80px" width="80px" alt="websitemap" src="./images/socialM.png" />
                </Link>
                <h4 className="drive-card-title">Thermal Footage Influencers <br /> Map</h4>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="drive-col">
            <div className="drive-card">
              <div className="drive-card-body">
                <Link to="/img2">
                  <img height="80px" width="80px" src="./images/onsite.png" alt="LinkedIn" />
                </Link>
                <h4 className="drive-card-title">HO Internal <br /> Map</h4>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="drive-col">
            <div className="drive-card">
              <div className="drive-card-body">
                <Link to="/img3">
                  <img height="80px" width="80px" src="./images/off.png" alt="BigCommerce" />
                </Link>
                <h4 className="drive-card-title">HO Internal Drive For Customers Map</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Drive;
