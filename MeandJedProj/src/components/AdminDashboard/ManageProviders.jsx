import React, { useMemo, useState } from "react";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import "./AdminDashboard.css";


function ManageProviders() {

    /* =========================================================
       STATE
    ========================================================= */

    // Backend-ready — no dummy/sample providers
    const [providers, setProviders] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");

    const [approvalFilter, setApprovalFilter] =
        useState("All");

    const [accountFilter, setAccountFilter] =
        useState("All");

    const [currentPage, setCurrentPage] =
        useState(1);

    const [selectedProvider, setSelectedProvider] =
        useState(null);

    const [modalType, setModalType] =
        useState(null);

    const itemsPerPage = 5;


    /* =========================================================
       FILTER
    ========================================================= */

    const filteredProviders = useMemo(() => {

        const search =
            searchTerm.toLowerCase().trim();

        return providers.filter((provider) => {

            const fullName =
                String(provider.fullName || "")
                    .toLowerCase();

            const email =
                String(provider.email || "")
                    .toLowerCase();

            const contact =
                String(provider.contact || "")
                    .toLowerCase();

            const serviceCategory =
                String(provider.serviceCategory || "")
                    .toLowerCase();

            const location =
                String(provider.location || "")
                    .toLowerCase();


            const matchesSearch =
                fullName.includes(search) ||
                email.includes(search) ||
                contact.includes(search) ||
                serviceCategory.includes(search) ||
                location.includes(search);


            const matchesApproval =
                approvalFilter === "All" ||
                provider.approvalStatus ===
                approvalFilter;


            const matchesAccount =
                accountFilter === "All" ||
                provider.accountStatus ===
                accountFilter;


            return (
                matchesSearch &&
                matchesApproval &&
                matchesAccount
            );

        });

    }, [
        providers,
        searchTerm,
        approvalFilter,
        accountFilter
    ]);


    /* =========================================================
       COUNTS
    ========================================================= */

    const totalProviders =
        providers.length;

    const approvedProviders =
        providers.filter(
            (provider) =>
                provider.approvalStatus ===
                "Approved"
        ).length;

    const pendingProviders =
        providers.filter(
            (provider) =>
                provider.approvalStatus ===
                "Pending"
        ).length;

    const inactiveProviders =
        providers.filter(
            (provider) =>
                provider.accountStatus ===
                "Inactive"
        ).length;


    /* =========================================================
       PAGINATION
    ========================================================= */

    const totalPages = Math.max(
        1,
        Math.ceil(
            filteredProviders.length /
            itemsPerPage
        )
    );

    const safeCurrentPage =
        Math.min(
            currentPage,
            totalPages
        );

    const startIndex =
        (safeCurrentPage - 1) *
        itemsPerPage;

    const endIndex = Math.min(
        startIndex + itemsPerPage,
        filteredProviders.length
    );

    const currentProviders =
        filteredProviders.slice(
            startIndex,
            endIndex
        );


    const pageNumbers = [];

    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {
        pageNumbers.push(page);
    }


    /* =========================================================
       SEARCH / FILTER
    ========================================================= */

    const handleSearchChange = (event) => {

        setSearchTerm(
            event.target.value
        );

        setCurrentPage(1);

    };


    const clearSearch = () => {

        setSearchTerm("");

        setCurrentPage(1);

    };


    const handleApprovalFilterChange =
        (event) => {

            setApprovalFilter(
                event.target.value
            );

            setCurrentPage(1);

        };


    const handleAccountFilterChange =
        (event) => {

            setAccountFilter(
                event.target.value
            );

            setCurrentPage(1);

        };


    const handlePageChange = (page) => {

        if (
            page < 1 ||
            page > totalPages
        ) {
            return;
        }

        setCurrentPage(page);

    };


    /* =========================================================
       VIEW
    ========================================================= */

    const handleView = (provider) => {

        setSelectedProvider(provider);

        setModalType("view");

    };


    /* =========================================================
       APPROVE
    ========================================================= */

    const handleApprove = (provider) => {

        setSelectedProvider(provider);

        setModalType("approve");

    };


    const confirmApprove = () => {

        if (!selectedProvider) {
            return;
        }

        setProviders(
            (previousProviders) =>
                previousProviders.map(
                    (provider) =>
                        provider.id ===
                            selectedProvider.id
                            ? {
                                ...provider,
                                approvalStatus:
                                    "Approved",
                                accountStatus:
                                    "Active",
                            }
                            : provider
                )
        );

        closeModal();

    };


    /* =========================================================
       REJECT
    ========================================================= */

    const handleReject = (provider) => {

        setSelectedProvider(provider);

        setModalType("reject");

    };


    const confirmReject = () => {

        if (!selectedProvider) {
            return;
        }

        setProviders(
            (previousProviders) =>
                previousProviders.map(
                    (provider) =>
                        provider.id ===
                            selectedProvider.id
                            ? {
                                ...provider,
                                approvalStatus:
                                    "Rejected",
                                accountStatus:
                                    "Inactive",
                            }
                            : provider
                )
        );

        closeModal();

    };


    /* =========================================================
       BLOCK / UNBLOCK
    ========================================================= */

    const handleBlock = (provider) => {

        setSelectedProvider(provider);

        setModalType(
            provider.accountStatus ===
                "Active"
                ? "block"
                : "unblock"
        );

    };


    const confirmBlock = () => {

        if (!selectedProvider) {
            return;
        }

        const newStatus =
            selectedProvider.accountStatus ===
                "Active"
                ? "Inactive"
                : "Active";


        setProviders(
            (previousProviders) =>
                previousProviders.map(
                    (provider) =>
                        provider.id ===
                            selectedProvider.id
                            ? {
                                ...provider,
                                accountStatus:
                                    newStatus,
                            }
                            : provider
                )
        );

        closeModal();

    };


    /* =========================================================
       DELETE
    ========================================================= */

    const handleDelete = (provider) => {

        setSelectedProvider(provider);

        setModalType("delete");

    };


    const confirmDelete = () => {

        if (!selectedProvider) {
            return;
        }

        setProviders(
            (previousProviders) =>
                previousProviders.filter(
                    (provider) =>
                        provider.id !==
                        selectedProvider.id
                )
        );

        closeModal();

    };


    /* =========================================================
       CLOSE MODAL
    ========================================================= */

    const closeModal = () => {

        setSelectedProvider(null);

        setModalType(null);

    };


    /* =========================================================
       RENDER
    ========================================================= */

    return (

        <div className="providers-management">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="providers-page-header">

                <div>

                    <span className="providers-section-label">
                        PROVIDER MANAGEMENT
                    </span>

                    <h2>
                        Manage Service Providers
                    </h2>

                    <p>
                        Review, approve, and manage registered
                        service provider accounts.
                    </p>

                </div>


                <div className="providers-total-card">

                    <div className="providers-total-icon">

                        <i className="bi bi-person-badge-fill"></i>

                    </div>

                    <div>

                        <span>
                            Total Providers
                        </span>

                        <strong>
                            {totalProviders}
                        </strong>

                    </div>

                </div>

            </div>


            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <div className="providers-summary-grid">


                <div className="providers-summary-card">

                    <div className="providers-summary-icon green">

                        <i className="bi bi-people-fill"></i>

                    </div>

                    <div>

                        <span>
                            Total Providers
                        </span>

                        <strong>
                            {totalProviders}
                        </strong>

                        <small>
                            Registered accounts
                        </small>

                    </div>

                </div>


                <div className="providers-summary-card">

                    <div className="providers-summary-icon green">

                        <i className="bi bi-check-circle-fill"></i>

                    </div>

                    <div>

                        <span>
                            Approved
                        </span>

                        <strong>
                            {approvedProviders}
                        </strong>

                        <small>
                            Approved providers
                        </small>

                    </div>

                </div>


                <div className="providers-summary-card">

                    <div className="providers-summary-icon orange">

                        <i className="bi bi-hourglass-split"></i>

                    </div>

                    <div>

                        <span>
                            Pending
                        </span>

                        <strong>
                            {pendingProviders}
                        </strong>

                        <small>
                            Awaiting approval
                        </small>

                    </div>

                </div>


                <div className="providers-summary-card">

                    <div className="providers-summary-icon red">

                        <i className="bi bi-person-x-fill"></i>

                    </div>

                    <div>

                        <span>
                            Inactive
                        </span>

                        <strong>
                            {inactiveProviders}
                        </strong>

                        <small>
                            Inactive accounts
                        </small>

                    </div>

                </div>

            </div>


            {/* =================================================
                FILTER CARD
            ================================================= */}

            <div className="providers-filter-card">

                <div className="providers-filter-title">

                    <div className="providers-filter-icon">

                        <i className="bi bi-sliders"></i>

                    </div>

                    <div>

                        <strong>
                            Find Service Providers
                        </strong>

                        <span>
                            Search and filter provider accounts
                        </span>

                    </div>

                </div>


                <div className="providers-filter-controls">


                    {/* SEARCH */}

                    <div className="providers-search">

                        <i className="bi bi-search"></i>

                        <input
                            type="search"
                            value={searchTerm}
                            onChange={
                                handleSearchChange
                            }
                            placeholder="Search provider, service, location..."
                        />

                        {searchTerm && (

                            <button
                                type="button"
                                onClick={
                                    clearSearch
                                }
                                className="providers-clear-search"
                            >

                                <i className="bi bi-x"></i>

                            </button>

                        )}

                    </div>


                    {/* APPROVAL */}

                    <div className="providers-filter-select">

                        <label>
                            Approval
                        </label>

                        <div>

                            <i className="bi bi-shield-check"></i>

                            <select
                                value={
                                    approvalFilter
                                }
                                onChange={
                                    handleApprovalFilterChange
                                }
                            >

                                <option value="All">
                                    All Approval
                                </option>

                                <option value="Approved">
                                    Approved
                                </option>

                                <option value="Pending">
                                    Pending
                                </option>

                                <option value="Rejected">
                                    Rejected
                                </option>

                            </select>

                        </div>

                    </div>


                    {/* ACCOUNT */}

                    <div className="providers-filter-select">

                        <label>
                            Account
                        </label>

                        <div>

                            <i className="bi bi-person-check"></i>

                            <select
                                value={
                                    accountFilter
                                }
                                onChange={
                                    handleAccountFilterChange
                                }
                            >

                                <option value="All">
                                    All Accounts
                                </option>

                                <option value="Active">
                                    Active
                                </option>

                                <option value="Inactive">
                                    Inactive
                                </option>

                            </select>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                TABLE
            ================================================= */}

            <div className="providers-table-card">


                <div className="providers-table-header">

                    <div>

                        <span>
                            SERVICE PROVIDER ACCOUNTS
                        </span>

                        <h3>
                            Registered Service Providers
                        </h3>

                        <p>
                            Review provider information and
                            account status.
                        </p>

                    </div>


                    <div className="providers-result-count">

                        <i className="bi bi-person-lines-fill"></i>

                        <strong>
                            {filteredProviders.length}
                        </strong>

                        <span>
                            {filteredProviders.length === 1
                                ? "provider"
                                : "providers"}
                        </span>

                    </div>

                </div>


                <div className="providers-table-wrapper">

                    <table className="providers-table">

                        <thead>

                            <tr>

                                <th>
                                    Provider
                                </th>

                                <th>
                                    Service
                                </th>

                                <th>
                                    Contact
                                </th>

                                <th>
                                    Location
                                </th>

                                <th>
                                    Experience
                                </th>

                                <th>
                                    Approval
                                </th>

                                <th>
                                    Account
                                </th>

                                <th>
                                    Actions
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {currentProviders.length > 0 ? (

                                currentProviders.map(
                                    (provider) => (

                                        <tr
                                            key={
                                                provider.id
                                            }
                                        >

                                            {/* PROVIDER */}

                                            <td>

                                                <div className="provider-user">

                                                    <div className="provider-avatar">

                                                        <i className="bi bi-person-badge-fill"></i>

                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {
                                                                provider.fullName ||
                                                                "—"
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                provider.email ||
                                                                "—"
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* SERVICE */}

                                            <td>

                                                <span className="provider-service">

                                                    <i className="bi bi-tools"></i>

                                                    {
                                                        provider.serviceCategory ||
                                                        "—"
                                                    }

                                                </span>

                                            </td>


                                            {/* CONTACT */}

                                            <td>

                                                <span className="provider-contact">

                                                    <i className="bi bi-telephone-fill"></i>

                                                    {
                                                        provider.contact ||
                                                        "—"
                                                    }

                                                </span>

                                            </td>


                                            {/* LOCATION */}

                                            <td>

                                                <span className="provider-location">

                                                    <i className="bi bi-geo-alt-fill"></i>

                                                    {
                                                        provider.location ||
                                                        "—"
                                                    }

                                                </span>

                                            </td>


                                            {/* EXPERIENCE */}

                                            <td>

                                                <strong className="provider-experience">

                                                    {
                                                        provider.experience ??
                                                        "—"
                                                    }

                                                    {provider.experience !==
                                                        undefined &&
                                                        (
                                                            provider.experience ===
                                                                1
                                                                ? " year"
                                                                : " years"
                                                        )}

                                                </strong>

                                            </td>


                                            {/* APPROVAL */}

                                            <td>

                                                <span
                                                    className={`provider-approval ${provider.approvalStatus
                                                        ?.toLowerCase() ||
                                                        ""
                                                        }`}
                                                >

                                                    <span className="status-dot"></span>

                                                    {
                                                        provider.approvalStatus ||
                                                        "—"
                                                    }

                                                </span>

                                            </td>


                                            {/* ACCOUNT */}

                                            <td>

                                                <span
                                                    className={`provider-account ${provider.accountStatus
                                                        ?.toLowerCase() ||
                                                        ""
                                                        }`}
                                                >

                                                    <span className="status-dot"></span>

                                                    {
                                                        provider.accountStatus ||
                                                        "—"
                                                    }

                                                </span>

                                            </td>


                                            {/* ACTIONS */}

                                            <td>

                                                <div className="provider-actions">


                                                    <button
                                                        type="button"
                                                        className="provider-action view"
                                                        onClick={() =>
                                                            handleView(
                                                                provider
                                                            )
                                                        }
                                                        title="View"
                                                    >

                                                        <i className="bi bi-eye"></i>

                                                    </button>


                                                    {provider.approvalStatus ===
                                                        "Pending" && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="provider-action approve"
                                                                    onClick={() =>
                                                                        handleApprove(
                                                                            provider
                                                                        )
                                                                    }
                                                                    title="Approve"
                                                                >

                                                                    <i className="bi bi-check-lg"></i>

                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className="provider-action reject"
                                                                    onClick={() =>
                                                                        handleReject(
                                                                            provider
                                                                        )
                                                                    }
                                                                    title="Reject"
                                                                >

                                                                    <i className="bi bi-x-lg"></i>

                                                                </button>
                                                            </>
                                                        )}


                                                    <button
                                                        type="button"
                                                        className="provider-action block"
                                                        onClick={() =>
                                                            handleBlock(
                                                                provider
                                                            )
                                                        }
                                                        title={
                                                            provider.accountStatus ===
                                                                "Active"
                                                                ? "Block"
                                                                : "Unblock"
                                                        }
                                                    >

                                                        <i
                                                            className={`bi ${provider.accountStatus ===
                                                                "Active"
                                                                ? "bi-person-lock"
                                                                : "bi-person-check"
                                                                }`}
                                                        ></i>

                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="provider-action delete"
                                                        onClick={() =>
                                                            handleDelete(
                                                                provider
                                                            )
                                                        }
                                                        title="Delete"
                                                    >

                                                        <i className="bi bi-trash3"></i>

                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )

                            ) : (

                                <tr>

                                    <td
                                        colSpan="8"
                                        className="providers-empty-cell"
                                    >

                                        <div className="providers-empty-state">

                                            <div className="providers-empty-icon">

                                                <i className="bi bi-person-badge"></i>

                                            </div>

                                            <h4>
                                                No service providers found
                                            </h4>

                                            <p>
                                                {searchTerm ||
                                                    approvalFilter !== "All" ||
                                                    accountFilter !== "All"

                                                    ? "Try changing your search or filter options."

                                                    : "Registered service providers will appear here once provider data is available."
                                                }
                                            </p>

                                        </div>

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>


                {/* PAGINATION */}

                <div className="providers-pagination">

                    <div className="providers-pagination-info">

                        {filteredProviders.length > 0 ? (

                            <>
                                Showing{" "}

                                <strong>
                                    {startIndex + 1}
                                </strong>{" "}

                                to{" "}

                                <strong>
                                    {endIndex}
                                </strong>{" "}

                                of{" "}

                                <strong>
                                    {filteredProviders.length}
                                </strong>
                            </>

                        ) : (

                            "Showing 0 to 0 of 0"

                        )}

                    </div>


                    <div className="providers-pagination-controls">

                        <button
                            type="button"
                            className="providers-pagination-button"
                            disabled={
                                safeCurrentPage === 1
                            }
                            onClick={() =>
                                handlePageChange(
                                    safeCurrentPage - 1
                                )
                            }
                        >

                            <i className="bi bi-chevron-left"></i>

                            Previous

                        </button>


                        {pageNumbers.map(
                            (page) => (

                                <button
                                    type="button"
                                    key={page}
                                    className={`providers-page-number ${safeCurrentPage ===
                                        page
                                        ? "active"
                                        : ""
                                        }`}
                                    onClick={() =>
                                        handlePageChange(
                                            page
                                        )
                                    }
                                >

                                    {page}

                                </button>

                            )
                        )}


                        <button
                            type="button"
                            className="providers-pagination-button"
                            disabled={
                                safeCurrentPage ===
                                totalPages
                            }
                            onClick={() =>
                                handlePageChange(
                                    safeCurrentPage + 1
                                )
                            }
                        >

                            Next

                            <i className="bi bi-chevron-right"></i>

                        </button>

                    </div>

                </div>

            </div>


            {/* =================================================
                VIEW MODAL
            ================================================= */}

            {modalType === "view" &&
                selectedProvider && (

                    <div
                        className="providers-modal-overlay"
                        onMouseDown={(event) => {

                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeModal();
                            }

                        }}
                    >

                        <div className="providers-modal">

                            <div className="providers-modal-header">

                                <div>

                                    <span>
                                        SERVICE PROVIDER
                                    </span>

                                    <h3>
                                        Provider Details
                                    </h3>

                                </div>

                                <button
                                    type="button"
                                    className="providers-modal-close"
                                    onClick={
                                        closeModal
                                    }
                                >

                                    <i className="bi bi-x-lg"></i>

                                </button>

                            </div>


                            <div className="providers-modal-profile">

                                <div className="providers-modal-avatar">

                                    <i className="bi bi-person-badge-fill"></i>

                                </div>

                                <div>

                                    <h4>
                                        {
                                            selectedProvider.fullName ||
                                            "Service Provider"
                                        }
                                    </h4>

                                    <div className="providers-modal-statuses">

                                        <span
                                            className={`provider-approval ${selectedProvider.approvalStatus
                                                ?.toLowerCase() ||
                                                ""
                                                }`}
                                        >

                                            <span className="status-dot"></span>

                                            {
                                                selectedProvider.approvalStatus ||
                                                "—"
                                            }

                                        </span>


                                        <span
                                            className={`provider-account ${selectedProvider.accountStatus
                                                ?.toLowerCase() ||
                                                ""
                                                }`}
                                        >

                                            <span className="status-dot"></span>

                                            {
                                                selectedProvider.accountStatus ||
                                                "—"
                                            }

                                        </span>

                                    </div>

                                </div>

                            </div>


                            <div className="providers-detail-grid">

                                <div>

                                    <span>
                                        Full Name
                                    </span>

                                    <strong>
                                        {
                                            selectedProvider.fullName ||
                                            "—"
                                        }
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        Email
                                    </span>

                                    <strong>
                                        {
                                            selectedProvider.email ||
                                            "—"
                                        }
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        Contact
                                    </span>

                                    <strong>
                                        {
                                            selectedProvider.contact ||
                                            "—"
                                        }
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        Service Category
                                    </span>

                                    <strong>
                                        {
                                            selectedProvider.serviceCategory ||
                                            "—"
                                        }
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        Location
                                    </span>

                                    <strong>
                                        {
                                            selectedProvider.location ||
                                            "—"
                                        }
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        Years of Experience
                                    </span>

                                    <strong>

                                        {
                                            selectedProvider.experience ??
                                            "—"
                                        }

                                        {selectedProvider.experience !==
                                            undefined &&
                                            (
                                                selectedProvider.experience ===
                                                    1
                                                    ? " year"
                                                    : " years"
                                            )}

                                    </strong>

                                </div>

                            </div>


                            <div className="providers-modal-footer">

                                <button
                                    type="button"
                                    className="providers-secondary-button"
                                    onClick={
                                        closeModal
                                    }
                                >
                                    Close
                                </button>


                                {selectedProvider.approvalStatus ===
                                    "Pending" && (
                                        <>

                                            <button
                                                type="button"
                                                className="providers-danger-button"
                                                onClick={() =>
                                                    handleReject(
                                                        selectedProvider
                                                    )
                                                }
                                            >
                                                Reject
                                            </button>

                                            <button
                                                type="button"
                                                className="providers-primary-button"
                                                onClick={() =>
                                                    handleApprove(
                                                        selectedProvider
                                                    )
                                                }
                                            >

                                                <i className="bi bi-check-lg"></i>

                                                Approve

                                            </button>

                                        </>
                                    )}

                            </div>

                        </div>

                    </div>

                )
            }


            {/* =================================================
                APPROVE MODAL
            ================================================= */}

            {modalType === "approve" &&
                selectedProvider && (

                    <div
                        className="providers-modal-overlay"
                        onMouseDown={(event) => {

                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeModal();
                            }

                        }}
                    >

                        <div className="providers-confirm-modal">

                            <div className="providers-confirm-icon success">

                                <i className="bi bi-check-circle"></i>

                            </div>

                            <h3>
                                Approve Provider?
                            </h3>

                            <p>

                                Are you sure you want to approve{" "}

                                <strong>
                                    {
                                        selectedProvider.fullName ||
                                        "this provider"
                                    }
                                </strong>
                                ?

                            </p>

                            <div className="providers-confirm-actions">

                                <button
                                    type="button"
                                    className="providers-secondary-button"
                                    onClick={
                                        closeModal
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="providers-primary-button"
                                    onClick={
                                        confirmApprove
                                    }
                                >
                                    Approve Provider
                                </button>

                            </div>

                        </div>

                    </div>

                )
            }


            {/* =================================================
                REJECT MODAL
            ================================================= */}

            {modalType === "reject" &&
                selectedProvider && (

                    <div
                        className="providers-modal-overlay"
                        onMouseDown={(event) => {

                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeModal();
                            }

                        }}
                    >

                        <div className="providers-confirm-modal">

                            <div className="providers-confirm-icon warning">

                                <i className="bi bi-x-circle"></i>

                            </div>

                            <h3>
                                Reject Provider?
                            </h3>

                            <p>

                                Are you sure you want to reject{" "}

                                <strong>
                                    {
                                        selectedProvider.fullName ||
                                        "this provider"
                                    }
                                </strong>
                                ?

                            </p>

                            <div className="providers-confirm-actions">

                                <button
                                    type="button"
                                    className="providers-secondary-button"
                                    onClick={
                                        closeModal
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="providers-danger-button"
                                    onClick={
                                        confirmReject
                                    }
                                >
                                    Reject Provider
                                </button>

                            </div>

                        </div>

                    </div>

                )
            }


            {/* =================================================
                BLOCK / UNBLOCK
            ================================================= */}

            {(modalType === "block" ||
                modalType === "unblock") &&
                selectedProvider && (

                    <div
                        className="providers-modal-overlay"
                        onMouseDown={(event) => {

                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeModal();
                            }

                        }}
                    >

                        <div className="providers-confirm-modal">

                            <div
                                className={`providers-confirm-icon ${modalType === "block"
                                    ? "warning"
                                    : "success"
                                    }`}
                            >

                                <i
                                    className={`bi ${modalType === "block"
                                        ? "bi-person-lock"
                                        : "bi-person-check"
                                        }`}
                                ></i>

                            </div>

                            <h3>

                                {modalType === "block"
                                    ? "Block Provider?"
                                    : "Unblock Provider?"}

                            </h3>

                            <p>

                                {modalType === "block"

                                    ? `Are you sure you want to block ${selectedProvider.fullName || "this provider"}'s account?`

                                    : `Are you sure you want to unblock ${selectedProvider.fullName || "this provider"}'s account?`}

                            </p>

                            <div className="providers-confirm-actions">

                                <button
                                    type="button"
                                    className="providers-secondary-button"
                                    onClick={
                                        closeModal
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className={
                                        modalType === "block"
                                            ? "providers-danger-button"
                                            : "providers-primary-button"
                                    }
                                    onClick={
                                        confirmBlock
                                    }
                                >

                                    {modalType === "block"
                                        ? "Block Account"
                                        : "Unblock Account"}

                                </button>

                            </div>

                        </div>

                    </div>

                )
            }


            {/* =================================================
                DELETE
            ================================================= */}

            {modalType === "delete" &&
                selectedProvider && (

                    <div
                        className="providers-modal-overlay"
                        onMouseDown={(event) => {

                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeModal();
                            }

                        }}
                    >

                        <div className="providers-confirm-modal">

                            <div className="providers-confirm-icon danger">

                                <i className="bi bi-trash3"></i>

                            </div>

                            <h3>
                                Delete Provider?
                            </h3>

                            <p>

                                Are you sure you want to delete{" "}

                                <strong>
                                    {
                                        selectedProvider.fullName ||
                                        "this provider"
                                    }
                                </strong>

                                ? This action cannot be undone.

                            </p>

                            <div className="providers-confirm-actions">

                                <button
                                    type="button"
                                    className="providers-secondary-button"
                                    onClick={
                                        closeModal
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="providers-danger-button"
                                    onClick={
                                        confirmDelete
                                    }
                                >

                                    <i className="bi bi-trash3"></i>

                                    Delete Account

                                </button>

                            </div>

                        </div>

                    </div>

                )
            }

        </div>

    );
}


export default ManageProviders;