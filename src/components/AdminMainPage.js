
import Footer from "./Footer";
import AdminDashboard from "./AdminDashboard";
import AdminDashboardnavimg from "./AdminDashboardnavimg"
import AdminNavbar from './AdminNavbar'
import AdminCard from "./AdminCard";



const AdminPage = function () {
    return (
        <div className="dashboard-layout">
            <AdminNavbar />
            <AdminDashboardnavimg />
            <AdminCard />
            <AdminDashboard />
            <Footer />
        </div>
    )
}

export default AdminPage;