import React from "react";
import { Link } from "react-router-dom";
import Footer from "./Footer";


const Dealerlocate = () => {
  return (
    <div>
      {/* Full-width banner image */}
      <div style={{ position: "relative", width: "100%", height: "250px", overflow: "hidden" }}>
        <img
          src="/images/deal.jpg"
          alt="Dealer Banner"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Content Section */}
      <div className="container" style={{ marginBottom: "80px", width: "80%" }}>
        <h3 style={{ marginTop: '20px', textAlign: "center",  color: "#672423" }}>Dealer Locator</h3>

        <div className='row' style={{ justifyContent: "center" }}>
          {/* Card 1 */}
          <div className="col-xl-4 col-md-4 col-sm-12 mt-3 anime">
            <div className="card text-center">
              <div className="card-body">
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  to="https://www.google.com/maps/d/u/0/viewer?ll=-5.600367069446326%2C0&z=-1&mid=1ql0I1MmqK6EObXZguJRCugv3vsGU7qM"
                >
                  <img height="80px" width="80px" alt="websitemap" src="./images/socialM.png" />
                </Link>
                <h4 className="card-title mt-3">Website Map</h4>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="col-xl-4 col-md-4 col-sm-12 mt-3 anime">
            <div className="card text-center">
              <div className="card-body">
                <Link
                  to="https://www.google.com/maps/d/viewer?ll=-34.84650814552343%2C144.24974211227115&z=7&mid=1OllGBdHpIpSFEO3IRSrfEGTeridK3D0"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <img height="80px" width="80px" src="./images/onsite.png" alt="LinkedIn" />
                </Link>
                <h4 className="card-title mt-3">Travis Map-HO TNVS</h4>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="col-xl-4 col-md-4 col-sm-12 mt-3 anime">
            <div className="card text-center">
              <div className="card-body">
                <Link
                  to="https://www.google.com/maps/d/viewer?mid=1YV6ht6KLWv9nTO599HzFCalF630ZZzCZ&ll=-9.401556572885168%2C162.46399975000003&z=3"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <img height="80px" width="80px" src="./images/off.png" alt="BigCommerce" />
                </Link>
                <h4 className="card-title mt-3">Database Map</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default  Dealerlocate;
