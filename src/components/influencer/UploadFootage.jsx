import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { API_URL } from '../../config';
import { storage, firestore } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faFileUpload, faCheckCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import './InfluencerDashboard.css';

const UploadFootage = (props) => {
    const { user } = useContext(AuthContext);
    const [files, setFiles] = useState([]);
    const [deviceName, setDeviceName] = useState('');
    const [species, setSpecies] = useState('');
    const [activityType, setActivityType] = useState('hunting');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [ausState, setAusState] = useState('');
    const [visibility, setVisibility] = useState('public');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [deviceOptions, setDeviceOptions] = useState([]);

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

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (files.length === 0 || !deviceName || !ausState) {
            toast.error('Please select at least one video, choose a device name, and select a state.');
            return;
        }

        setUploading(true);
        let completedCount = 0;
        const totalSize = files.reduce((acc, f) => acc + f.size, 0);
        let totalBytesTransferred = 0;

        try {
            const uploadPromises = files.map(async (file) => {
                return new Promise((resolve, reject) => {
                    const formData = new FormData();
                    formData.append('video', file);
                    formData.append('deviceName', deviceName);
                    formData.append('species', species);
                    formData.append('activityType', activityType);
                    formData.append('description', description);
                    formData.append('location', location);
                    formData.append('ausState', ausState);
                    formData.append('visibility', visibility);
                    formData.append('region', 'AU');
                    formData.append('userId', user.uid);
                    formData.append('userName', user.displayName || user.email?.split('@')[0] || 'Influencer');
                    formData.append('userPhoto', user.photoURL || '');
                    formData.append('originalFileName', file.name);

                    fetch(`${API_URL}/api/upload`, {
                        method: 'POST',
                        body: formData
                    })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network error or server failed to upload');
                            }
                            return response.json();
                        })
                        .then(data => {
                            if (data.success) {
                                completedCount++;
                                resolve();
                            } else {
                                reject(new Error(data.error || 'Upload failed'));
                            }
                        })
                        .catch(err => {
                            console.error('Backend upload error:', err);
                            reject(err);
                        });
                });
            });

            await Promise.all(uploadPromises);
            toast.success(`Successfully uploaded ${files.length} video(s)!`);
            setFiles([]);
            setDeviceName('');
            setSpecies('');
            setActivityType('hunting');
            setDescription('');
            setLocation('');
            setAusState('');
            setVisibility('public');
            setProgress(0);
            if (props.onComplete) props.onComplete();
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('One or more uploads failed. Please try again.');
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
                    <h2 className="title-bold">Influencer Footage Upload</h2>
                    <p className="subtitle-gray">Add your device testing or hunting footage</p>
                </div>
            </div>

            <form onSubmit={handleUpload} className="form-grid">
                <div className="input-column">
                    {/* Q1: Device Name (Mandatory Dropdown) */}
                    <div className="form-group">
                        <label className="label">Device Name (Mandatory)</label>
                        <select
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                            className="input"
                            required
                            disabled={uploading}
                        >
                            <option value="">-- Select Device --</option>
                            {deviceOptions.map((opt, i) => (
                                <option key={i} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>

                    {/* Q2: Species/Animals */}
                    <div className="form-group">
                        <label className="label">Species / Animals</label>
                        <input
                            type="text"
                            value={species}
                            onChange={(e) => setSpecies(e.target.value)}
                            className="input"
                            placeholder="E.g. Fox, Deer, Target"
                            disabled={uploading}
                        />
                    </div>

                    {/* Q3: Hunting or Testing */}
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

                    {/* Q4: Description */}
                    <div className="form-group description-group">
                        <label className="label">Brief Description / Notes</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input"
                            rows="2"
                            placeholder="Provide context about the footage..."
                            disabled={uploading}
                        ></textarea>
                    </div>

                    {/* Q5: Australian State (Mandatory) */}
                    <div className="form-group">
                        <label className="label">State / Territory (Mandatory)</label>
                        <select
                            value={ausState}
                            onChange={(e) => setAusState(e.target.value)}
                            className="input"
                            required
                            disabled={uploading}
                        >
                            <option value="">-- Select State --</option>
                            <option value="NSW">New South Wales (NSW)</option>
                            <option value="VIC">Victoria (VIC)</option>
                            <option value="QLD">Queensland (QLD)</option>
                            <option value="WA">Western Australia (WA)</option>
                            <option value="SA">South Australia (SA)</option>
                            <option value="TAS">Tasmania (TAS)</option>
                            <option value="ACT">Australian Capital Territory (ACT)</option>
                            <option value="NT">Northern Territory (NT)</option>
                        </select>
                    </div>

                    {/* Q6: Specific Location (Optional) */}
                    <div className="form-group">
                        <label className="label">Specific Location (Optional)</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="input"
                            placeholder="e.g. Broken Hill, Darling River"
                            disabled={uploading}
                        />
                    </div>
                </div>

                <div className="upload-column">
                    <label className="label">Video Files (Multiple Selected Allowed)</label>
                    <div className="form-group full-width" style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                        <label className="input-label" style={{ display: 'block', marginBottom: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.05em' }}>
                            Visibility Control
                        </label>
                        <div className="visibility-selector">
                            <button
                                type="button"
                                className={`visibility-btn public-btn ${visibility === 'public' ? 'active' : ''}`}
                                onClick={() => setVisibility('public')}
                            >
                                <span className="btn-label-main">Network Public</span>
                                <span className="btn-label-sub">Community Feed & Ranking</span>
                            </button>
                            <button
                                type="button"
                                className={`visibility-btn private-btn ${visibility === 'private' ? 'active' : ''}`}
                                onClick={() => setVisibility('private')}
                            >
                                <span className="btn-label-main">Personal Private</span>
                                <span className="btn-label-sub">Hidden from others</span>
                            </button>
                        </div>
                    </div>

                    <div className={`upload-dropzone ${files.length > 0 ? 'has-file' : ''}`}>
                        {files.length === 0 ? (
                            <div className="dropzone-empty">
                                <FontAwesomeIcon icon={faFileUpload} size="3x" className="icon-faint" />
                                <p className="text-gray-400">Select one or more videos for this device</p>
                                <input
                                    type="file"
                                    accept="video/*"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden-file-input"
                                    id="video-upload"
                                    disabled={uploading}
                                />
                                <label
                                    htmlFor="video-upload"
                                    className="browse-button"
                                >
                                    Choose Files
                                </label>
                            </div>
                        ) : (
                            <div className="dropzone-ready">
                                <FontAwesomeIcon icon={faCheckCircle} size="3x" className="icon-success" />
                                <p className="file-name">{files.length} video(s) selected</p>
                                <div className="file-list-preview" style={{ fontSize: '0.8rem', color: '#9ca3af', maxHeight: '80px', overflowY: 'auto', marginBottom: '1rem' }}>
                                    {files.map((f, i) => <div key={i}>{f.name}</div>)}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFiles([])}
                                    className="change-button"
                                    disabled={uploading}
                                >
                                    Clear All
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={uploading || files.length === 0 || !deviceName}
                        className="upload-button-primary"
                        style={{ marginTop: '2.5rem' }}
                    >
                        {uploading ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin />
                                <span>Uploading...</span>
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faCloudUploadAlt} />
                                <span>Upload All Footage</span>
                            </>
                        )}
                    </button>

                    {uploading && (
                        <div className="progress-bar-container" style={{ marginTop: '1.5rem' }}>
                            <div
                                className="progress-bar-fill"
                                style={{ width: '100%', animation: 'pulse 2s infinite' }}
                            />
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default UploadFootage;
