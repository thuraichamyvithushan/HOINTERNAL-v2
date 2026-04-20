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
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 6;

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

            // Adjust current page if this was the last item on the page
            const totalPages = Math.ceil(updatedDevices.length / productsPerPage);
            if (currentPage > totalPages && totalPages > 0) {
                setCurrentPage(totalPages);
            }
        } catch (error) {
            console.error("Error removing device:", error);
            toast.error("Failed to remove device.");
        }
    };

    // Pagination calculations
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = devices.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(devices.length / productsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            let start = Math.max(1, currentPage - 2);
            let end = Math.min(totalPages, start + maxVisible - 1);

            if (end === totalPages) {
                start = Math.max(1, end - maxVisible + 1);
            }

            for (let i = start; i <= end; i++) pages.push(i);
        }
        return pages;
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
                    {currentProducts.map((device, i) => (
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

                {/* Pagination Controls */}
                {devices.length > productsPerPage && (
                    <div className="dm-pagination">
                        <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="dm-page-btn nav-btn"
                        >
                            Prev
                        </button>

                        <div className="dm-page-numbers">
                            {getPageNumbers().map(number => (
                                <button
                                    key={number}
                                    onClick={() => paginate(number)}
                                    className={`dm-page-btn ${currentPage === number ? 'active' : ''}`}
                                >
                                    {number}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="dm-page-btn nav-btn"
                        >
                            Next
                        </button>
                    </div>
                )}
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
                    
                    .dm-pagination {
                        gap: 0.25rem;
                    }
                    .dm-page-btn {
                        padding: 0.4rem 0.6rem;
                        font-size: 12px;
                    }
                    .dm-page-btn.nav-btn {
                        padding: 0.4rem 0.75rem;
                    }
                }

                .dm-pagination {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 0.5rem;
                    margin-top: 2rem;
                    flex-wrap: wrap;
                }
                .dm-page-numbers {
                    display: flex;
                    gap: 0.35rem;
                    flex-wrap: wrap;
                    justify-content: center;
                }
                .dm-page-btn {
                    background: #374151;
                    color: white;
                    border: 1px solid #4b5563;
                    padding: 0.5rem 0.8rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                .dm-page-btn:hover:not(:disabled) {
                    background: #4b5563;
                    transform: translateY(-1px);
                }
                .dm-page-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .dm-page-btn.active {
                    background: #dc2626;
                    border-color: #dc2626;
                    font-weight: bold;
                    box-shadow: 0 0 10px rgba(220, 38, 38, 0.4);
                }
            `}</style>
        </div>
    );
};

export default DeviceManager;
