import React from 'react';
import DealerNavbar from "./Dealernavbar";
import Influencernavimg from './Influencernavimg'
import DealerFooter from "./DealerFooter";
import DashboardNZ from "./influencerNZ/DashboardNZ";

const InfluencerPageNZ = function () {
    return (
        <div style={{ background: 'linear-gradient(180deg, #f8f8f8 0%, #f2f2f2 100%)' }}>
            <DealerNavbar />
            <Influencernavimg />
            <DashboardNZ />
            <DealerFooter />
        </div>
    )
}

export default InfluencerPageNZ;
