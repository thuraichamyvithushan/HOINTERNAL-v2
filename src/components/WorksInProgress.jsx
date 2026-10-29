import React from "react";
import AdminNavbar from "./AdminNavbar";
import WorksInProgressHero from "./WorksInProgressnavimg";
import DynamicDashboardGrid from "./DynamicDashboardGrid";
import Footer from "./Footer";

const WorksInProgress = () => (
  <div className="dashboard-layout">
    <AdminNavbar />
    <WorksInProgressHero />
    <main>
      <DynamicDashboardGrid pageId="works-in-progress-au" showEmptySections />
    </main>
    <Footer />
  </div>
);

export default WorksInProgress;
