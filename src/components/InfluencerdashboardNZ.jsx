import React from 'react';
import DealerNavbar from "./Dealernavbar";
import Influencernavimg from './Influencernavimg'
import DealerFooter from "./DealerFooter";
import DashboardNZ from "./influencerNZ/DashboardNZ";

const InfluencerPageNZ = function () {
    return (
        <div style={{ backgroundColor: '#111827' }}>
            <DealerNavbar />
            <Influencernavimg />
            <DashboardNZ />
            <DealerFooter />
        </div>
    )
}

export default InfluencerPageNZ;
