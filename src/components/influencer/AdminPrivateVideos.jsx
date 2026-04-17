import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import ViewFootage from './ViewFootage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faChevronLeft, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { API_URL } from '../../config';
import './InfluencerDashboard.css';

const AdminPrivateVideos = () => {
    const { user } = useContext(AuthContext);
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedUserName, setSelectedUserName] = useState('');

    useEffect(() => {
        if (!user || user.role !== 'admin') return;

        const fetchUsers = async () => {
            try {
                const response = await fetch(`${API_URL}/api/users`);
                if (!response.ok) throw new Error('Failed to fetch users');
                const data = await response.json();

                // Filter users to only show influencers from Australia
                const influencers = data.filter(u => u.role === 'influencer' && u.country === 'Australia');
                setUsersList(influencers);
            } catch (error) {
                console.error("Error fetching users list:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [user]);

    if (!user || user.role !== 'admin') return null;

    if (loading) {
        return (
            <div className="loading-container" style={{ margin: '2rem 0' }}>
                <div className="spinner"></div>
                <p className="loading-text">Loading User Data...</p>
            </div>
        );
    }

    if (selectedUserId) {
        return (
            <div className="admin-user-videos-view">
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => setSelectedUserId(null)}
                        className="modern-btn-secondary"
                        style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#374151', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} />
                        Back to Users
                    </button>
                    <h3 className="section-heading" style={{ margin: 0, borderLeft: 'none', paddingLeft: 0, color: '#fca5a5' }}>
                        Viewing Private Videos for: <span style={{ color: 'white' }}>{selectedUserName}</span>
                    </h3>
                </div>

                <div className="view-grid-wrapper">
                    <ViewFootage visibilityFilter="private" refreshTrigger={0} overrideUserId={selectedUserId} />
                </div>
            </div>
        );
    }

    return (
        <div className="admin-users-list">
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>Select a user below to view their private uploaded footage.</p>
            <div className="admin-users-grid">
                {usersList.map((u) => (
                    <div
                        key={u.uid}
                        className="admin-user-card"
                        onClick={() => {
                            setSelectedUserId(u.uid);
                            setSelectedUserName(u.displayName || u.name || u.email || 'Unknown User');
                        }}
                    >
                        <FontAwesomeIcon icon={faUserCircle} size="2x" style={{ color: '#9ca3af' }} />
                        <h4 className="admin-user-card-name">
                            {u.displayName || u.name || u.email || 'Unknown User'}
                        </h4>
                        <span className="admin-user-card-role">
                            {u.role || 'User'}
                        </span>
                    </div>
                ))}
            </div>
            {usersList.length === 0 && (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                    No users found in the system.
                </div>
            )}
        </div>
    );
};

export default AdminPrivateVideos;
