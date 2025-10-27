import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import "../../styles/ManagerLowStockAlerts.css";

const ManagerLowStockAlerts = () => {
  const [branchInfo, setBranchInfo] = useState(null);
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

  // Fetch manager's branch and inventory on mount
  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        setLoading(true);
        setError("");
        
        const token = localStorage.getItem("token");
        
        // Get manager's profile to get branch_id
        const profileRes = await axiosInstance.get("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const managerBranchId = profileRes.data.branch_id;
        
        if (!managerBranchId) {
          setError("You are not assigned to any branch. Please contact admin.");
          setLoading(false);
          return;
        }

        // Get branch details
        const branchRes = await axiosInstance.get("/branches");
        const branch = branchRes.data.find(b => b.branch_id === managerBranchId);
        
        setBranchInfo({
          branch_id: managerBranchId,
          branch_name: branch?.branch_name || managerBranchId,
        });

        // Fetch inventory for manager's branch
        await fetchInventory(managerBranchId);
        
      } catch (err) {
        console.error("Error fetching manager data:", err);
        setError("Failed to load branch information");
      } finally {
        setLoading(false);
      }
    };

    fetchManagerData();
  }, []);

  // Filter items when inventory or filters change
  useEffect(() => {
    filterLowStockItems();
  }, [inventory, filters, thresholdSettings]);

  const fetchInventory = async (branchId) => {
    try {
      const res = await axiosInstance.get(`/inventory/${branchId}`);
      setInventory(res.data);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError("Failed to load inventory");
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
    const headers = ["PID", "Name", "Brand", "Category", "Quantity", "Alert Level", "Price", "Last Updated"];
    const rows = lowStockItems.map(item => [
      item.pid,
      item.name,
      item.brand,
      item.pCategory,
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
    a.download = `low-stock-alerts-${branchInfo?.branch_name || 'branch'}-${new Date().toISOString().split('T')[0]}.csv`;
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
      <div className="low-stock-container-man-alt">
        <div className="loading-spinner-man-alt">
          <div className="spinner-man-alt"></div>
          <p>Loading inventory data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="low-stock-container-man-alt">
      <div className="low-stock-wrapper-man-alt">
        
        {/* Header */}
        <div className="low-stock-header-man-alt">
          <div className="header-content-man-alt">
            <h1 className="page-title-man-alt"> Low Stock Alerts</h1>
          </div>
          <div className="header-actions-man-alt">
            <button className="settings-btn-man-alt" onClick={() => setShowSettings(true)}>
              ⚙️ Alert Settings
            </button>
            <button className="export-btn-man-alt" onClick={exportToCSV} disabled={lowStockItems.length === 0}>
              📥 Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message-man-alt">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Branch Info Banner */}
        {branchInfo && (
          <div className="branch-info-banner-man-alt">
            <div className="banner-content-man-alt">
              <p className="banner-title-man-alt">Your Branch</p>
              <p className="banner-value-man-alt">{branchInfo.branch_name}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-grid-man-alt">
          <div className="stat-card-man-alt critical-man-alt">
            <div className="stat-icon-man-alt">🚨</div>
            <div className="stat-content-man-alt">
              <p className="stat-label-man-alt">Critical Alert</p>
              <p className="stat-value-man-alt">{criticalCount}</p>
              <p className="stat-description-man-alt">≤ {thresholdSettings.critical} units</p>
            </div>
          </div>
          
          <div className="stat-card-man-alt low-man-alt">
            <div className="stat-icon-man-alt">⚠️</div>
            <div className="stat-content-man-alt">
              <p className="stat-label-man-alt">Low Stock</p>
              <p className="stat-value-man-alt">{lowCount}</p>
              <p className="stat-description-man-alt">≤ {thresholdSettings.low} units</p>
            </div>
          </div>
          
          <div className="stat-card-man-alt medium-man-alt">
            <div className="stat-icon-man-alt">⚡</div>
            <div className="stat-content-man-alt">
              <p className="stat-label-man-alt">Medium Alert</p>
              <p className="stat-value-man-alt">{mediumCount}</p>
              <p className="stat-description-man-alt">≤ {thresholdSettings.medium} units</p>
            </div>
          </div>
          
          <div className="stat-card-man-alt total-man-alt">
            <div className="stat-icon-man-alt">📦</div>
            <div className="stat-content-man-alt">
              <p className="stat-label-man-alt">Total Alerts</p>
              <p className="stat-value-man-alt">{lowStockItems.length}</p>
              <p className="stat-description-man-alt">Items need attention</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section-man-alt">
          <div className="search-bar-man-alt">
            <input
              type="text"
              placeholder="🔍 Search by name, brand, or PID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="filters-grid-man-alt">
            <select
              value={filters.alertLevel}
              onChange={(e) => setFilters({ ...filters, alertLevel: e.target.value })}
            >
              <option value="all">All Alert Levels</option>
              <option value="critical">🚨 Critical</option>
              <option value="low">⚠️ Low</option>
              <option value="medium">⚡ Medium</option>
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

            <button className="reset-btn-man-alt" onClick={resetFilters}>
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Table */}
        {lowStockItems.length > 0 ? (
          <div className="table-container-man-alt">
            <table className="low-stock-table-man-alt">
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
                  <tr key={`${item.pid}-${index}`}>
                    <td>
                      <span 
                        className="alert-badge-man-alt"
                        style={{ backgroundColor: getAlertColor(item.quantity) }}
                        title={getAlertLevel(item.quantity)}
                      >
                        {getAlertIcon(item.quantity)}
                      </span>
                    </td>
                    <td className="pid-cell-man-alt">{item.pid}</td>
                    <td className="name-cell-man-alt">{item.name}</td>
                    <td>{item.brand}</td>
                    <td>
                      <span className="category-badge-man-alt">
                        {item.pCategory.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="quantity-badge-man-alt"
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
                    <td className="price-cell-man-alt">₹{item.price.toLocaleString()}</td>
                    <td className="date-cell-man-alt">
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
          <div className="empty-state-man-alt">
            <div className="empty-icon-man-alt">✅</div>
            <h3>All Good!</h3>
            <p>No low stock items found in your branch. All inventory levels are healthy.</p>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="modal-overlay-man-alt" onClick={() => setShowSettings(false)}>
            <div className="modal-content-man-alt settings-modal-man-alt" onClick={(e) => e.stopPropagation()}>
              <h2>⚙️ Alert Threshold Settings</h2>
              <p className="modal-description-man-alt">
                Set quantity thresholds for different alert levels
              </p>

              <div className="settings-form-man-alt">
                <div className="setting-item-man-alt critical-man-alt">
                  <label>
                    <span className="setting-icon-man-alt">🚨</span>
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

                <div className="setting-item-man-alt low-man-alt">
                  <label>
                    <span className="setting-icon-man-alt">⚠️</span>
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

                <div className="setting-item-man-alt medium-man-alt">
                  <label>
                    <span className="setting-icon-man-alt">⚡</span>
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

              <div className="modal-actions-man-alt">
                <button className="save-btn-man-alt" onClick={handleSaveSettings}>
                  💾 Save Settings
                </button>
                <button 
                  className="cancel-btn-man-alt" 
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

export default ManagerLowStockAlerts;