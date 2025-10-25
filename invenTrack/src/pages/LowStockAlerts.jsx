import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import "../styles/LowStockAlerts.css";

const LowStockAlerts = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [inventory, setInventory] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Alert settings
  const [thresholdSettings, setThresholdSettings] = useState({
    critical: 10,  // Red alert
    low: 50,       // Yellow alert
    medium: 100,   // Orange alert
  });
  
  // Filters
  const [filters, setFilters] = useState({
    alertLevel: "all", // all, critical, low, medium
    category: "all",
    brand: "all",
    search: "",
    minQuantity: 0,
    maxQuantity: 1000,
  });

  const [sortConfig, setSortConfig] = useState({ key: "quantity", direction: "asc" });
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(thresholdSettings);

  // Fetch branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axiosInstance.get("/branches");
        setBranches(res.data);
      } catch (err) {
        console.error("Error fetching branches:", err);
        setError("Failed to load branches");
      }
    };
    fetchBranches();
  }, []);

  // Fetch inventory when branch changes
  useEffect(() => {
    fetchInventory();
  }, [selectedBranch]);

  // Filter items when inventory or filters change
  useEffect(() => {
    filterLowStockItems();
  }, [inventory, filters, thresholdSettings]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError("");
      
      let allInventory = [];
      
      if (selectedBranch === "all") {
        // Fetch from all branches
        const promises = branches.map(branch => 
          axiosInstance.get(`/inventory/${branch.branch_id}`)
        );
        const results = await Promise.all(promises);
        results.forEach((res, index) => {
          const branchData = res.data.map(item => ({
            ...item,
            branchName: branches[index].branch_name,
            branchId: branches[index].branch_id,
          }));
          allInventory = [...allInventory, ...branchData];
        });
      } else {
        // Fetch from selected branch
        const res = await axiosInstance.get(`/inventory/${selectedBranch}`);
        const branch = branches.find(b => b.branch_id === selectedBranch);
        allInventory = res.data.map(item => ({
          ...item,
          branchName: branch?.branch_name || selectedBranch,
          branchId: selectedBranch,
        }));
      }
      
      setInventory(allInventory);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const filterLowStockItems = () => {
    let filtered = inventory.filter(item => {
      const qty = Number(item.quantity) || 0;
      return qty <= thresholdSettings.medium;
    });

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchLower) ||
        item.brand?.toLowerCase().includes(searchLower) ||
        item.pid?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filters.category !== "all") {
      filtered = filtered.filter(item => item.pCategory === filters.category);
    }

    // Apply brand filter
    if (filters.brand !== "all") {
      filtered = filtered.filter(item => item.brand === filters.brand);
    }

    // Apply quantity range filter
    filtered = filtered.filter(item => {
      const qty = Number(item.quantity) || 0;
      return qty >= filters.minQuantity && qty <= filters.maxQuantity;
    });

    // Apply alert level filter
    if (filters.alertLevel !== "all") {
      filtered = filtered.filter(item => {
        const qty = Number(item.quantity) || 0;
        const level = getAlertLevel(qty);
        return level === filters.alertLevel;
      });
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const aVal = sortConfig.key === "quantity" || sortConfig.key === "price" 
        ? Number(a[sortConfig.key]) 
        : a[sortConfig.key];
      const bVal = sortConfig.key === "quantity" || sortConfig.key === "price"
        ? Number(b[sortConfig.key])
        : b[sortConfig.key];

      if (typeof aVal === "string") {
        return sortConfig.direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    });

    setLowStockItems(sorted);
  };

  const getAlertLevel = (quantity) => {
    if (quantity <= thresholdSettings.critical) return "critical";
    if (quantity <= thresholdSettings.low) return "low";
    if (quantity <= thresholdSettings.medium) return "medium";
    return "normal";
  };

  const getAlertColor = (quantity) => {
    const level = getAlertLevel(quantity);
    switch (level) {
      case "critical": return "#ef4444";
      case "low": return "#f59e0b";
      case "medium": return "#eab308";
      default: return "#10b981";
    }
  };

  const getAlertIcon = (quantity) => {
    const level = getAlertLevel(quantity);
    switch (level) {
      case "critical": return "🚨";
      case "low": return "⚠️";
      case "medium": return "⚡";
      default: return "✅";
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "⇅";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const handleSaveSettings = () => {
    setThresholdSettings(tempSettings);
    setShowSettings(false);
  };

  const resetFilters = () => {
    setFilters({
      alertLevel: "all",
      category: "all",
      brand: "all",
      search: "",
      minQuantity: 0,
      maxQuantity: 1000,
    });
  };

  const exportToCSV = () => {
    const headers = ["PID", "Name", "Brand", "Category", "Branch", "Quantity", "Alert Level", "Price", "Last Updated"];
    const rows = lowStockItems.map(item => [
      item.pid,
      item.name,
      item.brand,
      item.pCategory,
      item.branchName,
      item.quantity,
      getAlertLevel(item.quantity),
      item.price,
      item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : "-"
    ]);

    let csvContent = headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `low-stock-alerts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Get unique values for filters
  const categories = ["all", ...new Set(inventory.map(i => i.pCategory))];
  const brands = ["all", ...new Set(inventory.map(i => i.brand))];

  const criticalCount = lowStockItems.filter(i => getAlertLevel(i.quantity) === "critical").length;
  const lowCount = lowStockItems.filter(i => getAlertLevel(i.quantity) === "low").length;
  const mediumCount = lowStockItems.filter(i => getAlertLevel(i.quantity) === "medium").length;

  if (loading) {
    return (
      <div className="low-stock-container-alt">
        <div className="loading-spinner-alt">
          <div className="spinner-alt"></div>
          <p>Loading inventory data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="low-stock-container-alt">
      <div className="low-stock-wrapper-alt">
        
        {/* Header */}
        <div className="low-stock-header-alt">
          <div className="header-content-alt">
            <h1 className="page-title-alt"> Low Stock Alerts</h1>
            <p className="page-subtitle-alt">Monitor inventory levels and get real-time alerts</p>
          </div>
          <div className="header-actions-alt">
            <button className="settings-btn-alt" onClick={() => setShowSettings(true)}>
              ⚙️ Alert Settings
            </button>
            <button className="export-btn-alt" onClick={exportToCSV} disabled={lowStockItems.length === 0}>
              📥 Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message-alt">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Branch Selector */}
        <div className="branch-selector-section-alt">
          <label>Select Branch:</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="branch-select-alt"
          >
            <option value="all">All Branches</option>
            {branches.map(b => (
              <option key={b._id} value={b.branch_id}>
                {b.branch_name} ({b.branch_id})
              </option>
            ))}
          </select>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid-alt">
          <div className="stat-card-alt critical-alt">
            <div className="stat-icon-alt"></div>
            <div className="stat-content-alt">
              <p className="stat-label-alt">Critical Alert</p>
              <p className="stat-value-alt">{criticalCount}</p>
              <p className="stat-description-alt">≤ {thresholdSettings.critical} units</p>
            </div>
          </div>
          
          <div className="stat-card-alt low-alt">
            <div className="stat-icon-alt"></div>
            <div className="stat-content-alt">
              <p className="stat-label-alt">Low Stock</p>
              <p className="stat-value-alt">{lowCount}</p>
              <p className="stat-description-alt">≤ {thresholdSettings.low} units</p>
            </div>
          </div>
          
          <div className="stat-card-alt medium-alt">
            <div className="stat-icon-alt"></div>
            <div className="stat-content-alt">
              <p className="stat-label-alt">Medium Alert</p>
              <p className="stat-value-alt">{mediumCount}</p>
              <p className="stat-description-alt">≤ {thresholdSettings.medium} units</p>
            </div>
          </div>
          
          <div className="stat-card-alt total-alt">
            <div className="stat-icon-alt"></div>
            <div className="stat-content-alt">
              <p className="stat-label-alt">Total Alerts</p>
              <p className="stat-value-alt">{lowStockItems.length}</p>
              <p className="stat-description-alt">Items need attention</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section-alt">
          <div className="search-bar-alt">
            <input
              type="text"
              placeholder=" Search by name, brand, or PID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="filters-grid-alt">
            <select
              value={filters.alertLevel}
              onChange={(e) => setFilters({ ...filters, alertLevel: e.target.value })}
            >
              <option value="all">All Alert Levels</option>
              <option value="critical"> Critical</option>
              <option value="low"> Low</option>
              <option value="medium"> Medium</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c === "all" ? "All Categories" : c.replace(/_/g, " ").toUpperCase()}
                </option>
              ))}
            </select>

            <select
              value={filters.brand}
              onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
            >
              {brands.map(b => (
                <option key={b} value={b}>
                  {b === "all" ? "All Brands" : b}
                </option>
              ))}
            </select>
            <button className="reset-btn-alt" onClick={resetFilters}>
               Reset
            </button>
          </div>
        </div>

        {/* Table */}
        {lowStockItems.length > 0 ? (
          <div className="table-container-alt">
            <table className="low-stock-table-alt">
              <thead>
                <tr>
                  <th>Alert</th>
                  <th onClick={() => handleSort("pid")}>
                    PID {getSortIcon("pid")}
                  </th>
                  <th onClick={() => handleSort("name")}>
                    Product Name {getSortIcon("name")}
                  </th>
                  <th onClick={() => handleSort("brand")}>
                    Brand {getSortIcon("brand")}
                  </th>
                  <th onClick={() => handleSort("pCategory")}>
                    Category {getSortIcon("pCategory")}
                  </th>
                  <th onClick={() => handleSort("branchName")}>
                    Branch {getSortIcon("branchName")}
                  </th>
                  <th onClick={() => handleSort("quantity")}>
                    Quantity {getSortIcon("quantity")}
                  </th>
                  <th onClick={() => handleSort("price")}>
                    Price {getSortIcon("price")}
                  </th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item, index) => (
                  <tr key={`${item.pid}-${item.branchId}-${index}`}>
                    <td>
                      <span 
                        className="alert-badge-alt"
                        style={{ backgroundColor: getAlertColor(item.quantity) }}
                        title={getAlertLevel(item.quantity)}
                      >
                        {getAlertIcon(item.quantity)}
                      </span>
                    </td>
                    <td className="pid-cell-alt">{item.pid}</td>
                    <td className="name-cell-alt">{item.name}</td>
                    <td>{item.brand}</td>
                    <td>
                      <span className="category-badge-alt">
                        {item.pCategory.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      <span className="branch-badge-alt">{item.branchName}</span>
                    </td>
                    <td>
                      <span 
                        className="quantity-badge-alt"
                        style={{ 
                          backgroundColor: getAlertColor(item.quantity),
                          color: "white",
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontWeight: "600"
                        }}
                      >
                        {item.quantity}
                      </span>
                    </td>
                    <td className="price-cell-alt">₹{item.price.toLocaleString()}</td>
                    <td className="date-cell-alt">
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
          <div className="empty-state-alt">
            <div className="empty-icon-alt"></div>
            <h3>All Good!</h3>
            <p>No low stock items found. All inventory levels are healthy.</p>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="modal-overlay-alt" onClick={() => setShowSettings(false)}>
            <div className="modal-content-alt settings-modal-alt" onClick={(e) => e.stopPropagation()}>
              <h2>⚙️ Alert Threshold Settings</h2>
              <p className="modal-description-alt">
                Set quantity thresholds for different alert levels
              </p>

              <div className="settings-form-alt">
                <div className="setting-item-alt critical-alt">
                  <label>
                    <span className="setting-icon-alt">🚨</span>
                    Critical Alert Threshold
                  </label>
                  <input
                    type="number"
                    value={tempSettings.critical}
                    onChange={(e) => setTempSettings({ ...tempSettings, critical: Number(e.target.value) })}
                    min="0"
                  />
                  <small>Items with quantity ≤ this value will show critical alert</small>
                </div>

                <div className="setting-item-alt low-alt">
                  <label>
                    <span className="setting-icon-alt">⚠️</span>
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    value={tempSettings.low}
                    onChange={(e) => setTempSettings({ ...tempSettings, low: Number(e.target.value) })}
                    min="0"
                  />
                  <small>Items with quantity ≤ this value will show low stock warning</small>
                </div>

                <div className="setting-item-alt medium-alt">
                  <label>
                    <span className="setting-icon-alt">⚡</span>
                    Medium Alert Threshold
                  </label>
                  <input
                    type="number"
                    value={tempSettings.medium}
                    onChange={(e) => setTempSettings({ ...tempSettings, medium: Number(e.target.value) })}
                    min="0"
                  />
                  <small>Items with quantity ≤ this value will show medium alert</small>
                </div>
              </div>

              <div className="modal-actions-alt">
                <button className="save-btn-alt" onClick={handleSaveSettings}>
                  💾 Save Settings
                </button>
                <button 
                  className="cancel-btn-alt" 
                  onClick={() => {
                    setShowSettings(false);
                    setTempSettings(thresholdSettings);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LowStockAlerts;