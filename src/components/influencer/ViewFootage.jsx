import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '../../context/AuthContext';
import { firestore } from '../../firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlay, faClock, faMicrochip, faVideoSlash, faLocationDot, faPaw, faTrash, faEdit, faXmark, faCheck, faUser } from '@fortawesome/free-solid-svg-icons';
import { API_URL } from '../../config';
import './InfluencerDashboard.css';

const ViewFootage = ({ isGlobal = false, visibilityFilter = null, refreshTrigger = 0 }) => {
    const { user } = useContext(AuthContext);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [editingVideo, setEditingVideo] = useState(null);
    const [editForm, setEditForm] = useState({
        deviceName: '',
        species: '',
        activityType: '',
        location: '',
        description: '',
        ausState: ''
    });

    const fetchFootage = async () => {
        if (!user && !isGlobal) return;
        try {
            let url = isGlobal
                ? `${API_URL}/api/footage/all?region=AU`
                : `${API_URL}/api/footage/${user.uid}`;

            if (visibilityFilter) {
                const separator = url.includes('?') ? '&' : '?';
                url += `${separator}visibility=${visibilityFilter}`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch from backend');
            const videoData = await response.json();
            setVideos(videoData);
        } catch (error) {
            console.error('Error fetching videos via backend:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/footage/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setVideos(prev => prev.filter(v => v.id !== id));
            } else {
                alert('Failed to delete footage.');
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleUpdate = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/footage/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            if (response.ok) {
                console.log('Update successful, merging state for ID:', id);
                // Preserve critical fields like videoUrl, visibility, and region while merging metadata
                setVideos(prev => prev.map(v => v.id === id ? { ...v, ...editForm } : v));
                setEditingVideo(null);
            } else {
                alert('Failed to update footage.');
            }
        } catch (err) {
            console.error('Update error:', err);
        }
    };

    useEffect(() => {
        if (!user && !isGlobal) return;
        fetchFootage();
        setCurrentPage(1); // Reset to first page on filter/refresh change

        // Polling every 10 seconds to mimic real-time snapshot
        const intervalId = setInterval(fetchFootage, 10000);
        return () => clearInterval(intervalId);
    }, [user, refreshTrigger, isGlobal, visibilityFilter]);

    const filteredVideos = videos.filter((video) =>
        (video.deviceName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.species || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.location || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
    const paginatedVideos = filteredVideos.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">Scanning your archive...</p>
            </div>
        );
    }

    return (
        <div className="view-container animate-fade-in">
            {/* Search Header */}
            <div className="search-header">
                <div className="search-box">
                    <FontAwesomeIcon
                        icon={faSearch}
                        className="search-icon"
                    />
                    <input
                        type="text"
                        placeholder="Search by device, species, or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="stats-badge">
                    Total: <span className="stats-count">{filteredVideos.length}</span> Clips
                </div>
            </div>

            {filteredVideos.length === 0 ? (
                <div className="empty-state">
                    <FontAwesomeIcon icon={faVideoSlash} size="4x" className="empty-icon" />
                    <h3 className="empty-title">No footage found</h3>
                    <p className="empty-subtitle">Upload your first clip using the "Add Footage" button at the top.</p>
                </div>
            ) : (
                <div className="video-grid">
                    {paginatedVideos.map((video) => (
                        <div
                            key={video.id}
                            onClick={() => setSelectedVideo(video)}
                            className="video-card"
                        >
                            <div className="video-thumbnail">
                                <video
                                    className="thumbnail-img"
                                    src={video.videoUrl}
                                />
                                <div className="play-overlay">
                                    <div className="play-button-icon">
                                        <FontAwesomeIcon icon={faPlay} className="icon-ml-1" />
                                    </div>
                                </div>
                                <div className="hd-badge">
                                    {video.activityType || 'Clip'}
                                </div>
                            </div>
                            <div className="video-info">
                                <h3 className="video-title">{video.deviceName || 'Unknown Device'}</h3>

                                <div className="meta-stack">
                                    <div className="meta-item-small influencer-meta">
                                        <FontAwesomeIcon icon={faUser} />
                                        <span>{video.userName || 'Influencer'}</span>
                                    </div>
                                    <div className="meta-item-small location-meta">
                                        <FontAwesomeIcon icon={faLocationDot} />
                                        <span>{video.ausState || (video.location || 'Australia')}</span>
                                    </div>
                                </div>

                                <div className="video-meta">
                                    <div className="meta-item">
                                        <FontAwesomeIcon icon={faClock} />
                                        <span style={{ textTransform: 'capitalize' }}>{video.activityType}</span>
                                    </div>
                                    <div className="meta-item">
                                        <FontAwesomeIcon icon={faClock} />
                                        <span>{new Date(video.createdAt || Date.now()).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                {(video.userId === user?.uid) && (
                                    <div className="card-actions-row">
                                        <button
                                            className="action-icon-btn edit-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingVideo(video);
                                                setEditForm({
                                                    deviceName: video.deviceName || '',
                                                    species: video.species || '',
                                                    activityType: video.activityType || 'hunting',
                                                    location: video.location || '',
                                                    description: video.description || '',
                                                    ausState: video.ausState || ''
                                                });
                                            }}
                                            title="Edit"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button
                                            className="action-icon-btn delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Are you sure you want to delete this footage? This action cannot be undone.')) {
                                                    handleDelete(video.id);
                                                }
                                            }}
                                            title="Delete"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="pagination-controls">
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <div className="page-indicator">
                        Page <span>{currentPage}</span> of {totalPages}
                    </div>
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Edit Modal */}
            {editingVideo && createPortal(
                <div className="modal-overlay" onClick={() => setEditingVideo(null)} style={{ zIndex: 999999 }}>
                    <div className="modal-content modern-edit-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header accent-header">
                            <div className="header-icon-circle">
                                <FontAwesomeIcon icon={faEdit} />
                            </div>
                            <div className="header-text">
                                <h3 className="modal-title-modern">Edit Metadata</h3>
                                <p className="modal-subtitle-modern">Update your footage details for better indexing</p>
                            </div>
                            <button className="close-btn-modern" onClick={() => setEditingVideo(null)}>
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>

                        <div className="modern-form-body">
                            <div className="form-section-modern">
                                <h4 className="section-title-modern">General Information</h4>
                                <div className="modern-form-grid">
                                    <div className="modern-form-group">
                                        <label><FontAwesomeIcon icon={faMicrochip} className="label-icon" /> Device Name</label>
                                        <input
                                            className="modern-input"
                                            value={editForm.deviceName}
                                            onChange={e => setEditForm({ ...editForm, deviceName: e.target.value })}
                                            placeholder="Enter device model"
                                        />
                                    </div>
                                    <div className="modern-form-group">
                                        <label><FontAwesomeIcon icon={faLocationDot} className="label-icon" /> State / Territory</label>
                                        <select
                                            className="modern-select"
                                            value={editForm.ausState}
                                            onChange={e => setEditForm({ ...editForm, ausState: e.target.value })}
                                        >
                                            <option value="">-- Choose State --</option>
                                            <option value="NSW">New South Wales (NSW)</option>
                                            <option value="VIC">Victoria (VIC)</option>
                                            <option value="QLD">Queensland (QLD)</option>
                                            <option value="WA">Western Australia (WA)</option>
                                            <option value="SA">South Australia (SA)</option>
                                            <option value="TAS">Tasmania (TAS)</option>
                                            <option value="ACT">ACT</option>
                                            <option value="NT">NT</option>
                                        </select>
                                    </div>
                                    <div className="modern-form-group">
                                        <label><FontAwesomeIcon icon={faPaw} className="label-icon" /> Species Observed</label>
                                        <input
                                            className="modern-input"
                                            value={editForm.species}
                                            onChange={e => setEditForm({ ...editForm, species: e.target.value })}
                                            placeholder="e.g. Fox, Deer, Feral Pig"
                                        />
                                    </div>
                                    <div className="modern-form-group">
                                        <label><FontAwesomeIcon icon={faClock} className="label-icon" /> Activity Type</label>
                                        <select
                                            className="modern-select"
                                            value={editForm.activityType}
                                            onChange={e => setEditForm({ ...editForm, activityType: e.target.value })}
                                        >
                                            <option value="hunting">Hunting Session</option>
                                            <option value="scouting">Trail Scouting</option>
                                            <option value="testing">Device Testing</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-section-modern">
                                <h4 className="section-title-modern">Detailed Context</h4>
                                <div className="modern-form-group full-width">
                                    <label><FontAwesomeIcon icon={faSearch} className="label-icon" /> Detailed Description</label>
                                    <textarea
                                        className="modern-textarea"
                                        value={editForm.description}
                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                        rows="3"
                                        placeholder="Add notes about range, conditions, or thermal performance..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modern-modal-footer">
                            <button className="modern-btn-secondary" onClick={() => setEditingVideo(null)}>Discard Changes</button>
                            <button className="modern-btn-primary" onClick={() => handleUpdate(editingVideo.id)}>
                                <FontAwesomeIcon icon={faCheck} /> Update Archive
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Video Modal - Rendered via Portal */}
            {selectedVideo && createPortal(
                <div
                    className="modal-overlay animate-fade-in"
                    onClick={() => setSelectedVideo(null)}
                    style={{ zIndex: 99999 }}
                >
                    <div
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-video-container">
                            <video
                                src={selectedVideo.videoUrl}
                                controls
                                autoPlay
                                className="modal-video-player"
                            />
                            <button
                                onClick={() => setSelectedVideo(null)}
                                className="modal-close-btn"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="modal-details">
                            <div className="modal-details-title-row">
                                <h2 className="modal-title">{selectedVideo.deviceName || 'No Title'}</h2>
                            </div>

                            <div className="modal-meta-grid">
                                <div className="modal-meta-item">
                                    <FontAwesomeIcon icon={faUser} className="modal-meta-icon" />
                                    <div className="modal-meta-content">
                                        <span className="modal-meta-label">Influencer</span>
                                        <span className="modal-meta-value">{selectedVideo.userName || 'Huntsman Influencer'}</span>
                                    </div>
                                </div>
                                <div className="modal-meta-item">
                                    <FontAwesomeIcon icon={faLocationDot} className="modal-meta-icon" />
                                    <div className="modal-meta-content">
                                        <span className="modal-meta-label">Region</span>
                                        <span className="modal-meta-value">{selectedVideo.ausState || (selectedVideo.location || 'Australia')}</span>
                                    </div>
                                </div>
                                <div className="modal-meta-item">
                                    <FontAwesomeIcon icon={faPaw} className="modal-meta-icon" />
                                    <div className="modal-meta-content">
                                        <span className="modal-meta-label">Species</span>
                                        <span className="modal-meta-value">{selectedVideo.species || 'Various'}</span>
                                    </div>
                                </div>
                                <div className="modal-meta-item">
                                    <FontAwesomeIcon icon={faClock} className="modal-meta-icon" />
                                    <div className="modal-meta-content">
                                        <span className="modal-meta-label">Activity</span>
                                        <span className="modal-meta-value" style={{ textTransform: 'capitalize' }}>{selectedVideo.activityType || 'Clip'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-description-section">
                                <h4 className="modal-section-title">Notes & Context</h4>
                                <p className="modal-description">{selectedVideo.description || 'No additional details provided for this clip.'}</p>
                            </div>

                            <div className="modal-footer-meta">
                                Uploaded on {new Date(selectedVideo.createdAt || Date.now()).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ViewFootage;
