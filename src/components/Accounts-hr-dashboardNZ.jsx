

import Accounts_hr_Navbar from "./Accounts-hr-navbar";
import Accounts_hr_Hero from "./Accounts-hr-dashboardnavimg";
import Accounts_hr_Footer from "./Accounts-hr-Footer";
import Accounts_hr_HomePageGrid_nz from "./Accounts-hr-homegrid-nz";


const Accounts_hr_Page_nz = function () {
    return (
        <div className="dashboard-layout">



            <Accounts_hr_Navbar/>
            <Accounts_hr_Hero/>
            <Accounts_hr_HomePageGrid_nz/>
            <Accounts_hr_Footer/>

        </div>
    )
}

export default Accounts_hr_Page_nz;