import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { API_URL } from '../../config';
import { firestore } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faFileUpload, faCheckCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import './InfluencerDashboardNZ.css';

const UploadFootageNZ = (props) => {
    const { user } = useContext(AuthContext);
    const [files, setFiles] = useState([]);
    const [deviceName, setDeviceName] = useState('');
    const [species, setSpecies] = useState('');
    const [activityType, setActivityType] = useState('hunting');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [ausState, setAusState] = useState(''); // Reusing variable for NZ region
    const [visibility, setVisibility] = useState('public');
    const [uploading, setUploading] = useState(false);
    const [deviceOptions, setDeviceOptions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);

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
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (files.length === 0 || !deviceName || !ausState) {
            toast.error('Please select at least one video, choose a device name, and select a region.');
            return;
        }

        setUploading(true);

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
                    formData.append('ausState', ausState); // NZ region passed as ausState for compatibility
                    formData.append('visibility', visibility);
                    formData.append('region', 'NZ');
                    formData.append('userId', user.uid);
                    formData.append('userName', user.displayName || user.email?.split('@')[0] || 'Influencer');
                    formData.append('userPhoto', user.photoURL || '');
                    formData.append('originalFileName', file.name);

                    fetch(`${API_URL}/api/upload`, {
                        method: 'POST',
                        body: formData
                    })
                        .then(response => {
                            if (!response.ok) throw new Error('Upload failed');
                            return response.json();
                        })
                        .then(data => data.success ? resolve() : reject(new Error(data.error)))
                        .catch(reject);
                });
            });

            await Promise.all(uploadPromises);
            toast.success(`Successfully uploaded ${files.length} NZ video(s)!`);
            setFiles([]);
            setDeviceName('');
            setSpecies('');
            setActivityType('hunting');
            setDescription('');
            setLocation('');
            setAusState('');
            setVisibility('public');
            if (props.onComplete) props.onComplete();
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('One or more uploads failed.');
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
                    <h2 className="title-bold">NZ Influencer Footage Upload</h2>
                    <p className="subtitle-gray">Add your NZ field testing or hunting footage</p>
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
                                backgroundColor: '#1f2937',
                                border: '1px solid #374151',
                                borderRadius: '0.375rem',
                                marginTop: '0.25rem',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                listStyle: 'none',
                                padding: 0,
                                margin: 0,
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
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
                                                borderBottom: '1px solid #374151',
                                                color: '#f3f4f6',
                                                fontSize: '0.9rem'
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
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
                                backgroundColor: '#1f2937',
                                border: '1px solid #374151',
                                borderRadius: '0.375rem',
                                marginTop: '0.25rem',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                listStyle: 'none',
                                padding: 0,
                                margin: 0,
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
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
                                                borderBottom: '1px solid #374151',
                                                color: '#f3f4f6',
                                                fontSize: '0.9rem'
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
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
                    <label className="label">Video Files</label>
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

                    <div className={`upload-dropzone ${files.length > 0 ? 'has-file' : ''}`}>
                        {files.length === 0 ? (
                            <div className="dropzone-empty">
                                <FontAwesomeIcon icon={faFileUpload} size="3x" className="icon-faint" />
                                <p className="text-gray-400">Select videos for NZ upload</p>
                                <input
                                    type="file"
                                    accept="video/*"
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
                                <p className="file-name">{files.length} NZ video(s) selected</p>
                                <button type="button" onClick={() => setFiles([])} className="change-button" disabled={uploading}>Clear All</button>
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
