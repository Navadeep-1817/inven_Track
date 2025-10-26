// src/components/StaffInventory.jsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import "../../styles/StaffInventory.css";

const StaffInventory = () => {
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

  // Fetch staff's branch and inventory
  useEffect(() => {
    const fetchStaffInventory = async () => {
      try {
        setLoading(true);
        setError("");
        
        console.log("🔍 Fetching staff info...");
        
        // Get staff's info
        const userRes = await axiosInstance.get("/auth/me");
        console.log("👤 Staff user data:", userRes.data);
        
        const { branch_id } = userRes.data;
        setUserBranch(branch_id);

        // Fetch inventory for staff's branch
        await fetchInventory(branch_id);
      } catch (err) {
        console.error("❌ Error fetching inventory:", err);
        console.error("❌ Error response:", err.response?.data);
        setError(err.response?.data?.message || "Failed to load inventory");
      } finally {
        setLoading(false);
      }
    };

    fetchStaffInventory();
  }, []);

  // Fetch inventory
  const fetchInventory = async (branchId) => {
    try {
      console.log(`📦 Fetching inventory for branch: ${branchId}`);
      
      const res = await axiosInstance.get(`/inventory/${branchId}`);
      
      console.log("📊 Raw inventory response:", res.data);
      
      // ✅ The backend returns inventoryItems array directly
      // Check if response is already an array or needs to be extracted
      let inventoryData = res.data;
      
      // If the response is an object with inventoryItems, extract it
      if (res.data && res.data.inventoryItems && Array.isArray(res.data.inventoryItems)) {
        inventoryData = res.data.inventoryItems;
        console.log("📦 Extracted inventoryItems array");
      }
      
      // If response is already an array, use it directly
      if (Array.isArray(res.data)) {
        inventoryData = res.data;
        console.log("📦 Using direct array response");
      }
      
      console.log(`✅ Loaded ${inventoryData.length} products`);
      
      setInventory(inventoryData);
      setFilteredInventory(inventoryData);
    } catch (err) {
      console.error("❌ Error fetching inventory:", err);
      console.error("❌ Error details:", err.response?.data);
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

  // Get unique values for filters
  const categories = ["all", ...new Set(inventory.map((i) => i.pCategory).filter(Boolean))];
  const brands = ["all", ...new Set(inventory.map((i) => i.brand).filter(Boolean))];
  const subCats = ["all", ...new Set(inventory.map((i) => i.pSubCat).filter(Boolean))];

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "⇅";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  // Loading state
  if (loading && inventory.length === 0) {
    return (
      <div className="inventory-container-staff-inv">
        <div className="inventory-wrapper-staff-inv">
          <div className="loading-spinner-staff-inv">
            <div className="spinner-staff-inv"></div>
            <p>Loading inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-container-staff-inv">
      <div className="inventory-wrapper-staff-inv">
        
        {/* Header */}
        <div className="inventory-header-staff-inv">
          <p className="branch-info-staff-inv">Branch ID: <strong>{userBranch}</strong></p>
          <div className="view-only-badge-staff-inv">
            <span className="badge-icon-staff-inv">👁️</span>
            Read-Only Access
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message-staff-inv">
            <span className="error-icon-staff-inv">⚠️</span>
            {error}
          </div>
        )}  

        {/* Stats Cards */}
        <div className="stats-container-staff-inv">
          <div className="stat-card-staff-inv">
            <div className="stat-content-staff-inv">
              <p className="stat-label-staff-inv">Total Products</p>
              <p className="stat-value-staff-inv">{inventory.length}</p>
            </div>
          </div>
          <div className="stat-card-staff-inv">
            <div className="stat-content-staff-inv">
              <p className="stat-label-staff-inv">Filtered Results</p>
              <p className="stat-value-staff-inv">{filteredInventory.length}</p>
            </div>
          </div>
          <div className="stat-card-staff-inv">
            <div className="stat-content-staff-inv">
              <p className="stat-label-staff-inv">Categories</p>
              <p className="stat-value-staff-inv">{categories.length - 1}</p>
            </div>
          </div>
          <div className="stat-card-staff-inv">
            <div className="stat-content-staff-inv">
              <p className="stat-label-staff-inv">Total Value</p>
              <p className="stat-value-staff-inv">
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
        <div className="search-reset-container-staff-inv">
          <div className="search-container-staff-inv">
            <input
              type="text"
              placeholder="Search by name, brand, PID, or sub-category..."
              className="search-input-staff-inv"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="reset-btn-staff-inv" onClick={resetFilters}>
            🔄 Reset Filters
          </button>
        </div>

        {/* Filters */}
        <div className="filters-container-staff-inv">
          <select
            value={filters.pCategory}
            onChange={(e) =>
              setFilters({ ...filters, pCategory: e.target.value })
            }
            className="filter-select-staff-inv"
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
            className="filter-select-staff-inv"
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
            className="filter-select-staff-inv"
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
            className="filter-input-staff-inv"
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
            className="filter-input-staff-inv"
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
          <div className="table-container-staff-inv">
            <table className="inventory-table-staff-inv">
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
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item, index) => (
                  <tr key={item.pid || item._id || index} style={{ animationDelay: `${index * 0.05}s` }}>
                    <td className="pid-cell-staff-inv">{item.pid}</td>
                    <td className="name-cell-staff-inv">{item.name}</td>
                    <td>{item.brand}</td>
                    <td>
                      <span className="category-badge-staff-inv">
                        {item.pCategory?.replace(/_/g, " ") || "-"}
                      </span>
                    </td>
                    <td>{item.pSubCat?.replace(/_/g, " ") || "-"}</td>
                    <td className="price-cell-staff-inv">₹{Number(item.price || 0).toLocaleString()}</td>
                    <td className="quantity-cell-staff-inv">
                      <span className={`quantity-badge-staff-inv ${item.quantity < 50 ? "low" : ""}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="date-cell-staff-inv">
                      {item.lastUpdated
                        ? new Date(item.lastUpdated).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state-staff-inv">
            <div className="empty-icon-staff-inv">📭</div>
            <h3>No Products Found</h3>
            <p>
              {search || filters.pCategory !== "all" || filters.brand !== "all"
                ? "Try adjusting your search or filters"
                : "No products available in this branch inventory"}
            </p>
          </div>
        )}

        {/* Info Banner */}
        <div className="info-banner-staff-inv">
          <span className="info-icon-staff-inv">ℹ️</span>
          <p>You have read-only access to this inventory. Contact your manager for product updates.</p>
        </div>
      </div>
    </div>
  );
};

export default StaffInventory;