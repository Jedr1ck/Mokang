import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import "./AdminDashboard.css";

function DashboardOverview() {
    return (
        <div className="admin-overview container-fluid px-0">
            <div className="admin-overview-intro card border-0 shadow-sm">
                <div>
                    <span className="admin-section-label">SYSTEM OVERVIEW</span>
                    <h2>Dashboard Overview</h2>
                    <p>
                        Monitor your SmartHome platform and manage
                        important system activities.
                    </p>
                </div>

                <div className="admin-overview-date badge rounded-pill">
                    <i className="bi bi-calendar3"></i>
                    <span>
                        {new Date().toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </span>
                </div>
            </div>

        </div>
    );
}

export default DashboardOverview;
