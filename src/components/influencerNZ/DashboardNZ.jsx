import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import UploadFootageNZ from './UploadFootageNZ';
import ViewFootageNZ from './ViewFootageNZ';
import AdminPrivateVideosNZ from './AdminPrivateVideosNZ';
import InfluencerSummaryNZ from './InfluencerSummaryNZ';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faPlus } from '@fortawesome/free-solid-svg-icons';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import './InfluencerDashboardNZ.css';

const DashboardNZ = () => {
  const { user } = useContext(AuthContext);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('/');
  };

  return (
    <div className="single-page-dashboard min-h-screen bg-gray-900 border-none">
      {/* Top Navbar */}
      <header className="top-navbar shadow-lg">
        <div className="logo-section">
          <h2 className="sidebar-title">
            <FontAwesomeIcon icon={faChartLine} />
            NZ Influencer Hub
          </h2>
        </div>

        <div className="user-profile">
          <button
            onClick={() => setShowUploadModal(true)}
            className="add-footage-btn"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add Footage</span>
          </button>
        </div>
      </header>

      {/* Main Grid Section */}
      <main className="dashboard-main-view">
        <div className="full-width-section dashboard-section-gap">
          <div className="section-divider divider-gap">
            <span className="divider-text">Private Storage (NZ)</span>
          </div>
          <div className="tile-header-simple flex justify-between items-center header-gap">
            <h2 className="section-heading">my clips</h2>
          </div>
          <div className="view-grid-wrapper">
            <ViewFootageNZ visibilityFilter="private" refreshTrigger={refreshTrigger} />
          </div>
        </div>

        {/* Admin Section: View Users Private Videos */}
        {user?.role === 'admin' && (
          <div className="full-width-section dashboard-section-gap">
            <div className="section-divider divider-gap">
              <span className="divider-text">Admin Control Panel (NZ)</span>
            </div>
            <div className="tile-header-simple flex justify-between items-center header-gap">
              <h2 className="section-heading">Influencer Private Footage</h2>
            </div>
            <AdminPrivateVideosNZ />
          </div>
        )}

        {/* Section 2: Global Footage Feed */}
        <div className="full-width-section dashboard-section-gap">
          <div className="section-divider divider-gap">
            <span className="divider-text">NZ Collective Network Feed</span>
          </div>
          <div className="tile-header-simple flex justify-between items-center header-gap">
            <h2 className="section-heading">shared ambassador footage</h2>
          </div>
          <div className="view-grid-wrapper">
            <ViewFootageNZ isGlobal={true} visibilityFilter="public" refreshTrigger={refreshTrigger} />
          </div>
        </div>

        {/* Section 3: Influencer Summary */}
        <div className="summary-section dashboard-section-gap">
          <div className="section-divider divider-gap">
            <span className="divider-text">NZ Influencer Network Activity</span>
          </div>
          <InfluencerSummaryNZ />
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content upload-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowUploadModal(false)}>&times;</button>
            <div className="modal-inner-scroll custom-scrollbar">
              <UploadFootageNZ onComplete={() => { setShowUploadModal(false); handleRefresh(); }} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .single-page-dashboard {
          background-color: #111827;
          color: white;
        }
        .dashboard-main-view {
          padding: 2rem;
          max-width: 1600px;
          margin: 0 auto;
        }
        .add-footage-btn {
          background: #dc2626;
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-right: 1.5rem;
          transition: all 0.2s;
          box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
        }
        .add-footage-btn:hover {
          background: #b91c1c;
          transform: translateY(-2px);
        }
        .section-heading {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff;
          border-left: 4px solid #dc2626;
          padding-left: 1rem;
        }
        .view-grid-wrapper {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 1.5rem;
          padding: 2rem;
          border: 1px solid #374151;
        }
        .upload-modal-content {
          max-width: 900px !important;
          height: auto !important;
          max-height: 90vh;
        }
        .modal-inner-scroll {
          overflow-y: auto;
          max-height: calc(90vh - 40px);
          padding: 10px;
        }
        .section-divider {
          display: flex;
          align-items: center;
          margin-bottom: 2rem;
        }
        .divider-text {
          font-size: 0.875rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #ffffff;
          letter-spacing: 0.1em;
          background: #111827;
          padding-right: 1rem;
        }
        .section-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #374151;
        }
        .dashboard-section-gap {
          margin-bottom: 6rem;
        }
        .header-gap {
          margin-bottom: 2.5rem;
        }
        .divider-gap {
          margin-bottom: 3rem;
        }
        @media (max-width: 768px) {
          .add-footage-btn span {
            display: none;
          }
          .add-footage-btn {
            padding: 0.6rem;
            margin-right: 0.5rem;
          }
          .dashboard-main-view {
            padding: 1rem;
          }
          .dashboard-section-gap {
            margin-bottom: 3rem;
          }
          .view-grid-wrapper {
            padding: 1.25rem;
          }
          .section-heading {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardNZ;
