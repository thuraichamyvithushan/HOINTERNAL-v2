import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { firestore } from '../../firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faVideo, faArrowUpRightFromSquare, faAward } from '@fortawesome/free-solid-svg-icons';
import './InfluencerDashboard.css';

const InfluencerSummary = () => {
    const [influencers, setInfluencers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    const fetchSummary = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/api/network-summary?region=AU`);
            if (!response.ok) throw new Error('Failed to fetch summary from backend');
            const summaryData = await response.json();
            setInfluencers(summaryData);
            if (summaryData.length > 0 && activeTab === 0) {
                // Keep active tab if it's within range, otherwise reset
                // Usually we just keep it or reset based on data availability
            }
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
                <p className="loading-text">Calculating network stats...</p>
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
                    <h2 className="title-bold">Influencer Network Ranking</h2>
                    <p className="subtitle-gray">Switch tabs to view top performers by State</p>
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
                                    <p className="detail-state-subtitle">Regional Performance</p>
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
                            <h4 className="leaderboard-title">Top Contributing Influencers</h4>
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
                                    <p className="no-users-text">No user details available for this state.</p>
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
                    <h3 className="empty-title">Waiting for Network Data</h3>
                    <p className="empty-subtitle">Once influencers start tagging their state locations, the network ranking will appear here automatically.</p>
                </div>
            )}
        </div>
    );
};

export default InfluencerSummary;
