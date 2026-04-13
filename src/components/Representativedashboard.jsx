import RepresentativehomeGrid from "./Representativehomegrid"
import Footer from "./Footer";
import DealerNavbar from "./Dealernavbar";
import Representativedshboardnavimg from './Representativedashboardnavimg'

const RepresentativePage = function () {
    return (
        <div className="dashboard-layout">
            <DealerNavbar />
            <Representativedshboardnavimg />
            <RepresentativehomeGrid />
            <Footer />
        </div>
    )
}

export default RepresentativePage;