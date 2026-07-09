import React from 'react';
import Dashboard from './influencer/Dashboard';
import DealerNavbar from "./Dealernavbar";
import Influencernavimg from './Influencernavimg'
import DealerFooter from "./DealerFooter";

const InfluencerPage = function () {
    return (
        <div style={{ background: 'linear-gradient(180deg, #f8f8f8 0%, #f2f2f2 100%)' }}>
            <DealerNavbar />
            <Influencernavimg />
            <Dashboard />
            <DealerFooter />
        </div>
    )
}

export default InfluencerPage;
