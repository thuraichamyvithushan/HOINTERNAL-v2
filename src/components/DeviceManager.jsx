import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import './AdminDashboard.css';

const DeviceManager = () => {
    const [devices, setDevices] = useState([]);
    const [newDevice, setNewDevice] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const docRef = doc(firestore, 'settings', 'deviceOptions');

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setDevices(docSnap.data().devices || []);
                } else {
                    const defaults = [
                        "Huntsman Thermal Alpha",
                        "Huntsman Night Vision V1",
                        "Huntsman Rangefinder X",
                        "Generic Thermal Scope",
                        "Generic Night Vision"
                    ];
                    await setDoc(docRef, { devices: defaults });
                    setDevices(defaults);
                }
            } catch (error) {
                console.error("Error fetching device options:", error);
                toast.error("Failed to load device options.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDevices();
    }, []);

    const addDevice = async () => {
        if (!newDevice.trim()) return;
        if (devices.includes(newDevice.trim())) {
            toast.error("Device already exists!");
            return;
        }

        const updatedDevices = [...devices, newDevice.trim()];

        try {
            await setDoc(docRef, { devices: updatedDevices }, { merge: true });
            setDevices(updatedDevices);
            setNewDevice('');
            toast.success("Device added successfully!");
        } catch (error) {
            console.error("Error adding device:", error);
            toast.error("Failed to add device.");
        }
    };

    const deleteDevice = async (deviceToDelete) => {
        if (!window.confirm(`Are you sure you want to remove "${deviceToDelete}"?`)) return;

        const updatedDevices = devices.filter(d => d !== deviceToDelete);

        try {
            await setDoc(docRef, { devices: updatedDevices }, { merge: true });
            setDevices(updatedDevices);
            toast.success("Device removed successfully!");
        } catch (error) {
            console.error("Error removing device:", error);
            toast.error("Failed to remove device.");
        }
    };

    if (isLoading) return <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Loading device options...</div>;

    return (
        <div className="dm-wrapper">
            <h2 className="dashboard-title">DEVICE PRODUCT MANAGEMENT</h2>
            <p className="dm-subtitle">
                Manage the products that appear in the 'Device Name' dropdown for Influencers (AU &amp; NZ).
            </p>

            <div className="dm-card">
                <div className="dm-input-row">
                    <input
                        type="text"
                        value={newDevice}
                        onChange={(e) => setNewDevice(e.target.value)}
                        placeholder="E.g. Huntsman Thermal Beta"
                        className="dm-input"
                        onKeyPress={(e) => e.key === 'Enter' && addDevice()}
                    />
                    <button onClick={addDevice} className="dm-add-btn">
                        <FontAwesomeIcon icon={faPlus} className="dm-btn-icon" />
                        <span>Add Product</span>
                    </button>
                </div>

                <ul className="dm-list">
                    {devices.map((device, i) => (
                        <li key={i} className="dm-list-item">
                            <span className="dm-device-name">{device}</span>
                            <button
                                onClick={() => deleteDevice(device)}
                                className="dm-delete-btn"
                                title="Remove"
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </li>
                    ))}
                    {devices.length === 0 && (
                        <li className="dm-empty">No devices found. Add one above.</li>
                    )}
                </ul>
            </div>

            <style>{`
                .dm-wrapper { margin-top: 1rem; }
                .dm-subtitle {
                    color: #9ca3af;
                    margin-bottom: 1.5rem;
                    text-align: center;
                    font-size: 14px;
                }
                .dm-card {
                    max-width: 600px;
                    margin: 0 auto;
                    background: #1f2937;
                    padding: 2rem;
                    border-radius: 1rem;
                }
                .dm-input-row {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                .dm-input {
                    flex: 1;
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    border: 1px solid #374151;
                    background: #111827;
                    color: white;
                    font-size: 14px;
                    min-width: 0;
                }
                .dm-add-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.75rem 1.5rem;
                    background: #dc2626;
                    color: white;
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 14px;
                    white-space: nowrap;
                }
                .dm-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .dm-list-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.9rem 1rem;
                    background: #374151;
                    margin-bottom: 0.5rem;
                    border-radius: 0.5rem;
                }
                .dm-device-name {
                    color: white;
                    font-size: 14px;
                    word-break: break-word;
                    flex: 1;
                    margin-right: 0.5rem;
                }
                .dm-delete-btn {
                    background: transparent;
                    color: #ef4444;
                    border: none;
                    cursor: pointer;
                    padding: 0.4rem 0.5rem;
                    font-size: 14px;
                    flex-shrink: 0;
                }
                .dm-empty {
                    color: #9ca3af;
                    text-align: center;
                    padding: 1rem;
                }
                @media (max-width: 600px) {
                    .dm-subtitle { font-size: 13px; margin-bottom: 1rem; }
                    .dm-card { padding: 1.25rem 1rem; }
                    .dm-input-row { gap: 0.75rem; flex-direction: column; }
                    .dm-input { padding: 0.75rem; font-size: 14px; width: 100%; box-sizing: border-box; }
                    .dm-add-btn { padding: 0.75rem; font-size: 14px; width: 100%; justify-content: center; }
                    .dm-list-item { padding: 0.75rem 1rem; }
                    .dm-device-name { font-size: 13px; }
                    .dm-delete-btn { font-size: 13px; }
                }
            `}</style>
        </div>
    );
};

export default DeviceManager;
