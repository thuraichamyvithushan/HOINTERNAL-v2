
import "./HomePageGrid.css";
import React from "react";
import { Link } from "react-router-dom";
import useDashboardConfig from "../utils/useDashboardConfig";
import Loader from "./Loader";

const TileLink = ({ tile, children }) => {
    if (tile.linkType === "internal") return <Link to={tile.link}>{children}</Link>;
    if (tile.linkType === "external") return <a href={tile.link} target="_blank" rel="noreferrer">{children}</a>;
    return <>{children}</>;
};

const getSectionClass = (title) => {
    const t = (title || "").toLowerCase();
    if (t.includes("marketing")) return "market";
    if (t.includes("sales")) return "sales";
    if (t.includes("internal") || t.includes("warehouse")) return "oso";
    return "market";
};

const TileCard = ({ tile, onNestedClick }) => (
    <div className="dashboard-tile-col">
        <div
            className="dashboard-tile-card"
            onClick={() => tile.linkType === 'nested' && onNestedClick(tile)}
            style={{ cursor: tile.linkType === 'nested' ? 'pointer' : 'default' }}
        >
            {tile.linkType !== 'nested' ? (
                <TileLink tile={tile}>
                    <div className="image-container">
                        <img
                            src={tile.imageUrl || "/images/logo_02.png"}
                            alt={tile.title}
                            onError={(e) => { e.currentTarget.src = "/images/logo_02.png"; }}
                        />
                    </div>
                    <h4 className="card-title">{tile.title}</h4>
                </TileLink>
            ) : (
                <>
                    <div className="image-container">
                        <img
                            src={tile.imageUrl || "/images/logo_02.png"}
                            alt={tile.title}
                            onError={(e) => { e.currentTarget.src = "/images/logo_02.png"; }}
                        />
                    </div>
                    <h4 className="card-title">{tile.title}</h4>
                </>
            )}
        </div>
    </div>
);

/**
 * DynamicDashboardGrid - A unified grid component that resolves navigation levels in real-time.
 * This fixes the stale data bug by NOT storing sections in the navStack.
 */
const DynamicDashboardGrid = ({ pageId }) => {
    const { sections: rootSections, loading } = useDashboardConfig(pageId);

    // navStack only stores the IDs to follow: ['root', 'tile-id-1', 'tile-id-2']
    const [navStack, setNavStack] = React.useState([{ id: "root", title: "Home" }]);

    if (loading) return <Loader />;

    // --- Dynamic Resolution of Current Level ---
    // This part is CRITICAL: it traverses the LATEST rootSections tree based on the current navStack.
    const resolveCurrentLevel = () => {
        if (navStack.length <= 1) return { title: "Home", sections: rootSections || [] };

        let currentSections = rootSections || [];
        let currentTitle = "Home";

        // Traverse the stack (skip index 0 which is root)
        for (let i = 1; i < navStack.length; i++) {
            const targetId = navStack[i].id;
            let foundTile = null;

            // Search in all sections at the current level
            for (const section of currentSections) {
                foundTile = (section.tiles || []).find(t => t.id === targetId);
                if (foundTile) break;
            }

            if (foundTile) {
                currentSections = foundTile.sections || foundTile.children || [];
                currentTitle = foundTile.title;
            } else {
                // If the path is broken (tile deleted), reset to root to avoid crashes
                console.warn(`Tile ${targetId} not found in navigation path. Resetting to root.`);
                setNavStack([{ id: "root", title: "Home" }]);
                return { title: "Home", sections: rootSections || [] };
            }
        }

        return { title: currentTitle, sections: currentSections };
    };

    const { title: currentLevelTitle, sections: displaySections } = resolveCurrentLevel();

    const handleNestedClick = (tile) => {
        setNavStack(prev => [...prev, { id: tile.id, title: tile.title }]);
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        if (navStack.length > 1) {
            setNavStack(prev => prev.slice(0, -1));
            window.scrollTo(0, 0);
        }
    };

    const handleBreadcrumb = (index) => {
        setNavStack(prev => prev.slice(0, index + 1));
        window.scrollTo(0, 0);
    };

    return (
        <div className="container main-cent">


            {displaySections.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <p>No tiles found in this section.</p>
                </div>
            )}

            <div className="cent">
                {displaySections.map((section) => (
                    <div key={section.id}>
                        <div className={getSectionClass(section.title)}>
                            <h2 className="under">{section.title}</h2>
                            <hr />
                            <div className="row no-gutters home_row">
                                {(section.tiles || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((tile) => (
                                    <TileCard key={tile.id} tile={tile} onNestedClick={handleNestedClick} />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DynamicDashboardGrid;
