import React, { useState, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import "./AdminDashboard.css";

function ServiceCategories() {
    const [categories, setCategories] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const [categoryName, setCategoryName] = useState("");
    const [categoryDescription, setCategoryDescription] = useState("");
    const [categoryStatus, setCategoryStatus] = useState("Active");

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    const itemsPerPage = 5;

    const filteredCategories = useMemo(() => {
        return categories.filter((category) => {
            const search = searchTerm.toLowerCase();

            const matchesSearch =
                String(category.name || "")
                    .toLowerCase()
                    .includes(search) ||
                String(category.description || "")
                    .toLowerCase()
                    .includes(search);

            const matchesStatus =
                statusFilter === "All" ||
                category.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [categories, searchTerm, statusFilter]);

    const totalPages = Math.ceil(
        filteredCategories.length / itemsPerPage
    );

    const paginatedCategories = filteredCategories.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const activeCount = categories.filter(
        (category) => category.status === "Active"
    ).length;

    const inactiveCount = categories.filter(
        (category) => category.status === "Inactive"
    ).length;

    const handleSearch = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleStatusFilter = (value) => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    const openAddModal = () => {
        setEditingCategory(null);
        setCategoryName("");
        setCategoryDescription("");
        setCategoryStatus("Active");
        setShowCategoryModal(true);
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setCategoryName(category.name || "");
        setCategoryDescription(category.description || "");
        setCategoryStatus(category.status || "Active");
        setShowCategoryModal(true);
    };

    const closeCategoryModal = () => {
        setShowCategoryModal(false);
        setEditingCategory(null);
        setCategoryName("");
        setCategoryDescription("");
        setCategoryStatus("Active");
    };

    const handleSaveCategory = (event) => {
        event.preventDefault();

        const trimmedName = categoryName.trim();

        if (!trimmedName) {
            return;
        }

        if (editingCategory) {
            setCategories((previousCategories) =>
                previousCategories.map((category) =>
                    category.id === editingCategory.id
                        ? {
                            ...category,
                            name: trimmedName,
                            description: categoryDescription.trim(),
                            status: categoryStatus,
                        }
                        : category
                )
            );
        } else {
            const newCategory = {
                id: Date.now(),
                name: trimmedName,
                description: categoryDescription.trim(),
                status: categoryStatus,
            };

            setCategories((previousCategories) => [
                ...previousCategories,
                newCategory,
            ]);
        }

        closeCategoryModal();
    };

    const toggleCategoryStatus = (category) => {
        const updatedStatus =
            category.status === "Active"
                ? "Inactive"
                : "Active";

        setCategories((previousCategories) =>
            previousCategories.map((item) =>
                item.id === category.id
                    ? {
                        ...item,
                        status: updatedStatus,
                    }
                    : item
            )
        );
    };

    const openDeleteModal = (category) => {
        setCategoryToDelete(category);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setCategoryToDelete(null);
        setShowDeleteModal(false);
    };

    const handleDeleteCategory = () => {
        if (!categoryToDelete) {
            return;
        }

        setCategories((previousCategories) =>
            previousCategories.filter(
                (category) => category.id !== categoryToDelete.id
            )
        );

        closeDeleteModal();

        if (
            currentPage > 1 &&
            paginatedCategories.length === 1
        ) {
            setCurrentPage((page) => Math.max(page - 1, 1));
        }
    };

    const getShowingText = () => {
        if (filteredCategories.length === 0) {
            return "Showing 0 to 0 of 0";
        }

        const start =
            (currentPage - 1) * itemsPerPage + 1;

        const end = Math.min(
            currentPage * itemsPerPage,
            filteredCategories.length
        );

        return `Showing ${start} to ${end} of ${filteredCategories.length}`;
    };

    return (
        <div className="service-categories-page">

            {/* PAGE HEADER */}
            <div className="service-categories-header">
                <div>
                    <span className="service-categories-label">
                        SERVICE MANAGEMENT
                    </span>

                    <h2>Service Categories</h2>

                    <p>
                        Manage the service categories available on
                        the SmartHome platform.
                    </p>
                </div>

                <button
                    type="button"
                    className="service-add-button"
                    onClick={openAddModal}
                >
                    <i className="bi bi-plus-lg"></i>
                    Add Category
                </button>
            </div>

            {/* SUMMARY */}
            <div className="service-summary-grid">

                <div className="service-summary-card">
                    <div className="service-summary-icon green">
                        <i className="bi bi-grid-fill"></i>
                    </div>

                    <div>
                        <span>Total Categories</span>
                        <strong>{categories.length}</strong>
                    </div>
                </div>

                <div className="service-summary-card">
                    <div className="service-summary-icon orange">
                        <i className="bi bi-check-circle-fill"></i>
                    </div>

                    <div>
                        <span>Active Categories</span>
                        <strong>{activeCount}</strong>
                    </div>
                </div>

                <div className="service-summary-card">
                    <div className="service-summary-icon gray">
                        <i className="bi bi-pause-circle-fill"></i>
                    </div>

                    <div>
                        <span>Inactive Categories</span>
                        <strong>{inactiveCount}</strong>
                    </div>
                </div>

            </div>

            {/* FILTERS */}
            <div className="service-filter-card">

                <div className="service-search-box">
                    <i className="bi bi-search"></i>

                    <input
                        type="text"
                        placeholder="Search service category..."
                        value={searchTerm}
                        onChange={(event) =>
                            handleSearch(event.target.value)
                        }
                    />
                </div>

                <div className="service-filter-box">
                    <label htmlFor="category-status-filter">
                        Status
                    </label>

                    <select
                        id="category-status-filter"
                        value={statusFilter}
                        onChange={(event) =>
                            handleStatusFilter(event.target.value)
                        }
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>

            </div>

            {/* TABLE */}
            <div className="service-table-card">

                <div className="service-table-header">
                    <div>
                        <h3>Service Categories</h3>

                        <p>
                            Create and maintain the services offered
                            by providers.
                        </p>
                    </div>

                    <div className="service-table-count">
                        {filteredCategories.length}{" "}
                        {filteredCategories.length === 1
                            ? "category"
                            : "categories"}
                    </div>
                </div>

                <div className="service-table-wrapper">

                    <table className="service-table">

                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {paginatedCategories.length > 0 ? (
                                paginatedCategories.map((category) => (
                                    <tr key={category.id}>

                                        <td>
                                            <div className="service-category-name">

                                                <div className="service-category-icon">
                                                    <i className="bi bi-grid-3x3-gap-fill"></i>
                                                </div>

                                                <strong>
                                                    {category.name}
                                                </strong>

                                            </div>
                                        </td>

                                        <td>
                                            <span className="service-description">
                                                {category.description ||
                                                    "No description"}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={`service-status ${category.status === "Active"
                                                    ? "active"
                                                    : "inactive"
                                                    }`}
                                            >
                                                <span className="status-dot"></span>
                                                {category.status}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="service-action-buttons">

                                                <button
                                                    type="button"
                                                    className="service-action-button edit"
                                                    title="Edit Category"
                                                    onClick={() =>
                                                        openEditModal(category)
                                                    }
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>

                                                <button
                                                    type="button"
                                                    className={`service-action-button ${category.status === "Active"
                                                        ? "deactivate"
                                                        : "activate"
                                                        }`}
                                                    title={
                                                        category.status === "Active"
                                                            ? "Deactivate Category"
                                                            : "Activate Category"
                                                    }
                                                    onClick={() =>
                                                        toggleCategoryStatus(
                                                            category
                                                        )
                                                    }
                                                >
                                                    <i
                                                        className={`bi ${category.status === "Active"
                                                            ? "bi-toggle-on"
                                                            : "bi-toggle-off"
                                                            }`}
                                                    ></i>
                                                </button>

                                                <button
                                                    type="button"
                                                    className="service-action-button delete"
                                                    title="Delete Category"
                                                    onClick={() =>
                                                        openDeleteModal(
                                                            category
                                                        )
                                                    }
                                                >
                                                    <i className="bi bi-trash3"></i>
                                                </button>

                                            </div>
                                        </td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="4"
                                        className="service-table-empty"
                                    >
                                        <div className="service-empty-state">

                                            <div className="service-empty-icon">
                                                <i className="bi bi-grid-3x3-gap"></i>
                                            </div>

                                            <h4>
                                                No service categories found
                                            </h4>

                                            <p>
                                                Service categories will appear
                                                here once data is available.
                                            </p>

                                        </div>
                                    </td>
                                </tr>
                            )}

                        </tbody>

                    </table>

                </div>

                {/* PAGINATION */}
                <div className="service-pagination">

                    <span>
                        {getShowingText()}
                    </span>

                    <div className="service-pagination-buttons">

                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() =>
                                setCurrentPage((page) =>
                                    Math.max(page - 1, 1)
                                )
                            }
                        >
                            <i className="bi bi-chevron-left"></i>
                        </button>

                        {totalPages > 0 &&
                            Array.from(
                                { length: totalPages },
                                (_, index) => index + 1
                            ).map((page) => (
                                <button
                                    type="button"
                                    key={page}
                                    className={
                                        currentPage === page
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        setCurrentPage(page)
                                    }
                                >
                                    {page}
                                </button>
                            ))}

                        <button
                            type="button"
                            disabled={
                                totalPages === 0 ||
                                currentPage === totalPages
                            }
                            onClick={() =>
                                setCurrentPage((page) =>
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

            {/* ADD / EDIT MODAL */}
            {showCategoryModal && (
                <div
                    className="service-modal-overlay"
                    onClick={closeCategoryModal}
                >
                    <div
                        className="service-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="service-modal-header">

                            <div>
                                <span>
                                    {editingCategory
                                        ? "EDIT CATEGORY"
                                        : "NEW CATEGORY"}
                                </span>

                                <h3>
                                    {editingCategory
                                        ? "Edit Service Category"
                                        : "Add Service Category"}
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={closeCategoryModal}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>

                        <form onSubmit={handleSaveCategory}>

                            <div className="service-modal-body">

                                <div className="service-form-group">
                                    <label htmlFor="category-name">
                                        Category Name
                                    </label>

                                    <input
                                        id="category-name"
                                        type="text"
                                        placeholder="Enter service category"
                                        value={categoryName}
                                        onChange={(event) =>
                                            setCategoryName(
                                                event.target.value
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div className="service-form-group">
                                    <label htmlFor="category-description">
                                        Description
                                    </label>

                                    <textarea
                                        id="category-description"
                                        rows="4"
                                        placeholder="Enter category description"
                                        value={categoryDescription}
                                        onChange={(event) =>
                                            setCategoryDescription(
                                                event.target.value
                                            )
                                        }
                                    ></textarea>
                                </div>

                                <div className="service-form-group">
                                    <label htmlFor="category-status">
                                        Status
                                    </label>

                                    <select
                                        id="category-status"
                                        value={categoryStatus}
                                        onChange={(event) =>
                                            setCategoryStatus(
                                                event.target.value
                                            )
                                        }
                                    >
                                        <option value="Active">
                                            Active
                                        </option>

                                        <option value="Inactive">
                                            Inactive
                                        </option>
                                    </select>
                                </div>

                            </div>

                            <div className="service-modal-footer">

                                <button
                                    type="button"
                                    className="service-modal-cancel"
                                    onClick={closeCategoryModal}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="service-modal-save"
                                >
                                    <i
                                        className={`bi ${editingCategory
                                            ? "bi-check-lg"
                                            : "bi-plus-lg"
                                            }`}
                                    ></i>

                                    {editingCategory
                                        ? "Save Changes"
                                        : "Add Category"}
                                </button>

                            </div>

                        </form>

                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {showDeleteModal && categoryToDelete && (
                <div
                    className="service-modal-overlay"
                    onClick={closeDeleteModal}
                >
                    <div
                        className="service-modal service-delete-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="service-modal-header">

                            <div>
                                <span>DELETE CATEGORY</span>
                                <h3>Confirm Deletion</h3>
                            </div>

                            <button
                                type="button"
                                onClick={closeDeleteModal}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>

                        <div className="service-delete-body">

                            <div className="service-delete-icon">
                                <i className="bi bi-trash3"></i>
                            </div>

                            <h4>
                                Delete this category?
                            </h4>

                            <p>
                                Are you sure you want to delete{" "}
                                <strong>
                                    {categoryToDelete.name}
                                </strong>
                                ?
                            </p>

                            <span>
                                This action cannot be undone.
                            </span>

                        </div>

                        <div className="service-modal-footer">

                            <button
                                type="button"
                                className="service-modal-cancel"
                                onClick={closeDeleteModal}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="service-modal-delete"
                                onClick={handleDeleteCategory}
                            >
                                <i className="bi bi-trash3"></i>
                                Delete Category
                            </button>

                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}

export default ServiceCategories;