import React from "react";
import { Link } from "react-router-dom";
import Footer from "./Footer";


const Clearance = () => {
  return (
    <div>
      {/* Full-width banner image */}
      <div style={{ position: "relative", width: "100%", height: "250px", overflow: "hidden" }}>
        <img
          src="/images/av.avif"
          alt="Dealer Banner"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Content Section */}
      <div className="container" style={{ marginBottom: "80px", width: "80%" }}>
        <h3 style={{ marginTop: '20px', textAlign: "center",  color: "#672423" }}>Clearance Customer Database AU/NZ</h3>

        <div className='row' style={{ justifyContent: "center" }}>
          {/* Card 1 */}
          <div className="col-xl-4 col-md-4 col-sm-12 mt-3 anime">
            <div className="card text-center">
              <div className="card-body">
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  to="https://docs.google.com/forms/d/e/1FAIpQLScJP4J__NF2y1qSaIjedbBoeWqC3QIympk3F9KU5Mz9qsRldQ/viewform"
                >
                  <img height="80px" width="80px" alt="websitemap" src="./images/mail.png" />
                </Link>
                <h4 className="card-title mt-3">Mail list NZ</h4>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="col-xl-4 col-md-4 col-sm-12 mt-3 anime">
            <div className="card text-center">
              <div className="card-body">
                <Link
                  to="https://docs.google.com/forms/d/e/1FAIpQLSekBW7pxIBFsEjzQxPNxD5siPnLLBLNrdIAAKi2-lYEl5zmPA/viewform"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <img height="80px" width="80px" src="./images/mail2.png" alt="LinkedIn" />
                </Link>
                <h4 className="card-title mt-3">Add AU Customer</h4>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="col-xl-4 col-md-4 col-sm-12 mt-3 anime">
            <div className="card text-center">
              <div className="card-body">
                <Link
                  to="https://drive.google.com/drive/folders/1zB4vNYgbsOggofMv7GSS5s_s2IZF-uPX"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <img height="80px" width="80px" src="./images/CC-db.png" alt="BigCommerce" />
                </Link>
                <h4 className="card-title mt-3">Customer Database</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default  Clearance;
