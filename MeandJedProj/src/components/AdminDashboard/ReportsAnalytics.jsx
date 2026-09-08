import React, { useState, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./AdminDashboard.css";

function ReportsAnalytics() {
    const [reports, setReports] = useState([]);

    const [reportType, setReportType] = useState("All");
    const [dateRange, setDateRange] = useState("All Time");
    const [searchTerm, setSearchTerm] = useState("");

    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 5;

    const filteredReports = useMemo(() => {
        return reports.filter((report) => {
            const search = searchTerm.toLowerCase();

            const matchesSearch =
                String(report.id || "")
                    .toLowerCase()
                    .includes(search) ||
                String(report.title || "")
                    .toLowerCase()
                    .includes(search) ||
                String(report.type || "")
                    .toLowerCase()
                    .includes(search) ||
                String(report.description || "")
                    .toLowerCase()
                    .includes(search);

            const matchesType =
                reportType === "All" ||
                report.type === reportType;

            const matchesDate =
                dateRange === "All Time" ||
                report.dateRange === dateRange;

            return (
                matchesSearch &&
                matchesType &&
                matchesDate
            );
        });
    }, [
        reports,
        searchTerm,
        reportType,
        dateRange,
    ]);

    const totalPages = Math.ceil(
        filteredReports.length / itemsPerPage
    );

    const paginatedReports = filteredReports.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalReports = reports.length;

    const bookingReports = reports.filter(
        (report) => report.type === "Booking"
    ).length;

    const providerReports = reports.filter(
        (report) => report.type === "Provider"
    ).length;

    const userReports = reports.filter(
        (report) => report.type === "User"
    ).length;

    const handleSearch = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleReportType = (value) => {
        setReportType(value);
        setCurrentPage(1);
    };

    const handleDateRange = (value) => {
        setDateRange(value);
        setCurrentPage(1);
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "Generated":
                return "status-generated";

            case "Processing":
                return "status-processing";

            case "Pending":
                return "status-pending";

            case "Failed":
                return "status-failed";

            default:
                return "status-default";
        }
    };

    const getReportIcon = (type) => {
        switch (type) {
            case "Booking":
                return "bi-calendar-check-fill";

            case "Provider":
                return "bi-person-badge-fill";

            case "User":
                return "bi-people-fill";

            case "Service":
                return "bi-grid-fill";

            case "Financial":
                return "bi-cash-stack";

            default:
                return "bi-bar-chart-fill";
        }
    };

    const getShowingText = () => {
        if (filteredReports.length === 0) {
            return "Showing 0 to 0 of 0";
        }

        const start =
            (currentPage - 1) * itemsPerPage + 1;

        const end = Math.min(
            currentPage * itemsPerPage,
            filteredReports.length
        );

        return `Showing ${start} to ${end} of ${filteredReports.length}`;
    };

    return (
        <div className="reports-analytics-page">

            {/* PAGE HEADER */}
            <div className="reports-page-header">

                <div>
                    <span className="reports-section-label">
                        SYSTEM MONITORING
                    </span>

                    <h2>Reports and Analytics</h2>

                    <p>
                        Monitor system activity and review
                        platform reports and analytics.
                    </p>
                </div>

            </div>

            {/* SUMMARY CARDS */}
            <div className="reports-summary-grid">

                <div className="reports-summary-card">
                    <div className="reports-summary-icon green">
                        <i className="bi bi-bar-chart-fill"></i>
                    </div>

                    <div>
                        <span>Total Reports</span>
                        <strong>{totalReports}</strong>
                    </div>
                </div>

                <div className="reports-summary-card">
                    <div className="reports-summary-icon orange">
                        <i className="bi bi-calendar-check-fill"></i>
                    </div>

                    <div>
                        <span>Booking Reports</span>
                        <strong>{bookingReports}</strong>
                    </div>
                </div>

                <div className="reports-summary-card">
                    <div className="reports-summary-icon green">
                        <i className="bi bi-person-badge-fill"></i>
                    </div>

                    <div>
                        <span>Provider Reports</span>
                        <strong>{providerReports}</strong>
                    </div>
                </div>

                <div className="reports-summary-card">
                    <div className="reports-summary-icon orange">
                        <i className="bi bi-people-fill"></i>
                    </div>

                    <div>
                        <span>User Reports</span>
                        <strong>{userReports}</strong>
                    </div>
                </div>

            </div>

            {/* ANALYTICS OVERVIEW */}
            <div className="reports-analytics-grid">

                <section className="reports-analytics-card">

                    <div className="reports-analytics-card-header">

                        <div>
                            <span className="analytics-label">
                                ACTIVITY
                            </span>

                            <h3>Booking Analytics</h3>

                            <p>
                                Overview of booking activity.
                            </p>
                        </div>

                        <div className="reports-analytics-header-icon green">
                            <i className="bi bi-calendar-check-fill"></i>
                        </div>

                    </div>

                    <div className="reports-analytics-empty">

                        <div className="reports-chart-icon">
                            <i className="bi bi-bar-chart-line"></i>
                        </div>

                        <strong>
                            No booking data available
                        </strong>

                        <span>
                            Booking analytics will be displayed
                            when booking data is connected.
                        </span>

                    </div>

                </section>

                <section className="reports-analytics-card">

                    <div className="reports-analytics-card-header">

                        <div>
                            <span className="analytics-label">
                                PROVIDER ACTIVITY
                            </span>

                            <h3>Service Provider Analytics</h3>

                            <p>
                                Overview of provider activity.
                            </p>
                        </div>

                        <div className="reports-analytics-header-icon orange">
                            <i className="bi bi-person-badge-fill"></i>
                        </div>

                    </div>

                    <div className="reports-analytics-empty">

                        <div className="reports-chart-icon">
                            <i className="bi bi-pie-chart"></i>
                        </div>

                        <strong>
                            No provider data available
                        </strong>

                        <span>
                            Provider analytics will be displayed
                            when provider data is connected.
                        </span>

                    </div>

                </section>

            </div>

            {/* REPORT FILTERS */}
            <div className="reports-filter-card">

                <div className="reports-search-box">

                    <i className="bi bi-search"></i>

                    <input
                        type="text"
                        placeholder="Search reports..."
                        value={searchTerm}
                        onChange={(event) =>
                            handleSearch(
                                event.target.value
                            )
                        }
                    />

                </div>

                <div className="reports-filter-box">

                    <label htmlFor="report-type-filter">
                        Report Type
                    </label>

                    <select
                        id="report-type-filter"
                        value={reportType}
                        onChange={(event) =>
                            handleReportType(
                                event.target.value
                            )
                        }
                    >
                        <option value="All">
                            All Reports
                        </option>

                        <option value="Booking">
                            Booking
                        </option>

                        <option value="Provider">
                            Provider
                        </option>

                        <option value="User">
                            User
                        </option>

                        <option value="Service">
                            Service
                        </option>

                        <option value="Financial">
                            Financial
                        </option>
                    </select>

                </div>

                <div className="reports-filter-box">

                    <label htmlFor="report-date-filter">
                        Date Range
                    </label>

                    <select
                        id="report-date-filter"
                        value={dateRange}
                        onChange={(event) =>
                            handleDateRange(
                                event.target.value
                            )
                        }
                    >
                        <option value="All Time">
                            All Time
                        </option>

                        <option value="Today">
                            Today
                        </option>

                        <option value="This Week">
                            This Week
                        </option>

                        <option value="This Month">
                            This Month
                        </option>

                        <option value="This Year">
                            This Year
                        </option>
                    </select>

                </div>

            </div>

            {/* REPORT TABLE */}
            <div className="reports-table-card">

                <div className="reports-table-header">

                    <div>
                        <h3>Generated Reports</h3>

                        <p>
                            System reports and analytics
                            records.
                        </p>
                    </div>

                    <div className="reports-table-count">
                        {filteredReports.length}{" "}
                        {filteredReports.length === 1
                            ? "report"
                            : "reports"}
                    </div>

                </div>

                <div className="reports-table-wrapper">

                    <table className="reports-table">

                        <thead>
                            <tr>
                                <th>Report ID</th>
                                <th>Report</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {paginatedReports.length > 0 ? (

                                paginatedReports.map(
                                    (report) => (
                                        <tr key={report.id}>

                                            <td>
                                                <strong className="report-id">
                                                    {report.id}
                                                </strong>
                                            </td>

                                            <td>
                                                <div className="report-name">

                                                    <div className="report-icon">
                                                        <i
                                                            className={`bi ${getReportIcon(
                                                                report.type
                                                            )}`}
                                                        ></i>
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {report.title ||
                                                                "—"}
                                                        </strong>

                                                        <small>
                                                            {report.description ||
                                                                "No description"}
                                                        </small>
                                                    </div>

                                                </div>
                                            </td>

                                            <td>
                                                <span className="report-type">
                                                    {report.type ||
                                                        "—"}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="report-date">
                                                    {report.date ||
                                                        "—"}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`report-status ${getStatusClass(
                                                        report.status
                                                    )}`}
                                                >
                                                    <span className="report-status-dot"></span>

                                                    {report.status ||
                                                        "Pending"}
                                                </span>
                                            </td>

                                            <td>

                                                <div className="reports-action-buttons">

                                                    <button
                                                        type="button"
                                                        className="reports-action-button view"
                                                        title="View Report"
                                                        disabled
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="reports-action-button download"
                                                        title="Download Report"
                                                        disabled
                                                    >
                                                        <i className="bi bi-download"></i>
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>
                                    )
                                )

                            ) : (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="reports-table-empty"
                                    >

                                        <div className="reports-empty-state">

                                            <div className="reports-empty-icon">
                                                <i className="bi bi-bar-chart"></i>
                                            </div>

                                            <h4>
                                                No reports available
                                            </h4>

                                            <p>
                                                Reports and analytics
                                                will appear here once
                                                data is available.
                                            </p>

                                        </div>

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

                {/* PAGINATION */}
                <div className="reports-pagination">

                    <span>
                        {getShowingText()}
                    </span>

                    <div className="reports-pagination-buttons">

                        <button
                            type="button"
                            disabled={
                                currentPage === 1
                            }
                            onClick={() =>
                                setCurrentPage(
                                    (page) =>
                                        Math.max(
                                            page - 1,
                                            1
                                        )
                                )
                            }
                        >
                            <i className="bi bi-chevron-left"></i>
                        </button>

                        {totalPages > 0 &&
                            Array.from(
                                {
                                    length: totalPages,
                                },
                                (_, index) =>
                                    index + 1
                            ).map((page) => (
                                <button
                                    type="button"
                                    key={page}
                                    className={
                                        currentPage ===
                                            page
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        setCurrentPage(
                                            page
                                        )
                                    }
                                >
                                    {page}
                                </button>
                            ))}

                        <button
                            type="button"
                            disabled={
                                totalPages === 0 ||
                                currentPage ===
                                totalPages
                            }
                            onClick={() =>
                                setCurrentPage(
                                    (page) =>
                                        Math.min(
                                            page + 1,
                                            totalPages
                                        )
                                )
                            }
                        >
                            <i className="bi bi-chevron-right"></i>
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default ReportsAnalytics;