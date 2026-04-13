import React, { useEffect, useState } from "react";
import { firestore } from "../firebase";
import Loader from "./Loader";
import { toast } from "react-toastify";
import { doc, updateDoc, deleteDoc, getDocs, collection } from "firebase/firestore";
import DeviceManager from "./DeviceManager";
import DashboardTileManager from "./DashboardTileManager";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeView, setActiveView] = useState("users");
  const usersPerPage = 6;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "users"));
        const userData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(userData);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to fetch users");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const updateUserRole = async (userId, newRole) => {
    try {
      const userRef = doc(firestore, "users", userId);
      await updateDoc(userRef, { role: newRole });
      toast.success("User role updated!");
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Error updating role: " + error.message);
    }
  };

  const updateUserCountry = async (userId, newCountry) => {
    try {
      const userRef = doc(firestore, "users", userId);
      await updateDoc(userRef, { country: newCountry });
      toast.success("User region updated!");
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, country: newCountry } : u));
    } catch (error) {
      console.error("Error updating region:", error);
      toast.error("Error updating region: " + error.message);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteDoc(doc(firestore, "users", userId));
      toast.success("User deleted!");
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error deleting user: " + error.message);
    }
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="admin-dashboard-container">
      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeView === "users" ? "active" : ""}`}
          onClick={() => setActiveView("users")}
        >
          USER MANAGEMENT
        </button>
        <button
          className={`admin-tab-btn ${activeView === "products" ? "active" : ""}`}
          onClick={() => setActiveView("products")}
        >
          PRODUCT MANAGEMENT
        </button>
        <button
          className={`admin-tab-btn ${activeView === "tiles" ? "active" : ""}`}
          onClick={() => setActiveView("tiles")}
        >
          DASHBOARD TILES
        </button>
      </div>

      {activeView === "users" ? (
        <>
          <h2 className="dashboard-title">USER DETAILS</h2>
          {isLoading ? <Loader /> : (
            <>
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Region</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map(user => (
                      <tr key={user.id}>
                        <td>{user.name || "N/A"}</td>
                        <td>{user.email || "N/A"}</td>
                        <td>
                          <select
                            className="role-select"
                            value={user.role || "dealer"}
                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                          >
                            <option value="dealer">Dealer</option>
                            <option value="representative">Representative</option>
                            <option value="influencer">Influencer</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>
                          <select
                            className="role-select"
                            value={user.country || "Australia"}
                            onChange={(e) => updateUserCountry(user.id, e.target.value)}
                          >
                            <option value="Australia">Australia</option>
                            <option value="New Zealand">New Zealand</option>
                          </select>
                        </td>

                        <td>
                          <button
                            className="delete-btn"
                            onClick={() => deleteUser(user.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={currentPage === i + 1 ? "active-page" : ""}
                    onClick={() => goToPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      ) : activeView === "products" ? (
        <DeviceManager />
      ) : (
        <DashboardTileManager />
      )}
    </div>
  );
};

export default AdminDashboard;
