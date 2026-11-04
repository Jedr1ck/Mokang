import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import "./AdminDashboard.css";

function DashboardOverview() {
    return (
        <div className="admin-overview container-fluid px-0 space-y-6">
            <div className="admin-overview-intro card border-0 shadow-sm !relative !overflow-hidden !rounded-[28px] !border !border-orange-200/50 !bg-gradient-to-br !from-slate-950 !via-slate-900 !to-orange-950 !px-8 !py-9 !text-white !shadow-xl !shadow-slate-900/10 md:!px-10 md:!py-11">
                <div>
                    <span className="admin-section-label !font-semibold !tracking-[0.2em] !text-orange-300">SYSTEM OVERVIEW</span>
                    <h2 className="!mt-3 !text-3xl !font-bold !tracking-tight !text-white md:!text-4xl">Dashboard Overview</h2>
                    <p className="!max-w-2xl !text-sm !leading-7 !text-slate-300 md:!text-base">
                        Monitor your SmartHome platform and manage
                        important system activities.
                    </p>
                </div>

                <div className="admin-overview-date badge rounded-pill !border !border-white/15 !bg-white/10 !px-4 !py-3 !text-slate-100 !backdrop-blur">
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
