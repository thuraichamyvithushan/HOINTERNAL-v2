import Footer from "./Footer";
import DealerNavbar from "./Dealernavbar";
import Representativedshboardnavimg from './Representativedashboardnavimg'
import RepresentativehomeNZ from "./RepresentativehomeNZ";

const RepresentativePageNZ = function () {
    return (
        <div className="dashboard-layout">
            <DealerNavbar />
            <Representativedshboardnavimg />
            <RepresentativehomeNZ />
            <Footer />
        </div>
    )
}

export default RepresentativePageNZ;
