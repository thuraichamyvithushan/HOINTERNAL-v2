import Dealerhome from "./Dealerhomegrid"
// import Footer from "./Footer";

import DealerNavbar from "./Dealernavbar";
import Dealerdashboardnavimg from './Dealerdashboardnavimg'
import DealerFooter from "./DealerFooter";


const DealerPage = function () {
    return (
        <div className="dashboard-layout">

            <DealerNavbar />
            <Dealerdashboardnavimg />
            <Dealerhome />
            <DealerFooter />
        </div>
    )
}

export default DealerPage;