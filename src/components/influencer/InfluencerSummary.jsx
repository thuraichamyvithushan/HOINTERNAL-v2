import React, { useCallback, useEffect, useState } from 'react';
import { API_URL } from '../../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faVideo, faAward } from '@fortawesome/free-solid-svg-icons';
import SummaryLeafletMap from './SummaryLeafletMap';
import './InfluencerDashboard.css';

const AU_STATE_MAP = [
    { key: 'WA', shortLabel: 'WA', center: [-25.5, 121.0] },
    { key: 'NT', shortLabel: 'NT', center: [-19.0, 133.5] },
    { key: 'SA', shortLabel: 'SA', center: [-30.0, 135.5] },
    { key: 'QLD', shortLabel: 'QLD', center: [-21.0, 145.0] },
    { key: 'NSW', shortLabel: 'NSW', center: [-32.0, 147.0] },
    { key: 'ACT', shortLabel: 'ACT', center: [-35.45, 149.1] },
    { key: 'VIC', shortLabel: 'VIC', center: [-36.8, 145.0] },
    { key: 'TAS', shortLabel: 'TAS', center: [-42.0, 146.8] }
];

const InfluencerSummary = () => {
    const [influencers, setInfluencers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/api/network-summary?region=AU`);
            if (!response.ok) throw new Error('Failed to fetch summary from backend');
            const summaryData = await response.json();
            setInfluencers(summaryData);
        } catch (error) {
            console.error('Error fetching influencer summary via backend:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSummary();
        const intervalId = setInterval(fetchSummary, 60000);
        return () => clearInterval(intervalId);
    }, [fetchSummary]);

    if (loading && influencers.length === 0) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">Calculating network stats...</p>
            </div>
        );
    }

    const currentState = influencers[activeTab];
    const sortedStates = [...influencers].sort((a, b) => b.videoCount - a.videoCount);
    const mapStates = AU_STATE_MAP.map((layout) => {
        const matched = influencers.find((state) => state.stateName === layout.key);
        return {
            ...layout,
            data: matched || {
                stateName: layout.key,
                videoCount: 0,
                influencerCount: 0,
                activeUsers: []
            }
        };
    });

    const handleStateSelect = (stateName) => {
        const foundIndex = influencers.findIndex((state) => state.stateName === stateName);
        if (foundIndex >= 0) {
            setActiveTab(foundIndex);
        }
    };

    return (
        <div className="summary-container animate-fade-in">
            <div className="summary-header">
                <div className="icon-box shadow-box">
                    <FontAwesomeIcon icon={faAward} size="2x" />
                </div>
                <div className="summary-copy">
                    <h2 className="title-bold">Influencer Network Ranking</h2>
                    <p className="subtitle-gray">Switch tabs to view top performers by State</p>
                </div>
            </div>

            {!error && influencers.length > 0 && (
                <>
                    <div className="map-summary-layout animate-slide-up">
                        <div className="map-summary-card">
                            <div className="map-card-header">
                                <div>
                                    <h3 className="map-card-title">State Activity Map</h3>
                                    <p className="map-card-subtitle">Select a state to view video and influencer totals.</p>
                                </div>
                                <div className="map-selection-badge">
                                    Active State: <strong>{currentState.stateName}</strong>
                                </div>
                            </div>

                            <div className="network-map-board network-map-board-au">
                                <div className="network-map-surface">
                                    <SummaryLeafletMap
                                        locations={mapStates}
                                        activeName={currentState.stateName}
                                        onSelect={handleStateSelect}
                                        bounds={[[-44.8, 112.0], [-9.0, 154.5]]}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="map-popup-panel">
                            <div className="map-popup-card">
                                <div className="map-popup-top">
                                    <div className="state-branding">
                                        <div className="state-large-initial">
                                            {currentState.stateName?.substring(0, 2).toUpperCase() || '??'}
                                        </div>
                                        <div>
                                            <h3 className="detail-state-title">{currentState.stateName}</h3>
                                            <p className="detail-state-subtitle">Regional Performance</p>
                                        </div>
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

                                <div className="influencer-leaderboard-section">
                                    <h4 className="leaderboard-title">Top Contributing Influencers</h4>
                                    <div className="leaderboard-grid compact">
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

                            <div className="map-ranking-strip">
                                <h4 className="leaderboard-title">State Ranking</h4>
                                <div className="map-ranking-list">
                                    {sortedStates.map((state, index) => (
                                        <button
                                            key={state.stateName}
                                            className={`map-ranking-item ${currentState.stateName === state.stateName ? 'active' : ''}`}
                                            type="button"
                                            onClick={() => handleStateSelect(state.stateName)}
                                        >
                                            <span className="map-ranking-order">#{index + 1}</span>
                                            <span className="map-ranking-name">{state.stateName}</span>
                                            <span className="map-ranking-total">{state.videoCount}</span>
                                        </button>
                                    ))}
                                </div>
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
