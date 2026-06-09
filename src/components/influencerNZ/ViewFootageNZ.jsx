import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlay, faClock, faMicrochip, faVideoSlash, faLocationDot, faPaw, faTrash, faEdit, faXmark, faCheck, faUser } from '@fortawesome/free-solid-svg-icons';
import { API_URL } from '../../config';
import './InfluencerDashboardNZ.css';

const ViewFootageNZ = ({ isGlobal = false, visibilityFilter = null, refreshTrigger = 0, overrideUserId = null }) => {
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

    const nzRegions = [
        "Auckland", "Waikato", "Bay of Plenty", "Gisborne", "Hawke's Bay", "Taranaki",
        "Manawatu-Whanganui", "Wellington", "Northland", "Tasman", "Nelson",
        "Marlborough", "West Coast", "Canterbury", "Otago", "Southland"
    ];

    const fetchFootage = async () => {
        if (!user) return;
        try {
            let url = isGlobal
                ? `${API_URL}/api/footage/all?region=NZ`
                : `${API_URL}/api/footage/${overrideUserId || user.uid}`;

            if (visibilityFilter) {
                const separator = url.includes('?') ? '&' : '?';
                url += `${separator}visibility=${visibilityFilter}`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch');
            const videoData = await response.json();

            // Filter by NZ region if needed (assuming we use common collection)
            setVideos(videoData);
        } catch (error) {
            console.error('Error fetching NZ videos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await fetch(`${API_URL}/api/footage/${id}`, { method: 'DELETE' });
            setVideos(prev => prev.filter(v => v.id !== id));
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleUpdate = async (id) => {
        try {
            await fetch(`${API_URL}/api/footage/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            // Ensure we merge metadata updates while preserving videoUrl, visibility, and region
            setVideos(prev => prev.map(v => v.id === id ? { ...v, ...editForm } : v));
            setEditingVideo(null);
        } catch (err) {
            console.error('Update error:', err);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchFootage();
        const intervalId = setInterval(fetchFootage, 15000);
        return () => clearInterval(intervalId);
    }, [user, refreshTrigger, isGlobal, visibilityFilter]);

    const filteredVideos = videos.filter((video) =>
        (video.deviceName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.species || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
    const paginatedVideos = filteredVideos.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading) return <div>Loading NZ footage...</div>;

    return (
        <div className="view-container animate-fade-in">
            <div className="search-header">
                <div className="search-box">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search NZ footage..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
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
                        <div key={video.id} onClick={() => setSelectedVideo(video)} className="video-card">
                            <div className="video-thumbnail">
                                <video className="thumbnail-img" src={video.videoUrl} />
                                <div className="play-overlay"><FontAwesomeIcon icon={faPlay} /></div>
                            </div>
                            <div className="video-info">
                                <h3 className="video-title">{video.deviceName}</h3>
                                <div className="meta-stack">
                                    <div className="meta-item-small influencer-meta">
                                        <FontAwesomeIcon icon={faUser} />
                                        <span>{video.userName || 'Influencer'}</span>
                                    </div>
                                    <div className="meta-item-small location-meta">
                                        <FontAwesomeIcon icon={faLocationDot} />
                                        <span>{video.ausState || (video.location || 'New Zealand')}</span>
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
                                                if (window.confirm('Are you sure you want to delete this footage?')) {
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

            {/* Pagination Logic same as AU... */}

            {editingVideo && createPortal(
                <div className="modal-overlay" onClick={() => setEditingVideo(null)} style={{ zIndex: 999999 }}>
                    <div className="modal-content modern-edit-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header accent-header">
                            <div className="header-icon-circle">
                                <FontAwesomeIcon icon={faEdit} />
                            </div>
                            <div className="header-text">
                                <h3 className="modal-title-modern">Edit NZ Footage</h3>
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
                                        <label><FontAwesomeIcon icon={faLocationDot} className="label-icon" /> NZ Region</label>
                                        <select
                                            className="modern-select"
                                            value={editForm.ausState}
                                            onChange={e => setEditForm({ ...editForm, ausState: e.target.value })}
                                        >
                                            <option value="">-- Choose Region --</option>
                                            {nzRegions.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
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

            {selectedVideo && createPortal(
                <div className="modal-overlay" onClick={() => setSelectedVideo(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-video-container">
                            <video src={selectedVideo.videoUrl} controls autoPlay className="modal-video-player" />
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
                                        <span className="modal-meta-value">{selectedVideo.ausState || (selectedVideo.location || 'New Zealand')}</span>
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

export default ViewFootageNZ;
