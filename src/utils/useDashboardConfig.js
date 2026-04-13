import { useState, useEffect } from "react";
import { firestore } from "../firebase";
import DEFAULT_CONFIGS from "./seedDashboard";

/**
 * Real-time hook for fetching dashboard tile configuration.
 * USES LOCAL DEFAULTS AS INITIAL STATE AND FALLBACK.
 * This ensures tiles appear even if Firestore is empty or permissions are missing.
 * @param {string} pageId - e.g. "home-au", "rep-nz", "dealer-au"
 * @returns {{ sections: Array, loading: boolean }}
 */
const useDashboardConfig = (pageId) => {
  // Initialize with local defaults if available
  const getInitialState = () => {
    console.log(`Checking defaults for ${pageId}`, !!DEFAULT_CONFIGS[pageId]);
    if (DEFAULT_CONFIGS[pageId]) {
      const data = [...(DEFAULT_CONFIGS[pageId].sections || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      console.log(`Initial state for ${pageId} has ${data.length} sections`);
      return data;
    }
    return [];
  };

  const [sections, setSections] = useState(getInitialState());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pageId) return;

    // Reset to local defaults when pageId changes to ensure immediate UI update
    setSections(getInitialState());

    const unsubscribe = firestore
      .collection("dashboardConfig")
      .doc(pageId)
      .onSnapshot(
        (snapshot) => {
          if (snapshot.exists) {
            const data = snapshot.data();
            const sectionsData = data.sections || [];
            if (sectionsData.length > 0) {
              const sorted = [...sectionsData].sort(
                (a, b) => (a.order ?? 0) - (b.order ?? 0)
              );
              setSections(sorted);
            }
          }
          setLoading(false);
        },
        (error) => {
          // Silent fail on permissions/network - keep showing local defaults
          console.warn(`Firestore config load failed for ${pageId}, using local fallback:`, error.message);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [pageId]);

  return { sections, loading };
};

export default useDashboardConfig;
