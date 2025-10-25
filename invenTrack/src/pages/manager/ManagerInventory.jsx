// src/components/ManagerInventory.jsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import "../../styles/ManagerInventory.css";

const ManagerInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    pCategory: "all",
    brand: "all",
    pSubCat: "all",
    priceRange: [0, 100000],
  });
  const [userBranch, setUserBranch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  
  // Modal states for CRUD operations
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState({
    pid: "",
    name: "",
    brand: "",
    pCategory: "",
    pSubCat: "",
    price: "",
    quantity: "",
    attributes: {},
  });

  // Fetch manager's branch and inventory
  useEffect(() => {
    const fetchManagerInventory = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Get manager's info
        const userRes = await axiosInstance.get("/auth/me");
        const { branch_id } = userRes.data;
        setUserBranch(branch_id);

        // Fetch inventory for manager's branch
        await fetchInventory(branch_id);
      } catch (err) {
        console.error("❌ Error fetching inventory:", err);
        setError(err.response?.data?.message || "Failed to load inventory");
      } finally {
        setLoading(false);
      }
    };

    fetchManagerInventory();
  }, []);

  // Fetch inventory
  const fetchInventory = async (branchId) => {
    try {
      const res = await axiosInstance.get(`/inventory/${branchId}`);
      setInventory(res.data);
      setFilteredInventory(res.data);
    } catch (err) {
      console.error("❌ Error fetching inventory:", err);
      throw err;
    }
  };

  // Handle search and filters
  useEffect(() => {
    let data = [...inventory];

    // Search
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(
        (item) =>
          item.name?.toLowerCase().includes(s) ||
          item.brand?.toLowerCase().includes(s) ||
          item.pid?.toLowerCase().includes(s) ||
          (item.pSubCat && item.pSubCat.toLowerCase().includes(s))
      );
    }

    // Category filter
    if (filters.pCategory !== "all") {
      data = data.filter((i) => i.pCategory === filters.pCategory);
    }

    // Brand filter
    if (filters.brand !== "all") {
      data = data.filter((i) => i.brand === filters.brand);
    }

    // SubCategory filter
    if (filters.pSubCat !== "all") {
      data = data.filter((i) => i.pSubCat === filters.pSubCat);
    }

    // Price range filter
    data = data.filter(
      (i) => i.price >= filters.priceRange[0] && i.price <= filters.priceRange[1]
    );

    setFilteredInventory(data);
  }, [search, filters, inventory]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    const sorted = [...filteredInventory].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (typeof aVal === "string") {
        return direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return direction === "asc" ? aVal - bVal : bVal - aVal;
    });

    setFilteredInventory(sorted);
    setSortConfig({ key, direction });
  };

  // Reset filters
  const resetFilters = () => {
    setSearch("");
    setFilters({
      pCategory: "all",
      brand: "all",
      pSubCat: "all",
      priceRange: [0, 100000],
    });
  };

  // Add Product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axiosInstance.post("/inventory", {
        ...formData,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
      });
      
      // Refresh inventory
      await fetchInventory(userBranch);
      setShowAddModal(false);
      resetFormData();
      alert("Product added successfully!");
    } catch (err) {
      console.error("❌ Error adding product:", err);
      alert(err.response?.data?.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  // Edit Product
  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axiosInstance.put(`/inventory/${userBranch}/${currentProduct.pid}`, {
        ...formData,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
      });
      
      // Refresh inventory
      await fetchInventory(userBranch);
      setShowEditModal(false);
      setCurrentProduct(null);
      resetFormData();
      alert("Product updated successfully!");
    } catch (err) {
      console.error("❌ Error updating product:", err);
      alert(err.response?.data?.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (pid) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    try {
      setLoading(true);
      await axiosInstance.delete(`/inventory/${userBranch}/${pid}`);
      
      // Refresh inventory
      await fetchInventory(userBranch);
      alert("Product deleted successfully!");
    } catch (err) {
      console.error("❌ Error deleting product:", err);
      alert(err.response?.data?.message || "Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (product) => {
    setCurrentProduct(product);
    setFormData({
      pid: product.pid,
      name: product.name,
      brand: product.brand,
      pCategory: product.pCategory,
      pSubCat: product.pSubCat || "",
      price: product.price,
      quantity: product.quantity,
      attributes: product.attributes || {},
    });
    setShowEditModal(true);
  };

  // Reset form data
  const resetFormData = () => {
    setFormData({
      pid: "",
      name: "",
      brand: "",
      pCategory: "",
      pSubCat: "",
      price: "",
      quantity: "",
      attributes: {},
    });
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Get unique values for filters
  const categories = ["all", ...new Set(inventory.map((i) => i.pCategory))];
  const brands = ["all", ...new Set(inventory.map((i) => i.brand))];
  const subCats = ["all", ...new Set(inventory.map((i) => i.pSubCat).filter(Boolean))];

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "⇅";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  // Loading state
  if (loading && inventory.length === 0) {
    return (
      <div className="inventory-container-man-inv">
        <div className="inventory-wrapper-man-inv">
          <div className="loading-spinner-man-inv">
            <div className="spinner-man-inv"></div>
            <p>Loading inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-container-man-inv">
      <div className="inventory-wrapper-man-inv">
        
        {/* Header */}
        <div className="inventory-header-man-inv">
          <h2 className="inventory-title-man-inv">My Branch Inventory</h2>
          <p className="branch-info-man-inv">Branch ID: <strong>{userBranch}</strong></p>
          <button className="add-product-btn-man-inv" onClick={() => setShowAddModal(true)}>
             Add New Product
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message-man-inv">
            <span className="error-icon-man-inv">⚠️</span>
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-container-man-inv">
          <div className="stat-card-man-inv">
            <div className="stat-content-man-inv">
              <p className="stat-label-man-inv">Total Products</p>
              <p className="stat-value-man-inv">{inventory.length}</p>
            </div>
          </div>
          <div className="stat-card-man-inv">
            <div className="stat-content-man-inv">
              <p className="stat-label-man-inv">Filtered Results</p>
              <p className="stat-value-man-inv">{filteredInventory.length}</p>
            </div>
          </div>
          <div className="stat-card-man-inv">
            <div className="stat-content-man-inv">
              <p className="stat-label-man-inv">Categories</p>
              <p className="stat-value-man-inv">{categories.length - 1}</p>
            </div>
          </div>
          <div className="stat-card-man-inv">
            <div className="stat-content-man-inv">
              <p className="stat-label-man-inv">Total Value</p>
              <p className="stat-value-man-inv">
                ₹{filteredInventory
                  .reduce((sum, item) => {
                    const price = Number(item.price) || 0;
                    const quantity = Number(item.quantity) || 0;
                    return sum + (price * quantity);
                  }, 0)
                  .toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Reset */}
        <div className="search-reset-container-man-inv">
          <div className="search-container-man-inv">
            <input
              type="text"
              placeholder="Search by name, brand, PID, or sub-category..."
              className="search-input-man-inv"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="reset-btn-man-inv" onClick={resetFilters}>
         Reset Filters
          </button>
        </div>

        {/* Filters */}
        <div className="filters-container-man-inv">
          <select
            value={filters.pCategory}
            onChange={(e) =>
              setFilters({ ...filters, pCategory: e.target.value })
            }
            className="filter-select-man-inv"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Categories" : c.replace(/_/g, " ").toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={filters.brand}
            onChange={(e) =>
              setFilters({ ...filters, brand: e.target.value })
            }
            className="filter-select-man-inv"
          >
            {brands.map((b) => (
              <option key={b} value={b}>
                {b === "all" ? "All Brands" : b}
              </option>
            ))}
          </select>

          <select
            value={filters.pSubCat}
            onChange={(e) =>
              setFilters({ ...filters, pSubCat: e.target.value })
            }
            className="filter-select-man-inv"
          >
            {subCats.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Sub-Categories" : s.replace(/_/g, " ").toUpperCase()}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Min Price (₹)"
            className="filter-input-man-inv"
            value={filters.priceRange[0]}
            onChange={(e) =>
              setFilters({
                ...filters,
                priceRange: [Number(e.target.value), filters.priceRange[1]],
              })
            }
          />
          <input
            type="number"
            placeholder="Max Price (₹)"
            className="filter-input-man-inv"
            value={filters.priceRange[1]}
            onChange={(e) =>
              setFilters({
                ...filters,
                priceRange: [filters.priceRange[0], Number(e.target.value)],
              })
            }
          />
        </div>

        {/* Inventory Table */}
        {filteredInventory.length > 0 ? (
          <div className="table-container-man-inv">
            <table className="inventory-table-man-inv">
              <thead>
                <tr>
                  <th onClick={() => handleSort("pid")}>
                    PID {getSortIcon("pid")}
                  </th>
                  <th onClick={() => handleSort("name")}>
                    Name {getSortIcon("name")}
                  </th>
                  <th onClick={() => handleSort("brand")}>
                    Brand {getSortIcon("brand")}
                  </th>
                  <th onClick={() => handleSort("pCategory")}>
                    Category {getSortIcon("pCategory")}
                  </th>
                  <th>Sub-Category</th>
                  <th onClick={() => handleSort("price")}>
                    Price {getSortIcon("price")}
                  </th>
                  <th onClick={() => handleSort("quantity")}>
                    Quantity {getSortIcon("quantity")}
                  </th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item, index) => (
                  <tr key={item.pid} style={{ animationDelay: `${index * 0.05}s` }}>
                    <td className="pid-cell-man-inv">{item.pid}</td>
                    <td className="name-cell-man-inv">{item.name}</td>
                    <td>{item.brand}</td>
                    <td>
                      <span className="category-badge-man-inv">
                        {item.pCategory.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>{item.pSubCat?.replace(/_/g, " ") || "-"}</td>
                    <td className="price-cell-man-inv">₹{item.price.toLocaleString()}</td>
                    <td className="quantity-cell-man-inv">
                      <span className={`quantity-badge-man-inv ${item.quantity < 50 ? "low" : ""}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="date-cell-man-inv">
                      {item.lastUpdated
                        ? new Date(item.lastUpdated).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="actions-cell-man-inv">
                      <button 
                        className="edit-btn-man-inv" 
                        onClick={() => openEditModal(item)}
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-btn-man-inv" 
                        onClick={() => handleDeleteProduct(item.pid)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state-man-inv">
            <div className="empty-icon-man-inv">📭</div>
            <h3>No Products Found</h3>
            <p>
              {search || filters.pCategory !== "all" || filters.brand !== "all"
                ? "Try adjusting your search or filters"
                : "Start by adding products to your branch inventory"}
            </p>
          </div>
        )}

        {/* Add Product Modal */}
        {showAddModal && (
          <div className="modal-overlay-man-inv" onClick={() => setShowAddModal(false)}>
            <div className="modal-content-man-inv" onClick={(e) => e.stopPropagation()}>
              <h2>Add New Product</h2>
              <form onSubmit={handleAddProduct}>
                <input
                  type="text"
                  name="pid"
                  placeholder="Product ID"
                  value={formData.pid}
                  onChange={handleInputChange}
                  required
                  className="modal-input-man-inv"
                />
                <input
                  type="text"
                  name="name"
                  placeholder="Product Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="modal-input-man-inv"
                />
                <input
                  type="text"
                  name="brand"
                  placeholder="Brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                  className="modal-input-man-inv"
                />
                <input
                  type="text"
                  name="pCategory"
                  placeholder="Category (e.g., electronics)"
                  value={formData.pCategory}
                  onChange={handleInputChange}
                  required
                  className="modal-input-man-inv"
                />
                <input
                  type="text"
                  name="pSubCat"
                  placeholder="Sub-Category (optional)"
                  value={formData.pSubCat}
                  onChange={handleInputChange}
                  className="modal-input-man-inv"
                />
                <input
                  type="number"
                  name="price"
                  placeholder="Price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  className="modal-input-man-inv"
                />
                <input
                  type="number"
                  name="quantity"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  className="modal-input-man-inv"
                />
                <div className="modal-actions-man-inv">
                  <button type="submit" className="submit-btn-man-inv">Add Product</button>
                  <button 
                    type="button" 
                    className="cancel-btn-man-inv" 
                    onClick={() => {
                      setShowAddModal(false);
                      resetFormData();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {showEditModal && (
          <div className="modal-overlay-man-inv" onClick={() => setShowEditModal(false)}>
            <div className="modal-content-man-inv" onClick={(e) => e.stopPropagation()}>
              <h2>Edit Product</h2>
              <form onSubmit={handleEditProduct}>
                <input
                  type="text"
                  name="pid"
                  placeholder="Product ID"
                  value={formData.pid}
                  disabled
                  className="modal-input-man-inv"
                />
                <input
                  type="text"
                  name="name"
                  placeholder="Product Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="modal-input-man-inv"
                />
                <input
                  type="text"
                  name="brand"
                  placeholder="Brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                  className="modal-input-man-inv"
                />
                <input
                  type="text"
                  name="pCategory"
                  placeholder="Category"
                  value={formData.pCategory}
                  onChange={handleInputChange}
                  required
                  className="modal-input-man-inv"
                />
                <input
                  type="text"
                  name="pSubCat"
                  placeholder="Sub-Category (optional)"
                  value={formData.pSubCat}
                  onChange={handleInputChange}
                  className="modal-input-man-inv"
                />
                <input
                  type="number"
                  name="price"
                  placeholder="Price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  className="modal-input-man-inv"
                />
                <input
                  type="number"
                  name="quantity"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  className="modal-input-man-inv"
                />
                <div className="modal-actions-man-inv">
                  <button type="submit" className="submit-btn-man-inv">Update Product</button>
                  <button 
                    type="button" 
                    className="cancel-btn-man-inv" 
                    onClick={() => {
                      setShowEditModal(false);
                      setCurrentProduct(null);
                      resetFormData();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerInventory;