import { useEffect, useState } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';

import 'bootstrap-icons/font/bootstrap-icons.css';

import "./AdminDashboard.css";
import { getAdminHomeowners } from "../../services/api";
import CreateAccountModal from "./CreateAccountModal";

function ManageHomeowners() {
    // =====================================================
    // STATE
    // =====================================================

    const [homeowners, setHomeowners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);

    const [selectedHomeowner, setSelectedHomeowner] = useState(null);
    const [modalType, setModalType] = useState(null);

    const [editForm, setEditForm] = useState({
        fullName: "",
        email: "",
        contact: "",
        location: "",
    });

    const itemsPerPage = 5;
    const activeHomeowners = homeowners.filter(
        (homeowner) => homeowner.status === "Active"
    ).length;
    const inactiveHomeowners = homeowners.length - activeHomeowners;

    useEffect(() => {
        let active = true;

        getAdminHomeowners()
            .then((data) => {
                if (active) {
                    setHomeowners(data.map((homeowner) => ({
                        ...homeowner,
                        contact: homeowner.contact || "—",
                        location: homeowner.location || "—",
                        status: homeowner.status || "Inactive",
                    })));
                }
            })
            .catch((error) => {
                if (active) setLoadError(error.message || "Unable to load homeowners.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    // =====================================================
    // FILTER
    // =====================================================

    const filteredHomeowners = homeowners.filter((homeowner) => {
        const search = searchTerm.toLowerCase().trim();

        const matchesSearch =
            String(homeowner.fullName || "").toLowerCase().includes(search) ||
            String(homeowner.email || "").toLowerCase().includes(search) ||
            String(homeowner.contact || "").toLowerCase().includes(search) ||
            String(homeowner.location || "").toLowerCase().includes(search);

        const matchesStatus =
            statusFilter === "All" ||
            homeowner.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // =====================================================
    // PAGINATION
    // =====================================================

    const totalPages = Math.max(
        1,
        Math.ceil(filteredHomeowners.length / itemsPerPage)
    );

    const safeCurrentPage = Math.min(currentPage, totalPages);

    const startIndex =
        (safeCurrentPage - 1) * itemsPerPage;

    const endIndex = Math.min(
        startIndex + itemsPerPage,
        filteredHomeowners.length
    );

    const currentHomeowners = filteredHomeowners.slice(
        startIndex,
        endIndex
    );

    // =====================================================
    // PAGE CHANGE
    // =====================================================

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) {
            return;
        }

        setCurrentPage(page);
    };

    // =====================================================
    // SEARCH
    // =====================================================

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    };

    // =====================================================
    // STATUS FILTER
    // =====================================================

    const handleStatusChange = (event) => {
        setStatusFilter(event.target.value);
        setCurrentPage(1);
    };

    // =====================================================
    // VIEW
    // =====================================================

    const handleView = (homeowner) => {
        setSelectedHomeowner(homeowner);
        setModalType("view");
    };

    // =====================================================
    // EDIT
    // =====================================================

    const handleEdit = (homeowner) => {
        setSelectedHomeowner(homeowner);

        setEditForm({
            fullName: homeowner.fullName,
            email: homeowner.email,
            contact: homeowner.contact,
            location: homeowner.location,
        });

        setModalType("edit");
    };

    // =====================================================
    // SAVE EDIT
    // =====================================================

    const handleSaveEdit = (event) => {
        event.preventDefault();

        if (!selectedHomeowner) {
            return;
        }

        setHomeowners((previous) =>
            previous.map((homeowner) =>
                homeowner.id === selectedHomeowner.id
                    ? {
                        ...homeowner,
                        fullName: editForm.fullName,
                        email: editForm.email,
                        contact: editForm.contact,
                        location: editForm.location,
                    }
                    : homeowner
            )
        );

        closeModal();
    };

    // =====================================================
    // BLOCK / UNBLOCK
    // =====================================================

    const handleBlock = (homeowner) => {
        setSelectedHomeowner(homeowner);
        setModalType(
            homeowner.status === "Active"
                ? "block"
                : "unblock"
        );
    };

    const confirmBlock = () => {
        if (!selectedHomeowner) {
            return;
        }

        const newStatus =
            selectedHomeowner.status === "Active"
                ? "Inactive"
                : "Active";

        setHomeowners((previous) =>
            previous.map((homeowner) =>
                homeowner.id === selectedHomeowner.id
                    ? {
                        ...homeowner,
                        status: newStatus,
                    }
                    : homeowner
            )
        );

        closeModal();
    };

    // =====================================================
    // DELETE
    // =====================================================

    const handleDelete = (homeowner) => {
        setSelectedHomeowner(homeowner);
        setModalType("delete");
    };

    const confirmDelete = () => {
        if (!selectedHomeowner) {
            return;
        }

        setHomeowners((previous) =>
            previous.filter(
                (homeowner) =>
                    homeowner.id !== selectedHomeowner.id
            )
        );

        closeModal();

        // Make sure page does not go beyond available pages.
        setCurrentPage((page) =>
            Math.min(
                page,
                Math.max(
                    1,
                    Math.ceil(
                        (filteredHomeowners.length - 1) /
                        itemsPerPage
                    )
                )
            )
        );
    };

    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const closeModal = () => {
        setSelectedHomeowner(null);
        setModalType(null);

        setEditForm({
            fullName: "",
            email: "",
            contact: "",
            location: "",
        });
    };

    // =====================================================
    // PAGE NUMBERS
    // =====================================================

    const pageNumbers = [];

    for (let page = 1; page <= totalPages; page++) {
        pageNumbers.push(page);
    }

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="admin-management-page container-fluid px-0">

            {/* =================================================
                        PAGE HEADER
            ================================================== */}

            <div className="admin-management-header card border-0 shadow-sm">

                <div>
                    <span className="admin-section-label">
                        USER MANAGEMENT
                    </span>

                    <h2>Manage Homeowners</h2>

                    <p>
                        View and manage registered homeowner accounts.
                    </p>
                </div>

                <div className="d-flex align-items-center gap-3 flex-wrap">
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <i className="bi bi-person-plus-fill me-2"></i>
                        Add Homeowner
                    </button>

                    <div className="admin-management-total">

                        <i className="bi bi-people-fill"></i>

                        <div>
                            <span>Total Homeowners</span>
                            <strong>{homeowners.length}</strong>
                        </div>

                    </div>
                </div>

            </div>

            <div className="row g-3 admin-homeowner-summary">
                <div className="col-12 col-sm-6 col-xl-4">
                    <div className="card h-100">
                        <div className="card-body d-flex align-items-center gap-3">
                            <span className="admin-homeowner-summary-icon total">
                                <i className="bi bi-people-fill"></i>
                            </span>
                            <div>
                                <span className="admin-homeowner-summary-label">Total homeowners</span>
                                <strong className="admin-homeowner-summary-value">{homeowners.length}</strong>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-4">
                    <div className="card h-100">
                        <div className="card-body d-flex align-items-center gap-3">
                            <span className="admin-homeowner-summary-icon active">
                                <i className="bi bi-person-check-fill"></i>
                            </span>
                            <div>
                                <span className="admin-homeowner-summary-label">Active accounts</span>
                                <strong className="admin-homeowner-summary-value">{activeHomeowners}</strong>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-4">
                    <div className="card h-100">
                        <div className="card-body d-flex align-items-center gap-3">
                            <span className="admin-homeowner-summary-icon inactive">
                                <i className="bi bi-person-lock"></i>
                            </span>
                            <div>
                                <span className="admin-homeowner-summary-label">Inactive accounts</span>
                                <strong className="admin-homeowner-summary-value">{inactiveHomeowners}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* =================================================
                        TOOLBAR
            ================================================== */}

            <div className="admin-management-toolbar card">

                {/* Search */}
                <div className="admin-search-box">

                    <i className="bi bi-search"></i>

                    <input
                        type="search"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search homeowner..."
                    />

                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm("");
                                setCurrentPage(1);
                            }}
                            aria-label="Clear search"
                        >
                            <i className="bi bi-x"></i>
                        </button>
                    )}

                </div>

                {/* Status Filter */}
                <div className="admin-filter-box">

                    <i className="bi bi-funnel"></i>

                    <select
                        value={statusFilter}
                        onChange={handleStatusChange}
                    >
                        <option value="All">
                            All Status
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

            {/* =================================================
                        TABLE
            ================================================== */}

            <div className="admin-management-card card">

                <div className="admin-management-card-header">

                    <div>
                        <h3>Homeowner Accounts</h3>

                        <p>
                            Registered customers in the SmartHome system
                        </p>
                    </div>

                    <span className="admin-result-count">
                        {filteredHomeowners.length}{" "}
                        {filteredHomeowners.length === 1
                            ? "account"
                            : "accounts"}
                    </span>

                </div>

                <div className="admin-table-container table-responsive">

                    <table className="admin-management-table table table-hover align-middle mb-0">

                        <thead>
                            <tr>
                                <th>Full Name</th>
                                <th>Contact</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-4">Loading homeowners...</td>
                                </tr>
                            ) : loadError ? (
                                <tr>
                                    <td colSpan="5" className="text-center text-danger py-4">{loadError}</td>
                                </tr>
                            ) : currentHomeowners.length > 0 ? (

                                currentHomeowners.map(
                                    (homeowner) => (
                                        <tr key={homeowner.id}>

                                            {/* Full Name */}
                                            <td>
                                                <div className="admin-user-cell">

                                                    <div className="admin-user-avatar">
                                                        <i className="bi bi-person-fill"></i>
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {homeowner.fullName}
                                                        </strong>

                                                        <span>
                                                            {homeowner.email}
                                                        </span>
                                                    </div>

                                                </div>
                                            </td>

                                            {/* Contact */}
                                            <td>
                                                <span className="admin-contact-text">
                                                    {homeowner.contact}
                                                </span>
                                            </td>

                                            {/* Location */}
                                            <td>
                                                <span className="admin-location-text">
                                                    <i className="bi bi-geo-alt"></i>
                                                    {homeowner.location}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td>
                                                <span
                                                    className={`admin-account-status ${homeowner.status.toLowerCase()
                                                        }`}
                                                >
                                                    <span></span>
                                                    {homeowner.status}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td>

                                                <div className="admin-table-actions">

                                                    {/* View */}
                                                    <button
                                                        type="button"
                                                        className="admin-action-button view"
                                                        onClick={() =>
                                                            handleView(
                                                                homeowner
                                                            )
                                                        }
                                                        title="View"
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </button>

                                                    {/* Edit */}
                                                    <button
                                                        type="button"
                                                        className="admin-action-button edit"
                                                        onClick={() =>
                                                            handleEdit(
                                                                homeowner
                                                            )
                                                        }
                                                        title="Edit"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>

                                                    {/* Block / Unblock */}
                                                    <button
                                                        type="button"
                                                        className="admin-action-button block"
                                                        onClick={() =>
                                                            handleBlock(
                                                                homeowner
                                                            )
                                                        }
                                                        title={
                                                            homeowner.status ===
                                                                "Active"
                                                                ? "Block"
                                                                : "Unblock"
                                                        }
                                                    >
                                                        <i
                                                            className={`bi ${homeowner.status ===
                                                                "Active"
                                                                ? "bi-person-lock"
                                                                : "bi-person-check"
                                                                }`}
                                                        ></i>
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        type="button"
                                                        className="admin-action-button delete"
                                                        onClick={() =>
                                                            handleDelete(
                                                                homeowner
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
                                        colSpan="5"
                                        className="admin-table-no-results"
                                    >

                                        <div>
                                            <i className="bi bi-person-x"></i>

                                            <strong>
                                                No homeowners found
                                            </strong>

                                            <span>
                                                Try changing your search
                                                or status filter.
                                            </span>
                                        </div>

                                    </td>
                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

                {/* =================================================
                            PAGINATION
                ================================================== */}

                <div className="admin-pagination">

                    <div className="admin-pagination-info">

                        {filteredHomeowners.length > 0 ? (
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
                                    {filteredHomeowners.length}
                                </strong>
                            </>
                        ) : (
                            "Showing 0 to 0 of 0"
                        )}

                        {showCreateModal && (
                        <CreateAccountModal
                            role="homeowner"
                            onClose={() => setShowCreateModal(false)}
                            onCreated={async () => {
                                const data = await getAdminHomeowners();
                                setHomeowners(data.map((homeowner) => ({
                                    ...homeowner,
                                    contact: homeowner.contact || "—",
                                    location: homeowner.location || "—",
                                    status: homeowner.status || "Inactive",
                                })));
                                setLoadError("");
                            }}
                        />
                        )}

                    </div>

                    <div className="admin-pagination-controls">

                        {/* Previous */}
                        <button
                            type="button"
                            className="admin-pagination-button"
                            disabled={safeCurrentPage === 1}
                            onClick={() =>
                                handlePageChange(
                                    safeCurrentPage - 1
                                )
                            }
                        >
                            <i className="bi bi-chevron-left"></i>
                            Previous
                        </button>

                        {/* Page Numbers */}
                        {pageNumbers.map((page) => (
                            <button
                                type="button"
                                key={page}
                                className={`admin-page-number ${safeCurrentPage === page
                                    ? "active"
                                    : ""
                                    }`}
                                onClick={() =>
                                    handlePageChange(page)
                                }
                            >
                                {page}
                            </button>
                        ))}

                        {/* Next */}
                        <button
                            type="button"
                            className="admin-pagination-button"
                            disabled={
                                safeCurrentPage === totalPages
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
            ================================================== */}

            {modalType === "view" &&
                selectedHomeowner && (
                    <div
                        className="admin-modal-overlay"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeModal();
                            }
                        }}
                    >

                        <div className="admin-modal homeowner-detail-modal">

                            <div className="admin-modal-header">

                                <div>
                                    <span>
                                        HOMEOWNER ACCOUNT
                                    </span>

                                    <h3>
                                        Homeowner Details
                                    </h3>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    aria-label="Close"
                                >
                                    <i className="bi bi-x-lg"></i>
                                </button>

                            </div>

                            <div className="homeowner-detail-profile">

                                <div className="homeowner-detail-avatar">
                                    <i className="bi bi-person-fill"></i>
                                </div>

                                <div className="homeowner-detail-identity">
                                    <h4>
                                        {selectedHomeowner.fullName}
                                    </h4>

                                    <span
                                        className={`admin-account-status ${selectedHomeowner.status.toLowerCase()
                                            }`}
                                    >
                                        <span></span>
                                        {selectedHomeowner.status}
                                    </span>
                                </div>

                            </div>

                            <div className="homeowner-detail-grid">

                                <div className="homeowner-detail-item">
                                    <i className="bi bi-person"></i>
                                    <div>
                                        <span>Full Name</span>
                                        <strong>{selectedHomeowner.fullName}</strong>
                                    </div>
                                </div>

                                <div className="homeowner-detail-item">
                                    <i className="bi bi-envelope"></i>
                                    <div>
                                        <span>Email address</span>
                                        <strong>{selectedHomeowner.email}</strong>
                                    </div>
                                </div>

                                <div className="homeowner-detail-item">
                                    <i className="bi bi-telephone"></i>
                                    <div>
                                        <span>Contact number</span>
                                        <strong>{selectedHomeowner.contact}</strong>
                                    </div>
                                </div>

                                <div className="homeowner-detail-item">
                                    <i className="bi bi-geo-alt"></i>
                                    <div>
                                        <span>Location</span>
                                        <strong>{selectedHomeowner.location}</strong>
                                    </div>
                                </div>

                            </div>

                            <div className="admin-modal-footer">

                                <button
                                    type="button"
                                    className="admin-modal-secondary-button"
                                    onClick={closeModal}
                                >
                                    Close
                                </button>

                                <button
                                    type="button"
                                    className="admin-modal-primary-button"
                                    onClick={() =>
                                        handleEdit(
                                            selectedHomeowner
                                        )
                                    }
                                >
                                    <i className="bi bi-pencil"></i>
                                    Edit Account
                                </button>

                            </div>

                        </div>

                    </div>
                )}

            {/* =================================================
                        EDIT MODAL
            ================================================== */}

            {modalType === "edit" &&
                selectedHomeowner && (
                    <div
                        className="admin-modal-overlay"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeModal();
                            }
                        }}
                    >

                        <form
                            className="admin-modal"
                            onSubmit={handleSaveEdit}
                        >

                            <div className="admin-modal-header">

                                <div>
                                    <span>
                                        ACCOUNT MANAGEMENT
                                    </span>

                                    <h3>
                                        Edit Homeowner
                                    </h3>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    aria-label="Close"
                                >
                                    <i className="bi bi-x-lg"></i>
                                </button>

                            </div>

                            <div className="admin-form-grid">

                                <div className="admin-form-group full">
                                    <label>
                                        Full Name
                                    </label>

                                    <input
                                        type="text"
                                        value={editForm.fullName}
                                        onChange={(event) =>
                                            setEditForm({
                                                ...editForm,
                                                fullName:
                                                    event.target
                                                        .value,
                                            })
                                        }
                                        required
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <label>
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(event) =>
                                            setEditForm({
                                                ...editForm,
                                                email:
                                                    event.target
                                                        .value,
                                            })
                                        }
                                        required
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <label>
                                        Contact
                                    </label>

                                    <input
                                        type="text"
                                        value={editForm.contact}
                                        onChange={(event) =>
                                            setEditForm({
                                                ...editForm,
                                                contact:
                                                    event.target
                                                        .value,
                                            })
                                        }
                                        required
                                    />
                                </div>

                                <div className="admin-form-group full">
                                    <label>
                                        Location
                                    </label>

                                    <input
                                        type="text"
                                        value={editForm.location}
                                        onChange={(event) =>
                                            setEditForm({
                                                ...editForm,
                                                location:
                                                    event.target
                                                        .value,
                                            })
                                        }
                                        required
                                    />
                                </div>

                            </div>

                            <div className="admin-modal-footer">

                                <button
                                    type="button"
                                    className="admin-modal-secondary"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="admin-modal-primary"
                                >
                                    <i className="bi bi-check-lg"></i>
                                    Save Changes
                                </button>

                            </div>

                        </form>

                    </div>
                )}

            {/* =================================================
                        BLOCK / UNBLOCK MODAL
            ================================================== */}

            {(modalType === "block" ||
                modalType === "unblock") &&
                selectedHomeowner && (
                    <div
                        className="admin-modal-overlay"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeModal();
                            }
                        }}
                    >

                        <div className="admin-confirm-modal">

                            <div
                                className={`admin-confirm-icon ${modalType === "block"
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
                                    ? "Block Homeowner?"
                                    : "Unblock Homeowner?"}
                            </h3>

                            <p>
                                {modalType === "block"
                                    ? `Are you sure you want to block ${selectedHomeowner.fullName}'s account?`
                                    : `Are you sure you want to unblock ${selectedHomeowner.fullName}'s account?`}
                            </p>

                            <div className="admin-confirm-actions">

                                <button
                                    type="button"
                                    className="admin-modal-secondary"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className={
                                        modalType === "block"
                                            ? "admin-modal-danger"
                                            : "admin-modal-primary"
                                    }
                                    onClick={confirmBlock}
                                >
                                    {modalType === "block"
                                        ? "Block Account"
                                        : "Unblock Account"}
                                </button>

                            </div>

                        </div>

                    </div>
                )}

            {/* =================================================
                        DELETE MODAL
            ================================================== */}

            {modalType === "delete" &&
                selectedHomeowner && (
                    <div
                        className="admin-modal-overlay"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeModal();
                            }
                        }}
                    >

                        <div className="admin-confirm-modal">

                            <div className="admin-confirm-icon danger">
                                <i className="bi bi-trash3"></i>
                            </div>

                            <h3>
                                Delete Homeowner?
                            </h3>

                            <p>
                                Are you sure you want to delete{" "}
                                <strong>
                                    {selectedHomeowner.fullName}
                                </strong>
                                ? This action cannot be undone.
                            </p>

                            <div className="admin-confirm-actions">

                                <button
                                    type="button"
                                    className="admin-modal-secondary"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="admin-modal-danger"
                                    onClick={confirmDelete}
                                >
                                    Delete Account
                                </button>

                            </div>

                        </div>

                    </div>
                )}

        </div>
    );
}

export default ManageHomeowners;