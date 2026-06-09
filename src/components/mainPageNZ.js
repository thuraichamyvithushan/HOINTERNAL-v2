import HomePageGridNZ from "./homePageGridNZ"
import Footer from "./Footer";
import Navimage from './navimage';
import Navbar from "./navbar";

const MainPageNZ = function () {
    return (
        <div className="dashboard-layout">
            <Navbar />
            <Navimage />
            <HomePageGridNZ />
            <Footer />
        </div>
    )
}

export default MainPageNZ;
