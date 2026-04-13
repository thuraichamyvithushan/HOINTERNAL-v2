import { firestore } from "../firebase";

/**
 * Default tile data for all dashboard pages extracted from hardcoded grids.
 * Images use existing /images/ paths — no re-upload required.
 */
const DEFAULT_CONFIGS = {
    "home-au": { pageId: "home-au", sections: [] },
    "home-nz": { pageId: "home-nz", sections: [] },
    "rep-au": { pageId: "rep-au", sections: [] },
    "rep-nz": { pageId: "rep-nz", sections: [] },
    "dealer-au": { pageId: "dealer-au", sections: [] },
    "dealer-nz": { pageId: "dealer-nz", sections: [] },
};

/**
 * Seeds all 6 dashboard pages with default tile data into Firestore.
 * Call once from the admin panel. Will overwrite existing data.
 */
export const seedDashboardDefaults = async () => {
    const promises = Object.entries(DEFAULT_CONFIGS).map(([pageId, config]) =>
        firestore.collection("dashboardConfig").doc(pageId).set(config)
    );
    await Promise.all(promises);
};

export default DEFAULT_CONFIGS;
