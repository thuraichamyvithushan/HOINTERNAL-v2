// import Dealerhome from "./Dealerhomegrid"
// import Footer from "./Footer";

// import DealerNavbar from "./Dealernavbar";
// import Dealerdashboardnavimg from './Dealerdashboardnavimg'
// import DealerFooter from "./DealerFooter";

import Accounts_hr_Navbar from "./Accounts-hr-navbar";
import Accounts_hr_Hero from "./Accounts-hr-dashboardnavimg";
import Accounts_hr_HomePageGrid from "./Accounts-hr-homegrid";
import Accounts_hr_Footer from "./Accounts-hr-Footer";


const Accounts_hr_Page = function () {
    return (
        <div className="dashboard-layout">

            {/* <DealerNavbar />
            <Dealerdashboardnavimg />
            <Dealerhome />
            <DealerFooter /> */}

            <Accounts_hr_Navbar/>
            <Accounts_hr_Hero/>
            <Accounts_hr_HomePageGrid/>
            <Accounts_hr_Footer/>

        </div>
    )
}

export default Accounts_hr_Page;