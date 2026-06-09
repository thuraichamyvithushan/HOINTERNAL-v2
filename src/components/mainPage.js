import HomePageGrid from "./homePageGrid"
import Footer from "./Footer";
import Navimage from './navimage';
import Navbar from "./navbar";

const MainPage = function () {
    return (
        <div className="dashboard-layout">
            <Navbar />
            <Navimage />
            <HomePageGrid />
            <Footer />
        </div>
    )
}

export default MainPage;