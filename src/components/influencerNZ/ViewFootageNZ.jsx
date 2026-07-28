import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlay, faClock, faMicrochip, faVideoSlash, faLocationDot, faPaw, faTrash, faEdit, faXmark, faCheck, faUser, faImage, faImages, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { API_URL } from '../../config';
import { detectFootageKind } from '../../utils/uploadFootage';
import './InfluencerDashboardNZ.css';

const ViewFootageNZ = ({ isGlobal = false, visibilityFilter = null, refreshTrigger = 0, overrideUserId = null }) => {
    const { user } = useContext(AuthContext);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleCount, setVisibleCount] = useState(8);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
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
            const response = await fetch(`${API_URL}/api/footage/${id}`, { method: 'DELETE' });
            if (response.ok) {
                setVideos(prev => prev.filter(v => v.id !== id));
            } else {
                alert('Failed to delete footage.');
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleFolderDelete = async (folder) => {
        const folderItems = folder?.items || [];

        if (folderItems.length === 0) {
            return;
        }

        try {
            const deleteResults = await Promise.all(
                folderItems.map((item) =>
                    fetch(`${API_URL}/api/footage/${item.id}`, { method: 'DELETE' })
                )
            );

            if (deleteResults.every((response) => response.ok)) {
                const folderIds = new Set(folderItems.map((item) => item.id));
                setVideos((prev) => prev.filter((item) => !folderIds.has(item.id)));
                setSelectedVideo((current) => (
                    current?.isFolder && current.id === folder.id ? null : current
                ));
            } else {
                alert('Failed to delete one or more images from this folder.');
            }
        } catch (err) {
            console.error('Folder delete error:', err);
        }
    };

    const handleUpdate = async (item) => {
        const targetItems = item?.isFolder ? (item.items || []) : [item];
        const targetIds = new Set(targetItems.map((target) => target.id));

        if (targetItems.length === 0) {
            return;
        }

        try {
            const responses = await Promise.all(
                targetItems.map((target) =>
                    fetch(`${API_URL}/api/footage/${target.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(editForm)
                    })
                )
            );

            if (responses.every((response) => response.ok)) {
                setVideos((prev) => prev.map((video) => (
                    targetIds.has(video.id) ? { ...video, ...editForm } : video
                )));
                setSelectedVideo((current) => {
                    if (!current) {
                        return current;
                    }

                    if (item?.isFolder && current?.isFolder && current.id === item.id) {
                        return {
                            ...current,
                            coverImage: current.coverImage ? { ...current.coverImage, ...editForm } : current.coverImage,
                            items: current.items.map((folderItem) => ({ ...folderItem, ...editForm }))
                        };
                    }

                    if (!item?.isFolder && current?.id === item.id) {
                        return { ...current, ...editForm };
                    }

                    if (current?.isFolder) {
                        return {
                            ...current,
                            coverImage: targetIds.has(current.coverImage?.id)
                                ? { ...current.coverImage, ...editForm }
                                : current.coverImage,
                            items: current.items.map((folderItem) => (
                                targetIds.has(folderItem.id) ? { ...folderItem, ...editForm } : folderItem
                            ))
                        };
                    }

                    return current;
                });
                setEditingVideo(null);
            } else {
                alert('Failed to update footage.');
            }
        } catch (err) {
            console.error('Update error:', err);
        }
    };

    const formatActivityType = (activityType) => {
        if (!activityType) return 'Clip';
        return activityType.charAt(0).toUpperCase() + activityType.slice(1).toLowerCase();
    };

    const getMediaKind = (video) => detectFootageKind(video);
    const getMediaUrl = (video) => video?.mediaUrl || video?.videoUrl || '';
    const getMediaLabel = (item) => {
        if (item?.isFolder) {
            return 'Images';
        }

        return getMediaKind(item) === 'image' ? 'Image' : 'Video';
    };
    const isMultiImageFolderCandidate = (video) =>
        getMediaKind(video) === 'image' &&
        !!video?.uploadBatchId &&
        Number(video?.uploadBatchImageCount || 0) > 1;

    const matchesSearch = (video) =>
        (video.deviceName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.species || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.location || '').toLowerCase().includes(searchTerm.toLowerCase());

    const buildDisplayItems = (items) => {
        const groupedBatchIds = new Set();
        const displayItems = [];

        items.forEach((item) => {
            if (!isMultiImageFolderCandidate(item)) {
                if (matchesSearch(item)) {
                    displayItems.push(item);
                }
                return;
            }

            if (groupedBatchIds.has(item.uploadBatchId)) {
                return;
            }

            groupedBatchIds.add(item.uploadBatchId);

            const folderItems = items
                .filter((candidate) =>
                    candidate.uploadBatchId === item.uploadBatchId &&
                    getMediaKind(candidate) === 'image'
                )
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

            if (folderItems.length <= 1) {
                if (matchesSearch(item)) {
                    displayItems.push(item);
                }
                return;
            }

            if (!folderItems.some(matchesSearch)) {
                return;
            }

            displayItems.push({
                id: `folder-${item.uploadBatchId}`,
                isFolder: true,
                folderName: item.deviceName || 'Image Folder',
                coverImage: folderItems[0],
                items: folderItems
            });
        });

        return displayItems;
    };

    const buildEditFormValues = (item) => ({
        deviceName: item?.deviceName || '',
        species: item?.species || '',
        activityType: item?.activityType || 'hunting',
        location: item?.location || '',
        description: item?.description || '',
        ausState: item?.ausState || ''
    });

    const getFolderItemAtIndex = (folder, index = 0) =>
        folder?.items?.[index] || folder?.coverImage || folder?.items?.[0] || null;

    const canManageFolder = (folder) =>
        Array.isArray(folder?.items) &&
        folder.items.length > 0 &&
        folder.items.every((item) => item.userId === user?.uid);

    const openEditModal = (item, folderIndex = 0) => {
        const editSource = item?.isFolder ? getFolderItemAtIndex(item, folderIndex) : item;

        if (!editSource) {
            return;
        }

        setEditingVideo(item);
        setEditForm(buildEditFormValues(editSource));
    };

    const openViewer = (item) => {
        setSelectedVideo(item);
        setCurrentGalleryIndex(0);
    };

    useEffect(() => {
        if (!user) return;
        fetchFootage();
        setVisibleCount(8);
        const intervalId = setInterval(fetchFootage, 15000);
        return () => clearInterval(intervalId);
    }, [user, refreshTrigger, isGlobal, visibilityFilter]);

    const filteredVideos = buildDisplayItems(videos);

    useEffect(() => {
        setVisibleCount(8);
    }, [searchTerm]);

    const visibleVideos = filteredVideos.slice(0, visibleCount);
    const hasMoreVideos = filteredVideos.length > visibleCount;

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">Loading NZ footage...</p>
            </div>
        );
    }

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
                    {visibleVideos.map((video) => {
                        const cardItem = video.isFolder ? video.coverImage : video;
                        const cardMediaKind = video.isFolder ? 'folder' : getMediaKind(cardItem);

                        return (
                        <div key={video.id} onClick={() => openViewer(video)} className="video-card">
                            <div className="video-thumbnail">
                                {cardMediaKind === 'folder' || cardMediaKind === 'image' ? (
                                    <img
                                        className="thumbnail-img"
                                        src={getMediaUrl(cardItem)}
                                        alt={cardItem.deviceName || cardItem.originalFileName || 'Uploaded image'}
                                        loading="lazy"
                                    />
                                ) : (
                                    <video
                                        className="thumbnail-img"
                                        src={getMediaUrl(cardItem)}
                                        muted
                                        playsInline
                                    />
                                )}
                                <div className="play-overlay">
                                    <FontAwesomeIcon icon={cardMediaKind === 'folder' ? faImages : (cardMediaKind === 'image' ? faImage : faPlay)} />
                                </div>
                                <div className="hd-badge">
                                    {video.isFolder ? `${video.items.length} Images` : formatActivityType(cardItem.activityType)}
                                </div>
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 'clamp(8px, 2.4vw, 12px)',
                                        right: 'clamp(8px, 2.4vw, 12px)',
                                        zIndex: 4,
                                        padding: 'clamp(0.2rem, 1vw, 0.35rem) clamp(0.45rem, 1.8vw, 0.7rem)',
                                        borderRadius: '999px',
                                        background: 'rgba(17, 17, 17, 0.82)',
                                        color: '#ffffff',
                                        fontSize: 'clamp(0.58rem, 1.8vw, 0.72rem)',
                                        fontWeight: 800,
                                        letterSpacing: 'clamp(0.03em, 0.12vw, 0.05em)',
                                        textTransform: 'uppercase',
                                        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.16)'
                                    }}
                                >
                                    {getMediaLabel(video.isFolder ? video : cardItem)}
                                </div>
                            </div>
                            <div className="video-info">
                                <h3 className="video-title">{video.isFolder ? (video.folderName || 'Image Folder') : cardItem.deviceName}</h3>
                                <div className="meta-stack">
                                    <div className="meta-item-small influencer-meta">
                                        <FontAwesomeIcon icon={faUser} />
                                        <span>{cardItem.userName || 'Influencer'}</span>
                                    </div>
                                    <div className="meta-item-small location-meta">
                                        <FontAwesomeIcon icon={faLocationDot} />
                                        <span>{cardItem.ausState || (cardItem.location || 'New Zealand')}</span>
                                    </div>
                                </div>
                                <div className="video-meta">
                                    <div className="meta-item">
                                        <FontAwesomeIcon icon={faClock} />
                                        <span>{video.isFolder ? 'Image Folder' : formatActivityType(cardItem.activityType)}</span>
                                    </div>
                                    <div className="meta-item">
                                        <FontAwesomeIcon icon={faClock} />
                                        <span>{new Date(cardItem.createdAt || Date.now()).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                {video.isFolder && canManageFolder(video) && (
                                    <div className="card-actions-row">
                                        <button
                                            className="action-icon-btn edit-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditModal(video, 0);
                                            }}
                                            title="Edit Folder"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button
                                            className="action-icon-btn delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(`Delete this image folder and all ${video.items.length} images inside it? This action cannot be undone.`)) {
                                                    handleFolderDelete(video);
                                                }
                                            }}
                                            title="Delete Folder"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                )}
                                {!video.isFolder && (cardItem.userId === user?.uid) && (
                                    <div className="card-actions-row">
                                        <button
                                            className="action-icon-btn edit-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditModal(cardItem);
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
                                                    handleDelete(cardItem.id);
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
                    )})}
                </div>
            )}

            {hasMoreVideos && (
                <div className="load-more-wrap">
                    <button
                        className="load-more-btn"
                        onClick={() => setVisibleCount((prev) => prev + 8)}
                    >
                        Show More Footage
                    </button>
                </div>
            )}

            {editingVideo && createPortal(
                <div className="modal-overlay" onClick={() => setEditingVideo(null)} style={{ zIndex: 999999 }}>
                    <div className="modal-content modern-edit-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header accent-header">
                            <div
                                className="header-icon-circle"
                                style={{
                                    width: 'clamp(2rem, 6vw, 2.75rem)',
                                    height: 'clamp(2rem, 6vw, 2.75rem)',
                                    minWidth: 'clamp(2rem, 6vw, 2.75rem)',
                                    fontSize: 'clamp(0.78rem, 2.4vw, 1rem)'
                                }}
                            >
                                <FontAwesomeIcon icon={faEdit} />
                            </div>
                            <div className="header-text">
                                <h3
                                    className="modal-title-modern"
                                    style={{
                                        fontSize: 'clamp(1rem, 3.8vw, 1.45rem)',
                                        lineHeight: 1.2,
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    {editingVideo?.isFolder ? 'Edit NZ Folder Metadata' : 'Edit NZ Footage'}
                                </h3>
                                <p
                                    className="modal-subtitle-modern"
                                    style={{
                                        fontSize: 'clamp(0.78rem, 2.9vw, 0.98rem)',
                                        lineHeight: 1.45,
                                        marginTop: '0.3rem'
                                    }}
                                >
                                    {editingVideo?.isFolder
                                        ? 'Update these details across every image in this folder'
                                        : 'Update your footage details for better indexing'}
                                </p>
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
                            <button className="modern-btn-primary" onClick={() => handleUpdate(editingVideo)}>
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
                            {selectedVideo.isFolder && selectedVideo.items.length > 1 && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentGalleryIndex((prev) => (prev === 0 ? selectedVideo.items.length - 1 : prev - 1));
                                    }}
                                    style={{
                                        position: 'absolute',
                                        left: '16px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        zIndex: 5,
                                        width: '44px',
                                        height: '44px',
                                        border: 'none',
                                        borderRadius: '999px',
                                        background: 'rgba(17, 17, 17, 0.72)',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}
                                    aria-label="Previous image"
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </button>
                            )}
                            {selectedVideo.isFolder ? (
                                <img
                                    src={getMediaUrl(selectedVideo.items[currentGalleryIndex] || selectedVideo.coverImage)}
                                    alt={(selectedVideo.items[currentGalleryIndex] || selectedVideo.coverImage)?.deviceName || 'Uploaded image'}
                                    className="modal-video-player"
                                />
                            ) : getMediaKind(selectedVideo) === 'image' ? (
                                <img
                                    src={getMediaUrl(selectedVideo)}
                                    alt={selectedVideo.deviceName || selectedVideo.originalFileName || 'Uploaded image'}
                                    className="modal-video-player"
                                />
                            ) : (
                                <video src={getMediaUrl(selectedVideo)} controls autoPlay className="modal-video-player" />
                            )}
                            {selectedVideo.isFolder && selectedVideo.items.length > 1 && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentGalleryIndex((prev) => (prev === selectedVideo.items.length - 1 ? 0 : prev + 1));
                                    }}
                                    style={{
                                        position: 'absolute',
                                        right: '16px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        zIndex: 5,
                                        width: '44px',
                                        height: '44px',
                                        border: 'none',
                                        borderRadius: '999px',
                                        background: 'rgba(17, 17, 17, 0.72)',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}
                                    aria-label="Next image"
                                >
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                            )}
                        </div>
                        <div className="modal-details">
                            <div className="modal-details-title-row">
                                <h2 className="modal-title">
                                    {selectedVideo.isFolder
                                        ? (selectedVideo.items[currentGalleryIndex] || selectedVideo.coverImage)?.deviceName || 'Image Folder'
                                        : (selectedVideo.deviceName || 'No Title')}
                                </h2>
                            </div>

                            {selectedVideo.isFolder && selectedVideo.items.length > 1 && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151' }}>
                                        Image {currentGalleryIndex + 1} of {selectedVideo.items.length}
                                    </span>
                                </div>
                            )}

                            {selectedVideo.isFolder && canManageFolder(selectedVideo) && (
                                <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        className="modern-btn-primary"
                                        onClick={() => openEditModal(selectedVideo, currentGalleryIndex)}
                                    >
                                        <FontAwesomeIcon icon={faEdit} /> Edit Folder
                                    </button>
                                    <button
                                        type="button"
                                        className="modern-btn-secondary"
                                        onClick={() => {
                                            if (window.confirm(`Delete this image folder and all ${selectedVideo.items.length} images inside it? This action cannot be undone.`)) {
                                                handleFolderDelete(selectedVideo);
                                            }
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faTrash} /> Delete Folder
                                    </button>
                                </div>
                            )}

                            <div className="modal-meta-grid">
                                <div className="modal-meta-item">
                                    <FontAwesomeIcon icon={faUser} className="modal-meta-icon" />
                                    <div className="modal-meta-content">
                                        <span className="modal-meta-label">Influencer</span>
                                        <span className="modal-meta-value">
                                            {selectedVideo.isFolder
                                                ? (selectedVideo.items[currentGalleryIndex] || selectedVideo.coverImage)?.userName || 'Huntsman Influencer'
                                                : (selectedVideo.userName || 'Huntsman Influencer')}
                                        </span>
                                    </div>
                                </div>
                                <div className="modal-meta-item">
                                    <FontAwesomeIcon icon={faLocationDot} className="modal-meta-icon" />
                                    <div className="modal-meta-content">
                                        <span className="modal-meta-label">Region</span>
                                        <span className="modal-meta-value">
                                            {selectedVideo.isFolder
                                                ? (selectedVideo.items[currentGalleryIndex] || selectedVideo.coverImage)?.ausState || ((selectedVideo.items[currentGalleryIndex] || selectedVideo.coverImage)?.location || 'New Zealand')
                                                : (selectedVideo.ausState || (selectedVideo.location || 'New Zealand'))}
                                        </span>
                                    </div>
                                </div>
                                <div className="modal-meta-item">
                                    <FontAwesomeIcon icon={faPaw} className="modal-meta-icon" />
                                    <div className="modal-meta-content">
                                        <span className="modal-meta-label">Species</span>
                                        <span className="modal-meta-value">
                                            {selectedVideo.isFolder
                                                ? (selectedVideo.items[currentGalleryIndex] || selectedVideo.coverImage)?.species || 'Various'
                                                : (selectedVideo.species || 'Various')}
                                        </span>
                                    </div>
                                </div>
                                <div className="modal-meta-item">
                                    <FontAwesomeIcon icon={faClock} className="modal-meta-icon" />
                                    <div className="modal-meta-content">
                                        <span className="modal-meta-label">Activity</span>
                                        <span className="modal-meta-value">
                                            {selectedVideo.isFolder
                                                ? `${selectedVideo.items.length} image folder`
                                                : formatActivityType(selectedVideo.activityType)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-description-section">
                                <h4 className="modal-section-title">Notes & Context</h4>
                                <p className="modal-description">
                                    {selectedVideo.isFolder
                                        ? (selectedVideo.items[currentGalleryIndex] || selectedVideo.coverImage)?.description || 'No additional details provided for this image.'
                                        : (selectedVideo.description || 'No additional details provided for this clip.')}
                                </p>
                            </div>

                            <div className="modal-footer-meta">
                                Uploaded on {new Date(
                                    selectedVideo.isFolder
                                        ? (selectedVideo.items[currentGalleryIndex] || selectedVideo.coverImage)?.createdAt || Date.now()
                                        : (selectedVideo.createdAt || Date.now())
                                ).toLocaleString()}
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
