import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import '../styles/Inventory.css';

const Inventory = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    pCategory: "all",
    brand: "all",
    pSubCat: "all",
    priceRange: [0, 10000000000],
  });
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
  const [attributeInputs, setAttributeInputs] = useState([{ key: "", value: "" }]);

  // 🧩 Fetch branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        setError("");
        
        const branchRes = await axiosInstance.get("/branches");
        setBranches(branchRes.data);
        
        // Auto-select first branch if available
        if (branchRes.data.length > 0) {
          const firstBranchId = branchRes.data[0].branch_id;
          setSelectedBranch(firstBranchId);
          await fetchInventory(firstBranchId);
        }
      } catch (err) {
        console.error("❌ Error fetching branches:", err);
        setError("Failed to load branches. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  // 🧩 Fetch inventory for selected branch
  const fetchInventory = async (branchId) => {
    try {
      setLoading(true);
      setError("");
      
      if (!branchId) {
        setInventory([]);
        setFilteredInventory([]);
        return;
      }

      const url = `/inventory/${branchId}`;
      const res = await axiosInstance.get(url);
      
      setInventory(res.data);
      setFilteredInventory(res.data);
    } catch (err) {
      console.error("❌ Error fetching inventory:", err);
      setError(err.response?.data?.message || "Failed to load inventory");
      setInventory([]);
      setFilteredInventory([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle branch change
  const handleBranchChange = (branchId) => {
    setSelectedBranch(branchId);
    fetchInventory(branchId);
    // Reset search and filters when changing branch
    setSearch("");
    setFilters({
      pCategory: "all",
      brand: "all",
      pSubCat: "all",
      priceRange: [0, 100000],
    });
  };

  // 🧩 Handle search and filters
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

  // 🧩 Handle sorting
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

  // 🧩 Reset filters
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
    
    if (!selectedBranch) {
      alert("Please select a branch first");
      return;
    }

    // Build attributes object from inputs
    const attributes = {};
    attributeInputs.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) {
        attributes[key.trim()] = value.trim();
      }
    });

    try {
      setLoading(true);
      await axiosInstance.post("/inventory", {
        branchId: selectedBranch,
        ...formData,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        attributes,
      });
      
      // Refresh inventory
      await fetchInventory(selectedBranch);
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
    
    // Build attributes object from inputs
    const attributes = {};
    attributeInputs.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) {
        attributes[key.trim()] = value.trim();
      }
    });

    try {
      setLoading(true);
      await axiosInstance.put(`/inventory/${selectedBranch}/${currentProduct.pid}`, {
        ...formData,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        attributes,
      });
      
      // Refresh inventory
      await fetchInventory(selectedBranch);
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
      await axiosInstance.delete(`/inventory/${selectedBranch}/${pid}`);
      
      // Refresh inventory
      await fetchInventory(selectedBranch);
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
    
    // Convert existing attributes to input array
    const attrs = product.attributes || {};
    if (Object.keys(attrs).length > 0) {
      setAttributeInputs(
        Object.entries(attrs).map(([key, value]) => ({ key, value }))
      );
    } else {
      setAttributeInputs([{ key: "", value: "" }]);
    }
    
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
    setAttributeInputs([{ key: "", value: "" }]);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle attribute input change
  const handleAttributeChange = (index, field, value) => {
    const newInputs = [...attributeInputs];
    newInputs[index][field] = value;
    setAttributeInputs(newInputs);
  };

  // Add new attribute input
  const addAttributeInput = () => {
    setAttributeInputs([...attributeInputs, { key: "", value: "" }]);
  };

  // Remove attribute input
  const removeAttributeInput = (index) => {
    if (attributeInputs.length > 1) {
      const newInputs = attributeInputs.filter((_, i) => i !== index);
      setAttributeInputs(newInputs);
    }
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

  // Get branch name
  const getBranchName = () => {
    const branch = branches.find(b => b.branch_id === selectedBranch);
    return branch ? branch.branch_name : "";
  };

  // Loading state
  if (loading && inventory.length === 0 && branches.length === 0) {
    return (
      <div className="inventory-container-inv">
        <div className="inventory-wrapper-inv">
          <div className="loading-spinner-inv">
            <div className="spinner-inv"></div>
            <p>Loading inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-container-inv">
      <div className="inventory-wrapper-inv">

        {/* Header with Branch Selector */}
        <div className="inventory-header-inv">
          <div>
            {selectedBranch && (
              <p className="branch-info-inv">
                Managing: <strong>{getBranchName()} ({selectedBranch})</strong>
              </p>
            )}
          </div>
          <button 
            className="add-product-btn-inv" 
            onClick={() => setShowAddModal(true)}
            disabled={!selectedBranch}
          >
             Add New Product
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message-inv">
            <span className="error-icon-inv">⚠️</span>
            {error}
          </div>
        )}

        {/* Branch Selector */}
        <div className="branch-selector-inv">
          <label className="branch-label-inv">Select Branch:</label>
          <select
            value={selectedBranch}
            onChange={(e) => handleBranchChange(e.target.value)}
            className="filter-select-inv branch-select-inv"
          >
            <option value="">Choose a Branch</option>
            {branches.map((b) => (
              <option key={b._id} value={b.branch_id}>
                {b.branch_name} ({b.branch_id})
              </option>
            ))}
          </select>
        </div>

        {/* Stats Cards */}
        {selectedBranch && (
          <div className="stats-container-inv">
            <div className="stat-card-inv">
              <div className="stat-content-inv">
                <p className="stat-label-inv">Total Products</p>
                <p className="stat-value-inv">{inventory.length}</p>
              </div>
            </div>
            <div className="stat-card-inv">
              <div className="stat-content-inv">
                <p className="stat-label-inv">Filtered Results</p>
                <p className="stat-value-inv">{filteredInventory.length}</p>
              </div>
            </div>
            <div className="stat-card-inv">
              <div className="stat-content-inv">
                <p className="stat-label-inv">Categories</p>
                <p className="stat-value-inv">{categories.length - 1}</p>
              </div>
            </div>
            <div className="stat-card-inv">
              <div className="stat-content-inv">
                <p className="stat-label-inv">Total Value</p>
                <p className="stat-value-inv">
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
        )}

        {/* Search & Reset */}
        {selectedBranch && (
          <>
            <div className="search-reset-container-inv">
              <div className="search-container-inv">
                <input
                  type="text"
                  placeholder="Search by name, brand, PID, or sub-category..."
                  className="search-input-inv"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="reset-btn-inv" onClick={resetFilters}>
                 Reset Filters
              </button>
            </div>

            {/* Filters */}
            <div className="filters-container-inv">
              <select
                value={filters.pCategory}
                onChange={(e) =>
                  setFilters({ ...filters, pCategory: e.target.value })
                }
                className="filter-select-inv"
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
                className="filter-select-inv"
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
                className="filter-select-inv"
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
                className="filter-input-inv"
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
                className="filter-input-inv"
                value={filters.priceRange[1]}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    priceRange: [filters.priceRange[0], Number(e.target.value)],
                  })
                }
              />
            </div>
          </>
        )}

        {/* Inventory Table */}
        {selectedBranch && filteredInventory.length > 0 ? (
          <div className="table-container-inv">
            <table className="inventory-table-inv">
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
                  <th>Attributes</th>
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
                    <td className="pid-cell-inv">{item.pid}</td>
                    <td className="name-cell-inv">{item.name}</td>
                    <td>{item.brand}</td>
                    <td>
                      <span className="category-badge-inv">
                        {item.pCategory.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>{item.pSubCat?.replace(/_/g, " ") || "-"}</td>
                    <td className="attributes-cell-inv">
                      {item.attributes && Object.keys(item.attributes).length > 0 ? (
                        <div className="attributes-list-inv">
                          {Object.entries(item.attributes)
                            .slice(0, 3)
                            .map(([k, v]) => (
                              <span key={k} className="attribute-tag-inv">
                                {k}: {v}
                              </span>
                            ))}
                          {Object.keys(item.attributes).length > 3 && (
                            <span className="attribute-more-inv">
                              +{Object.keys(item.attributes).length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="price-cell-inv">₹{item.price.toLocaleString()}</td>
                    <td className="quantity-cell-inv">
                      <span className={`quantity-badge-inv ${item.quantity < 50 ? "low" : ""}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="date-cell-inv">
                      {item.lastUpdated
                        ? new Date(item.lastUpdated).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="actions-cell-inv">
                      <button 
                        className="edit-btn-inv" 
                        onClick={() => openEditModal(item)}
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-btn-inv" 
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
          <div className="empty-state-inv">
            <div className="empty-icon-inv">📭</div>
            <h3>No Products Found</h3>
            <p>
              {!selectedBranch
                ? "Please select a branch to view inventory"
                : search || filters.pCategory !== "all" || filters.brand !== "all"
                ? "Try adjusting your search or filters"
                : "This branch has no inventory yet. Click 'Add New Product' to get started."}
            </p>
          </div>
        )}

        {/* Add Product Modal */}
        {showAddModal && (
          <div className="modal-overlay-inv" onClick={() => setShowAddModal(false)}>
            <div className="modal-content-inv" onClick={(e) => e.stopPropagation()}>
              <h2>Add New Product to {getBranchName()}</h2>
              <form onSubmit={handleAddProduct}>
                <input
                  type="text"
                  name="pid"
                  placeholder="Product ID *"
                  value={formData.pid}
                  onChange={handleInputChange}
                  required
                  className="modal-input-inv"
                />
                <input
                  type="text"
                  name="name"
                  placeholder="Product Name *"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="modal-input-inv"
                />
                <input
                  type="text"
                  name="brand"
                  placeholder="Brand *"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                  className="modal-input-inv"
                />
                <input
                  type="text"
                  name="pCategory"
                  placeholder="Category (e.g., electronics) *"
                  value={formData.pCategory}
                  onChange={handleInputChange}
                  required
                  className="modal-input-inv"
                />
                <input
                  type="text"
                  name="pSubCat"
                  placeholder="Sub-Category (optional)"
                  value={formData.pSubCat}
                  onChange={handleInputChange}
                  className="modal-input-inv"
                />
                <input
                  type="number"
                  name="price"
                  placeholder="Price *"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="modal-input-inv"
                />
                <input
                  type="number"
                  name="quantity"
                  placeholder="Quantity *"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="modal-input-inv"
                />
                
                {/* Dynamic Attributes Section */}
                <div className="attributes-section-inv">
                  <label className="attributes-label-inv">Product Attributes (Optional)</label>
                  {attributeInputs.map((attr, index) => (
                    <div key={index} className="attribute-input-row-inv">
                      <input
                        type="text"
                        placeholder="Attribute Key (e.g., weight)"
                        value={attr.key}
                        onChange={(e) => handleAttributeChange(index, 'key', e.target.value)}
                        className="modal-input-inv attribute-key-inv"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g., 5kg)"
                        value={attr.value}
                        onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                        className="modal-input-inv attribute-value-inv"
                      />
                      {attributeInputs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAttributeInput(index)}
                          className="remove-attribute-btn-inv"
                          title="Remove attribute"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAttributeInput}
                    className="add-attribute-btn-inv"
                  >
                    + Add Another Attribute
                  </button>
                </div>

                <div className="modal-actions-inv">
                  <button type="submit" className="submit-btn-inv">Add Product</button>
                  <button 
                    type="button" 
                    className="cancel-btn-inv" 
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
          <div className="modal-overlay-inv" onClick={() => setShowEditModal(false)}>
            <div className="modal-content-inv" onClick={(e) => e.stopPropagation()}>
              <h2>Edit Product in {getBranchName()}</h2>
              <form onSubmit={handleEditProduct}>
                <input
                  type="text"
                  name="pid"
                  placeholder="Product ID"
                  value={formData.pid}
                  disabled
                  className="modal-input-inv"
                />
                <input
                  type="text"
                  name="name"
                  placeholder="Product Name *"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="modal-input-inv"
                />
                <input
                  type="text"
                  name="brand"
                  placeholder="Brand *"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                  className="modal-input-inv"
                />
                <input
                  type="text"
                  name="pCategory"
                  placeholder="Category *"
                  value={formData.pCategory}
                  onChange={handleInputChange}
                  required
                  className="modal-input-inv"
                />
                <input
                  type="text"
                  name="pSubCat"
                  placeholder="Sub-Category (optional)"
                  value={formData.pSubCat}
                  onChange={handleInputChange}
                  className="modal-input-inv"
                />
                <input
                  type="number"
                  name="price"
                  placeholder="Price *"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="modal-input-inv"
                />
                <input
                  type="number"
                  name="quantity"
                  placeholder="Quantity *"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="modal-input-inv"
                />
                
                {/* Dynamic Attributes Section */}
                <div className="attributes-section-inv">
                  <label className="attributes-label-inv">Product Attributes (Optional)</label>
                  {attributeInputs.map((attr, index) => (
                    <div key={index} className="attribute-input-row-inv">
                      <input
                        type="text"
                        placeholder="Attribute Key (e.g., weight)"
                        value={attr.key}
                        onChange={(e) => handleAttributeChange(index, 'key', e.target.value)}
                        className="modal-input-inv attribute-key-inv"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g., 5kg)"
                        value={attr.value}
                        onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                        className="modal-input-inv attribute-value-inv"
                      />
                      {attributeInputs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAttributeInput(index)}
                          className="remove-attribute-btn-inv"
                          title="Remove attribute"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAttributeInput}
                    className="add-attribute-btn-inv"
                  >
                    + Add Another Attribute
                  </button>
                </div>

                <div className="modal-actions-inv">
                  <button type="submit" className="submit-btn-inv">Update Product</button>
                  <button 
                    type="button" 
                    className="cancel-btn-inv" 
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

export default Inventory;