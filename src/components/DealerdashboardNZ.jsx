import DealerhomeNZ from "./DealerhomeNZ"
// import Footer from "./Footer";

import DealerNavbar from "./Dealernavbar";
import Dealerdashboardnavimg from './Dealerdashboardnavimg'
import DealerFooter from "./DealerFooter";


const DealerPageNZ = function () {
    return (
        <div className="dashboard-layout">

            <DealerNavbar />
            <Dealerdashboardnavimg />
            <DealerhomeNZ />
            <DealerFooter />
        </div>
    )
}

export default DealerPageNZ;
