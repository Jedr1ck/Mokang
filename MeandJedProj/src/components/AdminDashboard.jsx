import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, logout } from "../services/api";

function AdminDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        api("/auth/me")
            .then((currentUser) => {
                if (currentUser.role !== "admin") {
                    throw new Error("Not an administrator");
                }
                setUser(currentUser);
            })
            .catch(() => navigate("/admin-login", { replace: true }));
    }, [navigate]);

    const handleLogout = () => {
        logout();
        navigate("/admin-login");
    };

    if (!user) return null;

    return (
        <main className="admin-dashboard-page">
            <section className="admin-dashboard-panel">
                <i className="bi bi-shield-check admin-dashboard-icon"></i>
                <h1>Administrator Dashboard</h1>
                <p>Welcome, {user?.fullName || "Administrator"}.</p>
                <button type="button" className="admin-main-button" onClick={handleLogout}>
                    LOG OUT
                </button>
            </section>
        </main>
    );
}

export default AdminDashboard;