import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { firestore } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faFileUpload, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { detectFootageKind, getUploadErrorMessage, uploadFootageFiles } from '../../utils/uploadFootage';
import './InfluencerDashboardNZ.css';

const UploadFootageNZ = (props) => {
    const { user } = useContext(AuthContext);
    const isRepresentative = user?.role === 'representative';
    const [files, setFiles] = useState([]);
    const [deviceName, setDeviceName] = useState('');
    const [species, setSpecies] = useState('');
    const [activityType, setActivityType] = useState('hunting');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [ausState, setAusState] = useState(''); // Reusing variable for NZ region
    const [visibility, setVisibility] = useState('public');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadedCount, setUploadedCount] = useState(0);
    const [uploadMessage, setUploadMessage] = useState(null);
    const [deviceOptions, setDeviceOptions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);

    const getSelectedMediaSummary = () => {
        const imageCount = files.filter((file) => detectFootageKind(file) === 'image').length;
        const videoCount = files.length - imageCount;
        const parts = [];

        if (imageCount > 0) {
            parts.push(`${imageCount} image${imageCount === 1 ? '' : 's'}`);
        }

        if (videoCount > 0) {
            parts.push(`${videoCount} video${videoCount === 1 ? '' : 's'}`);
        }

        return parts.join(' and ') || '0 files';
    };

    const uploadMessageStyles = uploadMessage?.type === 'success'
        ? {
            border: '1px solid #14532d',
            backgroundColor: 'rgba(34, 197, 94, 0.12)',
            color: '#bbf7d0'
        }
        : {
            border: '1px solid #7f1d1d',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: '#fecaca'
        };

    const nzAnimalOptionsList = [
        "Red Deer/Stag", "Himalayan Tahr", "Alpine Chamois", "Fallow Deer",
        "Sika Deer", "Wapiti/Elk", "Sambar Deer", "Rusa Deer", "Whitetail Deer",
        "Wild Pigs (Boar)", "Wild Goats", "Rams", "Wallabies", "Hares",
        "Rabbits", "Possums"
    ];

    React.useEffect(() => {
        const fetchDevices = async () => {
            try {
                const docSnap = await getDoc(doc(firestore, 'settings', 'deviceOptions'));
                if (docSnap.exists()) {
                    setDeviceOptions(docSnap.data().devices || []);
                } else {
                    // Fallback defaults
                    setDeviceOptions([
                        "Huntsman Thermal Alpha",
                        "Huntsman Night Vision V1"
                    ]);
                }
            } catch (error) {
                console.error("Error fetching device options:", error);
            }
        };
        fetchDevices();
    }, []);

    const nzRegions = [
        "Auckland",
        "Waikato",
        "Bay of Plenty",
        "Gisborne",
        "Hawke's Bay",
        "Taranaki",
        "Manawatu-Whanganui",
        "Wellington",
        "Northland",
        "Tasman",
        "Nelson",
        "Marlborough",
        "West Coast",
        "Canterbury",
        "Otago",
        "Southland"
    ];

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setFiles(Array.from(e.target.files));
            setUploadMessage(null);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (files.length === 0 || !deviceName || !ausState) {
            toast.error('Please select at least one image or video, choose a device name, and select a region.');
            return;
        }

        if (!user?.uid) {
            toast.error('Please sign in again before uploading footage.');
            return;
        }

        setUploading(true);
        setProgress(0);
        setUploadedCount(0);
        setUploadMessage(null);

        try {
            await uploadFootageFiles({
                files,
                user,
                metadata: {
                    deviceName,
                    species,
                    activityType,
                    description,
                    location,
                    ausState,
                    visibility,
                    region: 'NZ'
                },
                onProgress: setProgress,
                onFileComplete: () => setUploadedCount((count) => count + 1)
            });
            setUploadMessage({
                type: 'success',
                text: `Successfully uploaded ${files.length} NZ media file(s).`
            });
            setFiles([]);
            setDeviceName('');
            setSpecies('');
            setActivityType('hunting');
            setDescription('');
            setLocation('');
            setAusState('');
            setVisibility('public');
            setProgress(0);
            setUploadedCount(0);
            if (props.onComplete) props.onComplete();
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadMessage({
                type: 'error',
                text: getUploadErrorMessage(error)
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="form-card animate-fade-in">
            <div className="form-header">
                <div className="icon-box">
                    <FontAwesomeIcon icon={faCloudUploadAlt} size="2x" />
                </div>
                <div>
                    <h2 className="title-bold">{isRepresentative ? 'NZ Regional Footage Upload' : 'NZ Influencer Footage Upload'}</h2>
                    <p className="subtitle-gray">
                        {isRepresentative ? 'Add footage for the New Zealand regional dashboard' : 'Add your NZ field testing or hunting footage'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleUpload} className="form-grid">
                <div className="input-column">
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label className="label">Device Name (Mandatory)</label>
                        <input
                            type="text"
                            value={deviceName}
                            onChange={(e) => {
                                setDeviceName(e.target.value);
                                setShowDeviceDropdown(true);
                            }}
                            onFocus={() => setShowDeviceDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDeviceDropdown(false), 200)}
                            className="input"
                            placeholder="Type to search devices..."
                            required
                            disabled={uploading}
                            autoComplete="off"
                        />
                        {showDeviceDropdown && deviceOptions.filter(d => d.toLowerCase().includes(deviceName.toLowerCase())).length > 0 && (
                            <ul style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                zIndex: 50,
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e2e2',
                                borderRadius: '1rem',
                                marginTop: '0.25rem',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                listStyle: 'none',
                                padding: 0,
                                margin: 0,
                                boxShadow: '0 18px 36px rgba(17, 17, 17, 0.12)'
                            }}>
                                {deviceOptions
                                    .filter(d => d.toLowerCase().includes(deviceName.toLowerCase()))
                                    .map((device, i) => (
                                        <li
                                            key={i}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                setDeviceName(device);
                                                setShowDeviceDropdown(false);
                                            }}
                                            style={{
                                                padding: '8px 12px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #eeeeee',
                                                color: '#1f1f1f',
                                                fontSize: '0.9rem'
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f6f6f6'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                        >
                                            {device}
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </div>

                    <div className="form-group" style={{ position: 'relative' }}>
                        <label className="label">Species / Animals</label>
                        <input
                            type="text"
                            value={species}
                            onChange={(e) => {
                                setSpecies(e.target.value);
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                            className="input"
                            placeholder="Type to search animals..."
                            disabled={uploading}
                            autoComplete="off"
                        />
                        {showDropdown && species.trim() && nzAnimalOptionsList.filter(a => a.toLowerCase().includes(species.toLowerCase())).length > 0 && (
                            <ul style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                zIndex: 50,
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e2e2',
                                borderRadius: '1rem',
                                marginTop: '0.25rem',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                listStyle: 'none',
                                padding: 0,
                                margin: 0,
                                boxShadow: '0 18px 36px rgba(17, 17, 17, 0.12)'
                            }}>
                                {nzAnimalOptionsList
                                    .filter(a => a.toLowerCase().includes(species.toLowerCase()))
                                    .map((animal, i) => (
                                        <li
                                            key={i}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                setSpecies(animal);
                                                setShowDropdown(false);
                                            }}
                                            style={{
                                                padding: '8px 12px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #eeeeee',
                                                color: '#1f1f1f',
                                                fontSize: '0.9rem'
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f6f6f6'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                        >
                                            {animal}
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="label">Activity Type</label>
                        <div className="radio-group activity-radio-group">
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="activity"
                                    value="hunting"
                                    checked={activityType === 'hunting'}
                                    onChange={(e) => setActivityType(e.target.value)}
                                    disabled={uploading}
                                />
                                Hunting
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="activity"
                                    value="Testing"
                                    checked={activityType === 'Testing'}
                                    onChange={(e) => setActivityType(e.target.value)}
                                    disabled={uploading}
                                />
                                Testing
                            </label>
                        </div>
                    </div>

                    <div className="form-group description-group">
                        <label className="label">Brief Description / Notes</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input"
                            rows="2"
                            placeholder="Notes about the NZ field conditions..."
                            disabled={uploading}
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label className="label">NZ Region (Mandatory)</label>
                        <select
                            value={ausState}
                            onChange={(e) => setAusState(e.target.value)}
                            className="input"
                            required
                            disabled={uploading}
                        >
                            <option value="">-- Select Region --</option>
                            {nzRegions.map(reg => (
                                <option key={reg} value={reg}>{reg}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="label">Specific Location (Optional)</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="input"
                            placeholder="e.g. Southern Alps, Kaikoura"
                            disabled={uploading}
                        />
                    </div>
                </div>

                <div className="upload-column">
                    <label className="label">Image / Video Files</label>
                    <div className="form-group full-width" style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                        <label className="input-label" style={{ display: 'block', marginBottom: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.05em' }}>
                            Visibility Control
                        </label>
                        <div className="visibility-selector">
                            <button
                                type="button"
                                className={`visibility-btn public-btn ${visibility === 'public' ? 'active' : ''}`}
                                onClick={() => setVisibility('public')}
                            >
                                <span className="btn-label-main">shared ambassador footage</span>
                                <span className="btn-label-sub">Collective NZ Feed</span>
                            </button>
                            <button
                                type="button"
                                className={`visibility-btn private-btn ${visibility === 'private' ? 'active' : ''}`}
                                onClick={() => setVisibility('private')}
                            >
                                <span className="btn-label-main">my clips</span>
                                <span className="btn-label-sub">Hidden from others</span>
                            </button>
                        </div>
                    </div>

                    <div className={`upload-dropzone ${files.length > 0 || uploading || uploadMessage ? 'has-file' : ''}`}>
                        {files.length === 0 ? (
                            <div className="dropzone-empty">
                                <FontAwesomeIcon icon={faFileUpload} size="3x" className="icon-faint" />
                                <p className="text-gray-400 upload-helper-text">Select images or videos for NZ upload</p>
                                <input
                                    type="file"
                                    accept="video/*,image/*"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden-file-input"
                                    id="nz-video-upload"
                                    disabled={uploading}
                                />
                                <label htmlFor="nz-video-upload" className="browse-button">Choose Files</label>
                            </div>
                        ) : (
                            <div className="dropzone-ready">
                                <FontAwesomeIcon icon={faCheckCircle} size="3x" className="icon-success" />
                                <p className="file-name">{getSelectedMediaSummary()} selected</p>
                                <div className="file-list-preview" style={{ fontSize: '0.8rem', maxHeight: '80px', overflowY: 'auto', marginBottom: '1rem' }}>
                                    {files.map((file, index) => <div key={index}>{file.name}</div>)}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFiles([]);
                                        setUploadMessage(null);
                                    }}
                                    className="change-button"
                                    disabled={uploading}
                                >
                                    Clear All
                                </button>
                            </div>
                        )}

                        {uploading && (
                            <div style={{ width: '100%', marginTop: '1.25rem' }}>
                                <p className="upload-progress-status" style={{ margin: '0 0 0.35rem 0', fontSize: '0.95rem', fontWeight: 700, textAlign: 'center' }}>
                                    Uploaded {uploadedCount} of {files.length} media file(s)
                                </p>
                                <p className="upload-progress-percent" style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 700, textAlign: 'center' }}>
                                    {progress}%
                                </p>
                                <div className="progress-bar-container" style={{ marginTop: 0 }}>
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {uploadMessage && (
                            <div
                                style={{
                                    width: '100%',
                                    marginTop: '1rem',
                                    padding: '0.85rem 1rem',
                                    borderRadius: '0.75rem',
                                    fontSize: '0.9rem',
                                    lineHeight: 1.5,
                                    textAlign: 'center',
                                    ...uploadMessageStyles
                                }}
                            >
                                {uploadMessage.text}
                            </div>
                        )}
                    </div>

                    <button type="submit" disabled={uploading || files.length === 0 || !deviceName} className="upload-button-primary" style={{ marginTop: '2.5rem' }}>
                        {uploading ? <span>Uploading...</span> : <span>Upload NZ Footage</span>}
                    </button>

                </div>
            </form>
        </div>
    );
};

export default UploadFootageNZ;
