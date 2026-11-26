import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { firestore } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import useFootageUpload from '../../utils/useFootageUpload';
import FootageUploadQueue from '../influencer/FootageUploadQueue';
import '../influencer/FootageUploadQueue.css';
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

    const queue = useFootageUpload({
        user,
        metadata: { deviceName, species, activityType, description, location, ausState, visibility, region: 'NZ' },
        onComplete: props.onComplete,
        onBusyChange: props.onBusyChange
    });
    const uploading = queue.items.length > 0;
    let uploadLabel = files.length ? `Upload ${files.length} ${files.length === 1 ? 'file' : 'files'}` : 'Upload files';
    if (queue.uploading) {
        uploadLabel = `Uploading… ${queue.progress}%`;
    } else if (uploading) {
        uploadLabel = queue.items.some((item) => item.status === 'canceled') ? 'Batch finished' : 'Upload complete';
        if (queue.items.some((item) => item.status === 'failed')) uploadLabel = 'Retry failed files above';
    }

    const submitButton = (
        <button type="submit" disabled={uploading || queue.uploading || !files.length || !deviceName.trim() || !ausState}
            aria-busy={queue.uploading} className="upload-button-primary">
            <FontAwesomeIcon icon={queue.uploading ? faSpinner : faCloudUploadAlt} spin={queue.uploading} />
            <span>{uploadLabel}</span>
        </button>
    );

    const handleUpload = (event) => {
        event.preventDefault();
        if (!user?.uid) {
            toast.error('Please sign in again before uploading footage.');
            return;
        }
        if (!deviceName.trim() || !ausState || !files.length) {
            toast.error('Choose files, a device, and a region to upload.');
            return;
        }
        queue.start(files);
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
                <div className="footage-picker">
                    <FootageUploadQueue files={files} items={queue.items}
                        inputId="footage-picker-nz" onRetry={queue.retry} onCancel={queue.cancel}
                        onAdd={(selected) => setFiles((current) => [...current, ...selected])}
                        onRemove={(index) => setFiles((current) => current.filter((_, i) => i !== index))}>
                        {uploading && submitButton}
                    </FootageUploadQueue>
                </div>
                <fieldset className="input-column footage-fields" hidden={uploading} disabled={uploading}>
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
                </fieldset>

                <fieldset className="upload-column footage-fields" hidden={uploading} disabled={uploading}>
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

                    {!uploading && submitButton}
                </fieldset>
            </form>
        </div>
    );
};

export default UploadFootageNZ;
