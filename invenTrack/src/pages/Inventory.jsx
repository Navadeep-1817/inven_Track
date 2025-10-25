// src/components/Inventory.jsx
import React, { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import "../styles/Inventory.css";

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
    priceRange: [0, 100000],
  });
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // 🧩 Fetch user role & branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        setError("");
        
        const userRes = await axios.get("/auth/me");
        const { role, branch_id } = userRes.data;
        setUserRole(role);

        if (role === "superadmin") {
          const branchRes = await axios.get("/branches");
          setBranches(branchRes.data);
          
          // Auto-select first branch if available
          if (branchRes.data.length > 0) {
            const firstBranchId = branchRes.data[0].branch_id;
            setSelectedBranch(firstBranchId);
            await fetchInventory(firstBranchId);
          }
        } else {
          // Manager or Staff
          setSelectedBranch(branch_id);
          await fetchInventory(branch_id);
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
      const res = await axios.get(url);
      
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

        {/* Error Message */}
        {error && (
          <div className="error-message-inv">
            <span className="error-icon-inv">⚠️</span>
            {error}
          </div>
        )}

        {/* Branch Selector (Superadmin Only) */}
        {userRole === "superadmin" && (
          <div className="branch-selector-inv">
            <label className="branch-label-inv">Select Branch:</label>
            <select
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                fetchInventory(e.target.value);
              }}
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
        )}

        {/* Stats Cards */}
        <div className="stats-container-inv">
          <div className="stat-card-inv">
            <div className="stat-icon-inv"></div>
            <div className="stat-content-inv">
              <p className="stat-label-inv">Total Products</p>
              <p className="stat-value-inv">{inventory.length}</p>
            </div>
          </div>
          <div className="stat-card-inv">
            <div className="stat-icon-inv"></div>
            <div className="stat-content-inv">
              <p className="stat-label-inv">Filtered Results</p>
              <p className="stat-value-inv">{filteredInventory.length}</p>
            </div>
          </div>
          <div className="stat-card-inv">
            <div className="stat-icon-inv"></div>
            <div className="stat-content-inv">
              <p className="stat-label-inv">Categories</p>
              <p className="stat-value-inv">{categories.length - 1}</p>
            </div>
          </div>
          <div className="stat-card-inv">
            <div className="stat-icon-inv"></div>
            <div className="stat-content-inv">
              <p className="stat-label-inv">Total Value</p>
              <p className="stat-value-inv">
                ₹{filteredInventory.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Reset */}
        <div className="search-reset-container-inv">
          <div className="search-container-inv">
            <span className="search-icon-inv"></span>
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

        {/* Inventory Table */}
        {filteredInventory.length > 0 ? (
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
              {search || filters.pCategory !== "all" || filters.brand !== "all"
                ? "Try adjusting your search or filters"
                : selectedBranch
                ? "This branch has no inventory yet"
                : "Please select a branch to view inventory"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;