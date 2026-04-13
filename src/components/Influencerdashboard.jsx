import React from 'react';
import Dashboard from './influencer/Dashboard';
import DealerNavbar from "./Dealernavbar";
import Influencernavimg from './Influencernavimg'
import DealerFooter from "./DealerFooter";

const InfluencerPage = function () {
    return (
        <div style={{ backgroundColor: '#111827' }}>
            <DealerNavbar />
            <Influencernavimg />
            <Dashboard />
            <DealerFooter />
        </div>
    )
}

export default InfluencerPage;
