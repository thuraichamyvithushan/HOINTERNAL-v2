import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import UploadFootage from './UploadFootage';
import ViewFootage from './ViewFootage';
import AdminPrivateVideos from './AdminPrivateVideos';
import InfluencerSummary from './InfluencerSummary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faSignOutAlt, faPlus } from '@fortawesome/free-solid-svg-icons';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import './InfluencerDashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();
  const isRepresentative = user?.role === 'representative';
  const dashboardTitle = isRepresentative ? 'AU Regional Footage Hub' : 'Influencer Hub';

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('/');
  };

  return (
    <div
      className="single-page-dashboard min-h-screen bg-gray-900 border-none"
      style={{
        backgroundImage: "linear-gradient(180deg, rgba(248, 248, 248, 0.16) 0%, rgba(242, 242, 242, 0.22) 100%), url('/images/background.png')",
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Top Navbar */}
      <header className="top-navbar">
        <div className="logo-section">
          <h2 className="sidebar-title">
            <FontAwesomeIcon icon={faChartLine} />
            {dashboardTitle}
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
            <span className="divider-text">Private Storage</span>
          </div>
          <div className="tile-header-simple flex justify-between items-center header-gap">
            <h2 className="section-heading">my uploads</h2>
          </div>
          <div className="view-grid-wrapper">
            <ViewFootage visibilityFilter="private" refreshTrigger={refreshTrigger} />
          </div>
        </div>

        {/* Admin Section: View Users Private Videos */}
        {user?.role === 'admin' && (
          <div className="full-width-section dashboard-section-gap">
            <div className="section-divider divider-gap">
              <span className="divider-text">Admin Control Panel</span>
            </div>
            <div className="tile-header-simple flex justify-between items-center header-gap">
              <h2 className="section-heading">Influencer Private Footage</h2>
            </div>
            <AdminPrivateVideos />
          </div>
        )}

        {/* Section 2: Global Footage Feed */}
        <div className="full-width-section dashboard-section-gap">
          <div className="section-divider divider-gap">
            <span className="divider-text">Collective Network Feed</span>
          </div>
          <div className="tile-header-simple flex justify-between items-center header-gap">
            <h2 className="section-heading">shared ambassador footage</h2>
          </div>
          <div className="view-grid-wrapper">
            <ViewFootage isGlobal={true} visibilityFilter="public" refreshTrigger={refreshTrigger} />
          </div>
        </div>

        {/* Section 3: Influencer Summary */}
        <div className="summary-section dashboard-section-gap">
          <div className="section-divider divider-gap">
            <span className="divider-text">Influencer Network Activity</span>
          </div>
          <InfluencerSummary />
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content upload-modal-content" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setShowUploadModal(false)}
              aria-label="Close upload popup"
              title="Close"
            >
              &times;
            </button>
            <div className="modal-inner-scroll custom-scrollbar">
              <UploadFootage onComplete={() => { setShowUploadModal(false); handleRefresh(); }} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .single-page-dashboard {
          color: #111111;
        }
        .dashboard-main-view {
          padding: 2.5rem 1.5rem 4rem;
          max-width: 1480px;
          margin: 0 auto;
        }
        .add-footage-btn {
          background: #b90000;
          color: #ffffff;
          border: 1px solid #b90000;
          padding: 0.8rem 1.3rem;
          border-radius: 999px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-right: 1.5rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: all 0.25s ease;
          box-shadow: 0 12px 24px rgba(185, 0, 0, 0.16);
        }
        .add-footage-btn:hover {
          background: #910000;
          border-color: #910000;
          transform: translateY(-2px);
        }
        .header-user-info {
           margin-right: 1rem;
        }
        .section-heading {
          font-size: 1.45rem;
          font-weight: 800;
          color: #111111;
          border-left: 4px solid #dc2626;
          padding-left: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .view-grid-wrapper {
          background: #ffffff;
          border-radius: 20px;
          padding: 2rem;
          border: 1px solid #ececec;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.05);
        }
        .upload-modal-content {
          max-width: 980px !important;
          width: min(980px, calc(100vw - 32px));
          height: auto !important;
          max-height: 90vh;
        }
        .modal-inner-scroll {
          overflow-y: auto;
          max-height: calc(90vh - 40px);
          padding: 14px;
        }
        .section-divider {
          display: flex;
          align-items: center;
          margin-bottom: 2rem;
        }
        .divider-text {
          font-size: 0.82rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #111111;
          letter-spacing: 0.1em;
          background: transparent;
          padding-right: 1rem;
        }
        .section-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #d8d8d8;
        }
        .dashboard-section-gap {
          margin-bottom: 3rem;
        }
        .header-gap {
          margin-bottom: 1.5rem;
        }
        .divider-gap {
          margin-bottom: 1.25rem;
        }
        .top-logout-btn {
          background: #f4f4f4;
          color: #555555;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 1rem;
        }
        .top-logout-btn:hover {
          background: #b90000;
          color: white;
        }
        @media (max-width: 768px) {
          .upload-modal-content {
            width: calc(100vw - 18px);
            max-height: 92vh;
            border-radius: 22px !important;
          }
          .modal-inner-scroll {
            max-height: calc(92vh - 32px);
            padding: 0.85rem;
          }
          .add-footage-btn span {
            display: none;
          }
          .add-footage-btn {
            padding: 0.6rem;
            margin-right: 0.5rem;
          }
          .dashboard-main-view {
            padding: 1rem 0.85rem 3rem;
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

export default Dashboard;
