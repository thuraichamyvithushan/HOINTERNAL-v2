import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faVideo, faAward } from '@fortawesome/free-solid-svg-icons';
import './InfluencerDashboardNZ.css';

const InfluencerSummaryNZ = () => {
    const [influencers, setInfluencers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    const fetchSummary = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch network summary filtered by NZ region
            const response = await fetch(`${API_URL}/api/network-summary?region=NZ`);
            if (!response.ok) throw new Error('Failed to fetch summary from backend');
            const summaryData = await response.json();

            // Filter only NZ regions (assuming they are tagged differently in DB or we filter here)
            // For now, I'll show all but the user might want a separate NZ collection
            setInfluencers(summaryData);
        } catch (error) {
            console.error('Error fetching influencer summary via backend:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
        const intervalId = setInterval(fetchSummary, 60000);
        return () => clearInterval(intervalId);
    }, []);

    if (loading && influencers.length === 0) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">Calculating NZ network stats...</p>
            </div>
        );
    }

    const currentState = influencers[activeTab];

    return (
        <div className="summary-container animate-fade-in">
            <div className="summary-header">
                <div className="icon-box shadow-box">
                    <FontAwesomeIcon icon={faAward} size="2x" />
                </div>
                <div>
                    <h2 className="title-bold">NZ Influencer Network Ranking</h2>
                    <p className="subtitle-gray">Switch tabs to view top performers by Region</p>
                </div>
            </div>

            {!error && influencers.length > 0 && (
                <>
                    {/* Modern Tab Bar */}
                    <div className="state-tabs-bar">
                        {influencers.map((state, index) => (
                            <button
                                key={state.stateName}
                                className={`state-tab-item ${activeTab === index ? 'active' : ''}`}
                                onClick={() => setActiveTab(index)}
                            >
                                <span className="tab-rank">#{index + 1}</span>
                                <span className="tab-name">{state.stateName}</span>
                            </button>
                        ))}
                    </div>

                    {/* Focused State Detailed View */}
                    <div className="active-state-detail-view animate-slide-up">
                        <div className="detail-view-header">
                            <div className="state-branding">
                                <div className="state-large-initial">
                                    {currentState.stateName?.substring(0, 2).toUpperCase() || '??'}
                                </div>
                                <div>
                                    <h3 className="detail-state-title">{currentState.stateName}</h3>
                                    <p className="detail-state-subtitle">Regional Performance (NZ)</p>
                                </div>
                            </div>
                            <div className="detail-stats-pills">
                                <div className="detail-pill">
                                    <FontAwesomeIcon icon={faVideo} className="text-red" />
                                    <span><strong>{currentState.videoCount}</strong> Videos</span>
                                </div>
                                <div className="detail-pill">
                                    <FontAwesomeIcon icon={faUsers} className="text-blue" />
                                    <span><strong>{currentState.influencerCount}</strong> Active</span>
                                </div>
                            </div>
                        </div>

                        <div className="influencer-leaderboard-section">
                            <h4 className="leaderboard-title">Top Contributing NZ Influencers</h4>
                            <div className="leaderboard-grid">
                                {currentState.activeUsers && currentState.activeUsers.length > 0 ? (
                                    currentState.activeUsers.map((user, uIdx) => (
                                        <div key={uIdx} className="leaderboard-user-card">
                                            <div className="user-rank-box">{uIdx + 1}</div>
                                            <div className="user-avatar-medium">
                                                {user.photo ? (
                                                    <img src={user.photo} alt={user.name} />
                                                ) : (
                                                    <span>{user.name.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="user-text-info">
                                                <span className="user-full-name">{user.name}</span>
                                                <span className="user-post-badge">{user.posts} Posts Contributed</span>
                                            </div>
                                            <div className="user-activity-dot active"></div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-users-text">No user details available for this region.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {error && (
                <div className="error-network-state">
                    <div className="error-icon-box">!</div>
                    <p className="error-text">Network connection to server failed.</p>
                    <button onClick={fetchSummary} className="retry-btn">Retry Connection</button>
                </div>
            )}

            {!error && influencers.length === 0 && (
                <div className="empty-network-state">
                    <div className="empty-icon-circle">
                        <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <h3 className="empty-title">Waiting for NZ Network Data</h3>
                    <p className="empty-subtitle">Once NZ influencers start tagging their locations, the network ranking will appear here.</p>
                </div>
            )}
        </div>
    );
};

export default InfluencerSummaryNZ;
