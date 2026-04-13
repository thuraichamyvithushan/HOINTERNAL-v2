import React from "react";
import { Link } from "react-router-dom";
import "./AdminCard.css";

const AdminCard = () => {
  const auCards = [
    { title: "STAFF AU", link: "/home", color: "#701818ff" },
    { title: "DEALER AU", link: "/dealer-page", color: "#960505ff" },
    { title: "REP AU", link: "/representative-page", color: "#870303ff" },
    { title: "INFLUENCER AU", link: "/influencer-page", color: "#600202ff" },
  ];

  const nzCards = [
    { title: "STAFF NZ", link: "/home-nz", color: "#701818ff" },
    { title: "DEALER NZ", link: "/dealer-page-nz", color: "#960505ff" },
    { title: "REP NZ", link: "/representative-page-nz", color: "#870303ff" },
    { title: "INFLUENCER NZ", link: "/influencer-page-nz", color: "#600202ff" },
  ];

  return (
    <div className="admin-cards-wrapper">
      <div className="dashboard-region-section">
        <h3 className="region-heading">Australia Dashboards</h3>
        <div className="cards-container">
          {auCards.map((card, index) => (
            <Link to={card.link} key={`au-${index}`} className="card-link">
              <div className="dashboard-card" style={{ backgroundColor: card.color }}>
                <h3>{card.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="dashboard-region-section">
        <h3 className="region-heading">New Zealand Dashboards</h3>
        <div className="cards-container">
          {nzCards.map((card, index) => (
            <Link to={card.link} key={`nz-${index}`} className="card-link">
              <div className="dashboard-card" style={{ backgroundColor: card.color }}>
                <h3>{card.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminCard;
