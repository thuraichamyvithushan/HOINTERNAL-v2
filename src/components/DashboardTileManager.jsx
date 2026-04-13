import React, { useState, useEffect } from "react";
import { firestore, storage } from "../firebase";
import { toast } from "react-toastify";
import DEFAULT_CONFIGS from "../utils/seedDashboard";
import "./DashboardTileManager.css";

const PAGE_OPTIONS = [
    { id: "home-au", label: "Staff — Australia" },
    { id: "home-nz", label: "Staff — New Zealand" },
    { id: "rep-au", label: "Representative — Australia" },
    { id: "rep-nz", label: "Representative — New Zealand" },
    { id: "dealer-au", label: "Dealer — Australia" },
    { id: "dealer-nz", label: "Dealer — New Zealand" },
];

const generateId = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const emptyTile = () => ({
    id: generateId(),
    title: "",
    imageUrl: "",
    linkType: "external",
    link: "",
    order: 0,
    sections: [],
});

const emptySection = () => ({
    id: generateId(),
    title: "New Section",
    order: 0,
    tiles: [],
});

const TileCard = ({
    tile,
    sectionId,
    onUpdate,
    onDelete,
    onMoveUp,
    onMoveDown,
    uploadImage,
    onManageNested
}) => {
    const [uploading, setUploading] = useState(false);

    const update = (field, value) => onUpdate(sectionId, tile.id, field, value);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        uploadImage(file, tile.id, (url) => {
            update("imageUrl", url);
            setUploading(false);
        });
    };

    return (
        <div className={`dtm-tile-card ${tile.linkType === 'nested' ? 'dtm-nested-parent' : ''}`}>
            <div className="dtm-tile-header">
                <span className="dtm-tile-label">{tile.linkType === 'nested' ? "Folder Tile" : "Link Tile"}</span>
                <div className="dtm-tile-actions">
                    <button className="dtm-move-btn" onClick={() => onMoveUp(sectionId, tile.id)} title="Move Up">▲</button>
                    <button className="dtm-move-btn" onClick={() => onMoveDown(sectionId, tile.id)} title="Move Down">▼</button>
                    <button className="dtm-delete-sm-btn" onClick={() => onDelete(sectionId, tile.id)}>✕</button>
                </div>
            </div>

            <div className="dtm-form-row">
                <label className="dtm-label">Title</label>
                <input
                    className="dtm-input"
                    value={tile.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="Tile title"
                />
            </div>

            <div className="dtm-form-row">
                <label className="dtm-label">Image</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                    <img
                        src={tile.imageUrl || "/images/logo_02.png"}
                        alt=""
                        className="dtm-preview"
                        onError={(e) => { e.target.src = "/images/logo_02.png"; }}
                    />
                    <input
                        className="dtm-input"
                        style={{ flex: 1 }}
                        value={tile.imageUrl}
                        onChange={(e) => update("imageUrl", e.target.value)}
                        placeholder="./images/example.png or URL"
                    />
                    <label className="dtm-upload-label">
                        {uploading ? "…" : "Upload"}
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                    </label>
                </div>
            </div>

            <div className="dtm-form-row">
                <label className="dtm-label">Type</label>
                <select className="dtm-select" value={tile.linkType} onChange={(e) => update("linkType", e.target.value)}>
                    <option value="external">External Link</option>
                    <option value="internal">Internal Route</option>
                    <option value="nested">Nested Dashboard</option>
                    <option value="none">No Link</option>
                </select>
            </div>

            {tile.linkType === "nested" ? (
                <div style={{ marginTop: 12 }}>
                    <button className="dtm-manage-nested-btn" onClick={() => onManageNested(tile.id, tile.title)}>
                        Manage Nested Dashboard ({(tile.sections || []).length} Sections)
                    </button>
                </div>
            ) : tile.linkType !== "none" ? (
                <div className="dtm-form-row">
                    <label className="dtm-label">Link</label>
                    <input
                        className="dtm-input"
                        value={tile.link}
                        onChange={(e) => update("link", e.target.value)}
                        placeholder={tile.linkType === "internal" ? "/events" : "https://..."}
                    />
                </div>
            ) : null}
        </div>
    );
};

const DashboardTileManager = () => {
    const [selectedPage, setSelectedPage] = useState("home-au");
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Navigation stack: [{ id: 'root', title: 'Root' }, { id: 'tileId', title: 'My Tile' }]
    const [viewStack, setViewStack] = useState([{ id: "root", title: "Main Dashboard" }]);

    // Load page config from Firestore (compat SDK)
    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true);
            try {
                // Reset stack when page changes
                setViewStack([{ id: "root", title: "Main Dashboard" }]);

                // Pre-populate with local defaults
                if (DEFAULT_CONFIGS[selectedPage]) {
                    setSections([...(DEFAULT_CONFIGS[selectedPage].sections || [])].sort((a, b) => (a.order || 0) - (b.order || 0)));
                }

                const snap = await firestore
                    .collection("dashboardConfig")
                    .doc(selectedPage)
                    .get();
                if (snap.exists) {
                    const data = snap.data();
                    setSections([...(data.sections || [])].sort((a, b) => (a.order || 0) - (b.order || 0)));
                }
            } catch (err) {
                console.warn("Firestore fetch failed, using local defaults:", err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [selectedPage]);

    // ── Navigation ──
    const currentView = viewStack[viewStack.length - 1];

    const findSectionsByStack = (allSections, stack) => {
        if (stack.length <= 1) return allSections;
        let currentArr = allSections;
        for (let i = 1; i < stack.length; i++) {
            const targetId = stack[i].id;
            let foundTile = null;
            for (const section of currentArr) {
                foundTile = (section.tiles || []).find(t => t.id === targetId);
                if (foundTile) break;
            }
            if (foundTile) {
                currentArr = foundTile.sections || [];
            } else {
                return []; // Should not happen
            }
        }
        return currentArr;
    };

    const currentSections = findSectionsByStack(sections, viewStack);

    const pushView = (tileId, title) => {
        setViewStack(prev => [...prev, { id: tileId, title }]);
    };

    const popView = () => {
        if (viewStack.length > 1) setViewStack(prev => prev.slice(0, -1));
    };

    const jumpToView = (index) => {
        setViewStack(prev => prev.slice(0, index + 1));
    };

    // ── Recursive State Updates ──
    const updateAtCurrentLevel = (updater) => {
        setSections(prevSections => {
            const newSections = JSON.parse(JSON.stringify(prevSections)); // Deep clone for safety

            const modify = (items, stackIndex) => {
                // If we've reached the target level in the stack (index matches viewStack.length)
                // then 'items' is the array of sections at the current view level.
                if (stackIndex === viewStack.length) {
                    return updater(items);
                }

                const targetTileId = viewStack[stackIndex].id;

                // Map over sections to find the one containing the next tile in the stack
                return items.map(section => ({
                    ...section,
                    tiles: (section.tiles || []).map(tile => {
                        if (tile.id === targetTileId) {
                            // Recursively dive into this tile's sections
                            return {
                                ...tile,
                                sections: modify(tile.sections || [], stackIndex + 1)
                            };
                        }
                        return tile;
                    })
                }));
            };

            // Start recursion from root level (stackIndex 1, since index 0 is 'root')
            return modify(newSections, 1);
        });
    };

    // Upload image to Firebase Storage (compat SDK)
    const uploadImage = (file, tileId, onSuccess) => {
        const storageRef = storage.ref(`dashboard-tiles/${selectedPage}/${tileId}-${Date.now()}`);
        const task = storageRef.put(file);
        task.on(
            "state_changed",
            null,
            (err) => toast.error("Upload failed: " + err.message),
            async () => {
                const url = await task.snapshot.ref.getDownloadURL();
                onSuccess(url);
                toast.success("Image uploaded!");
            }
        );
    };

    // Save to Firestore (compat SDK)
    const saveConfig = async () => {
        setSaving(true);
        try {
            // Recursive normalization to ensure orders are correct
            const normalizeArr = (secs) => (secs || []).map((s, si) => ({
                ...s,
                order: si,
                tiles: (s.tiles || []).map((t, ti) => ({
                    ...t,
                    order: ti,
                    sections: normalizeArr(t.sections || t.children || [])
                }))
            }));

            const normalized = normalizeArr(sections);
            await firestore
                .collection("dashboardConfig")
                .doc(selectedPage)
                .set({ pageId: selectedPage, sections: normalized });
            toast.success("Dashboard saved!");
        } catch (err) {
            toast.error("Save failed: " + err.message);
        } finally {
            setSaving(false);
        }
    };


    // ── Section CRUD ──
    const addSection = () => {
        updateAtCurrentLevel(prev => [...prev, { ...emptySection(), order: prev.length }]);
    };

    const updateSectionTitle = (sectionId, value) => {
        updateAtCurrentLevel(prev => prev.map(s => s.id === sectionId ? { ...s, title: value } : s));
    };

    const deleteSection = (sectionId) => {
        if (!window.confirm("Delete this section and all its tiles?")) return;
        updateAtCurrentLevel(prev => prev.filter(s => s.id !== sectionId));
    };

    const moveSectionUp = (sectionId) => {
        updateAtCurrentLevel(prev => {
            const idx = prev.findIndex(s => s.id === sectionId);
            if (idx <= 0) return prev;
            const next = [...prev];
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
            return next;
        });
    };

    const moveSectionDown = (sectionId) => {
        updateAtCurrentLevel(prev => {
            const idx = prev.findIndex(s => s.id === sectionId);
            if (idx >= prev.length - 1) return prev;
            const next = [...prev];
            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
            return next;
        });
    };

    // ── Tile CRUD ──
    const addTile = (sectionId) => {
        updateAtCurrentLevel(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return { ...s, tiles: [...(s.tiles || []), { ...emptyTile(), order: (s.tiles || []).length }] };
        }));
    };

    const updateTile = (sectionId, tileId, field, value) => {
        updateAtCurrentLevel(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                tiles: (s.tiles || []).map(t => {
                    if (t.id === tileId) {
                        const updated = { ...t, [field]: value };
                        // Ensure sections exists if it's a nested tile
                        if (updated.linkType === 'nested' && !updated.sections) {
                            updated.sections = [];
                        }
                        return updated;
                    }
                    return t;
                })
            };
        }));
    };

    const deleteTile = (sectionId, tileId) => {
        updateAtCurrentLevel(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return { ...s, tiles: (s.tiles || []).filter(t => t.id !== tileId) };
        }));
    };

    const moveTile = (sectionId, tileId, direction) => {
        updateAtCurrentLevel(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            const tiles = [...(s.tiles || [])];
            const idx = tiles.findIndex(t => t.id === tileId);
            const swapIdx = direction === "up" ? idx - 1 : idx + 1;
            if (swapIdx < 0 || swapIdx >= tiles.length) return s;
            [tiles[idx], tiles[swapIdx]] = [tiles[swapIdx], tiles[idx]];
            return { ...s, tiles };
        }));
    };


    return (
        <div className="dtm-container">
            {/* Header */}
            <div className="dtm-header">
                <div>
                    <h2 className="dtm-title">Dashboard Tile Manager</h2>
                    {/* Breadcrumbs */}
                    <div className="dtm-breadcrumbs">
                        {/* Breadcrumbs removed as requested */}
                    </div>
                </div>
                <div className="dtm-header-actions">
                    {viewStack.length > 1 && (
                        <button className="dtm-back-btn" onClick={popView}>← Back</button>
                    )}
                    <button className="dtm-save-btn" onClick={saveConfig} disabled={saving}>
                        {saving ? "Saving..." : "💾 Save Changes"}
                    </button>
                </div>
            </div>

            {/* Page Selector (only at root) */}
            {viewStack.length === 1 && (
                <div className="dtm-page-selector">
                    <label className="dtm-page-selector-label">Select Page:</label>
                    <select className="dtm-page-select" value={selectedPage} onChange={(e) => setSelectedPage(e.target.value)}>
                        {PAGE_OPTIONS.map((p) => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                    </select>
                </div>
            )}

            {loading ? (
                <p style={{ textAlign: "center", color: "#888", marginTop: 40 }}>Loading...</p>
            ) : (
                <>
                    {currentSections.length === 0 && (
                        <div className="dtm-empty-state">
                            <p>No sections here. Click "Add Section" to start building this level.</p>
                        </div>
                    )}

                    {currentSections.map((section) => (
                        <div key={section.id} className="dtm-section-box">
                            <div className="dtm-section-header">
                                <input
                                    className="dtm-section-title-input"
                                    value={section.title}
                                    onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                                    placeholder="Section title"
                                />
                                <div className="dtm-section-actions">
                                    <button className="dtm-move-btn" onClick={() => moveSectionUp(section.id)}>▲</button>
                                    <button className="dtm-move-btn" onClick={() => moveSectionDown(section.id)}>▼</button>
                                    <button className="dtm-delete-sm-btn" onClick={() => deleteSection(section.id)}>✕ Delete Section</button>
                                </div>
                            </div>

                            <div className="dtm-tiles-grid">
                                {(section.tiles || []).sort((a, b) => a.order - b.order).map((tile) => (
                                    <TileCard
                                        key={tile.id}
                                        tile={tile}
                                        sectionId={section.id}
                                        onUpdate={updateTile}
                                        onDelete={deleteTile}
                                        onMoveUp={moveTile}
                                        onMoveDown={moveTile}
                                        uploadImage={uploadImage}
                                        onManageNested={pushView}
                                    />
                                ))}
                            </div>
                            <button className="dtm-add-tile-btn" onClick={() => addTile(section.id)}>+ Add Tile</button>
                        </div>
                    ))}

                    <button className="dtm-add-section-btn" onClick={addSection}>+ Add Section</button>
                </>
            )}
        </div>
    );
};

export default DashboardTileManager;
