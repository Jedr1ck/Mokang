import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import logo from "../../assets/images/handyman-mark.svg";
import "./SideBarAdmin.css";

function SideBarAdmin({
    activePage,
    setActivePage,
    sidebarOpen,
    setSidebarOpen,
    handleLogout,
    unreadNotificationCount,
}) {

    const menuItems = [
        {
            label: "Dashboard",
            icon: "bi-grid-1x2-fill",
        },
        {
            label: "Manage Homeowners",
            icon: "bi-people-fill",
        },
        {
            label: "Manage Service Providers",
            icon: "bi-person-badge-fill",
        },
        {
            label: "Booking Management",
            icon: "bi-calendar-check-fill",
        },
        {
            label: "Service Categories",
            icon: "bi-grid-fill",
        },
        {
            label: "Reviews and Complaints",
            icon: "bi-chat-left-text-fill",
        },
        {
            label: "Notification",
            icon: "bi-bell-fill",
        },
        {
            label: "Admin Profile",
            icon: "bi-person-circle",
        },
        {
            label: "System Setting",
            icon: "bi-gear-fill",
        },
    ];

    const handleMenuClick = (label) => {
        setActivePage(label);

        // Close sidebar on mobile after selecting a menu
        if (window.innerWidth <= 768) {
            setSidebarOpen(false);
        }
    };

    return (
        <aside className="admin-sidebar !border-r !border-white/10 !bg-slate-950 !text-slate-200 !shadow-2xl !shadow-slate-950/30" aria-label="Admin navigation">

            {/* =================================================
                        SIDEBAR LOGO
            ================================================== */}

            <div className="admin-sidebar-logo !h-[88px] !gap-3 !border-white/10 !px-5">

                <div className="admin-logo-icon !h-12 !w-12 !rounded-2xl !bg-white/10 !p-1.5">
                    <img src={logo} alt="HandyMan logo" />
                </div>

                {sidebarOpen && (
                    <div className="admin-logo-text !gap-1">
                        <strong className="!text-lg !font-bold !tracking-tight !text-white">HandyMan</strong>
                        <span className="!mt-0 !text-[9px] !font-bold !tracking-[0.2em] !text-orange-400">ADMIN PANEL</span>
                    </div>
                )}

            </div>


            {/* =================================================
                        SIDEBAR NAVIGATION
            ================================================== */}

            <nav className="admin-sidebar-nav !px-3 !py-6">

                <span className="admin-nav-title !mb-4 !px-3 !text-[10px] !font-bold !tracking-[0.2em] !text-slate-500">
                    {sidebarOpen ? "MAIN MENU" : "MENU"}
                </span>


                <div className="admin-nav-list">

                    {menuItems.map((item) => (

                        <button
                            key={item.label}
                            type="button"

                            className={`admin-nav-item group !min-h-12 !rounded-xl !px-3 !font-medium !text-slate-300 !transition-all !duration-200 hover:!translate-x-1 hover:!bg-white/10 hover:!text-white focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-orange-400 ${activePage === item.label
                                ? "active !bg-gradient-to-r !from-orange-500 !to-orange-600 !text-white !shadow-lg !shadow-orange-950/40"
                                : ""
                                }`}

                            onClick={() =>
                                handleMenuClick(item.label)
                            }

                            title={
                                !sidebarOpen
                                    ? item.label
                                    : undefined
                            }
                        >

                            <span className="admin-nav-icon !text-slate-400 group-hover:!text-white">
                                <i
                                    className={`bi ${item.icon}`}
                                ></i>
                            </span>


                            {sidebarOpen && (
                                <span className="admin-nav-label !font-medium !tracking-[0.01em]">
                                    {item.label}
                                </span>
                            )}


                            {/* Notification count */}

                            {item.label === "Notification" && unreadNotificationCount > 0 && (
                                <span className="admin-notification-badge !min-w-6 !rounded-full !bg-orange-500 !px-2 !text-[10px] !font-bold !text-white">
                                    {unreadNotificationCount > 99
                                        ? "99+"
                                        : unreadNotificationCount}
                                </span>
                            )}

                        </button>

                    ))}

                </div>

            </nav>


            {/* =================================================
                        SIDEBAR FOOTER / LOGOUT
            ================================================== */}

            <div className="admin-sidebar-bottom !border-white/10 !px-3 !py-4">

                <button
                    type="button"
                    className="admin-logout-button !min-h-12 !rounded-xl !border-orange-500/20 !bg-orange-500/10 !px-3 !font-semibold !text-orange-200 !transition-all hover:!border-orange-500 hover:!bg-orange-500 hover:!text-white"

                    onClick={handleLogout}

                    title={
                        !sidebarOpen
                            ? "Log Out"
                            : undefined
                    }
                >

                    <span className="admin-logout-icon">
                        <i className="bi bi-box-arrow-right"></i>
                    </span>

                    {sidebarOpen && (
                        <span className="admin-logout-label">
                            Log Out
                        </span>
                    )}

                </button>

            </div>

        </aside>
    );
}

export default SideBarAdmin;
