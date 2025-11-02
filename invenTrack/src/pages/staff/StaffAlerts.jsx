import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import "../../styles/StaffAlerts.css";
import { 
  FaExclamationTriangle, 
  FaExclamationCircle, 
  FaBolt, 
  FaCheckCircle, 
  FaBox, 
  FaSearch, 
  FaRedo, 
  FaDownload, 
  FaInfoCircle,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye
} from "react-icons/fa";
import "../../styles/StaffAlerts.css";

const StaffAlerts = () => {
  const [branchInfo, setBranchInfo] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [thresholdSettings] = useState({
    critical: 10,
    low: 50,
    medium: 100,
  });
  
  const [filters, setFilters] = useState({
    alertLevel: "all",
    category: "all",
    brand: "all",
    search: "",
    minQuantity: 0,
    maxQuantity: 1000,
  });

  const [sortConfig, setSortConfig] = useState({ key: "quantity", direction: "asc" });

  const iconColor = "#007bff";

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        setLoading(true);
        setError("");
        
        console.log("Fetching staff data...");
        
        const profileRes = await axiosInstance.get("/auth/me");
        console.log("Staff profile:", profileRes.data);
        
        const staffBranchId = profileRes.data.branch_id;
        
        if (!staffBranchId) {
          setError("You are not assigned to any branch. Please contact your manager.");
          setLoading(false);
          return;
        }

        const branchRes = await axiosInstance.get("/branches");
        const branch = branchRes.data.find(b => b.branch_id === staffBranchId);
        
        setBranchInfo({
          branch_id: staffBranchId,
          branch_name: branch?.branch_name || staffBranchId,
        });

        await fetchInventory(staffBranchId);
        
      } catch (err) {
        console.error("Error fetching staff data:", err);
        console.error("Error response:", err.response?.data);
        setError("Failed to load branch information");
      } finally {
        setLoading(false);
      }
    };

    fetchStaffData();
  }, []);

  useEffect(() => {
    filterLowStockItems();
  }, [inventory, filters]);

  const fetchInventory = async (branchId) => {
    try {
      console.log(`Fetching inventory for branch: ${branchId}`);
      
      const res = await axiosInstance.get(`/inventory/${branchId}`);
      console.log("Raw inventory response:", res.data);
      
      let inventoryData = res.data;
      
      if (res.data && res.data.inventoryItems && Array.isArray(res.data.inventoryItems)) {
        inventoryData = res.data.inventoryItems;
        console.log("Extracted inventoryItems array");
      }
      
      if (Array.isArray(res.data)) {
        inventoryData = res.data;
        console.log("Using direct array response");
      }
      
      console.log(`Loaded ${inventoryData.length} products`);
      setInventory(inventoryData);
      
    } catch (err) {
      console.error("Error fetching inventory:", err);
      console.error("Error details:", err.response?.data);
      setError("Failed to load inventory");
    }
  };

  const filterLowStockItems = () => {
    let filtered = inventory.filter(item => {
      const qty = Number(item.quantity) || 0;
      return qty <= thresholdSettings.medium;
    });

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchLower) ||
        item.brand?.toLowerCase().includes(searchLower) ||
        item.pid?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.category !== "all") {
      filtered = filtered.filter(item => item.pCategory === filters.category);
    }

    if (filters.brand !== "all") {
      filtered = filtered.filter(item => item.brand === filters.brand);
    }

    filtered = filtered.filter(item => {
      const qty = Number(item.quantity) || 0;
      return qty >= filters.minQuantity && qty <= filters.maxQuantity;
    });

    if (filters.alertLevel !== "all") {
      filtered = filtered.filter(item => {
        const qty = Number(item.quantity) || 0;
        const level = getAlertLevel(qty);
        return level === filters.alertLevel;
      });
    }

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
      case "critical": return <FaExclamationTriangle style={{ color: iconColor }} />;
      case "low": return <FaExclamationCircle style={{ color: iconColor }} />;
      case "medium": return <FaBolt style={{ color: iconColor }} />;
      default: return <FaCheckCircle style={{ color: iconColor }} />;
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort style={{ marginLeft: '5px' }} />;
    return sortConfig.direction === "asc" ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />;
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

  const categories = ["all", ...new Set(inventory.map(i => i.pCategory).filter(Boolean))];
  const brands = ["all", ...new Set(inventory.map(i => i.brand).filter(Boolean))];

  const criticalCount = lowStockItems.filter(i => getAlertLevel(i.quantity) === "critical").length;
  const lowCount = lowStockItems.filter(i => getAlertLevel(i.quantity) === "low").length;
  const mediumCount = lowStockItems.filter(i => getAlertLevel(i.quantity) === "medium").length;

  if (loading) {
    return (
      <div className="low-stock-container-staff-alt">
        <div className="loading-spinner-staff-alt">
          <div className="spinner-staff-alt"></div>
          <p>Loading inventory data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="low-stock-container-staff-alt">
      <div className="low-stock-wrapper-staff-alt">
        
        <div className="low-stock-header-staff-alt">
          <div className="header-content-staff-alt">
            <h2>Stock Alerts</h2>
            <p className="page-subtitle-staff-alt">
              {branchInfo ? `${branchInfo.branch_name} (${branchInfo.branch_id})` : "Loading branch..."}
            </p>
          </div>
          <div className="header-actions-staff-alt">
            <div className="view-only-badge-staff-alt">
              <FaEye style={{ marginRight: '5px', color: iconColor }} />
              Read-Only Access
            </div>
            <button className="export-btn-staff-alt" onClick={exportToCSV} disabled={lowStockItems.length === 0}>
              <FaDownload style={{ marginRight: '5px' }} />
              Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message-staff-alt">
            <FaExclamationTriangle style={{ marginRight: '8px' }} /> {error}
          </div>
        )}

        <div className="stats-grid-staff-alt">
          <div className="stat-card-staff-alt critical-staff-alt">
            <div className="stat-icon-staff-alt">
              <FaExclamationTriangle style={{ color: iconColor, fontSize: '24px' }} />
            </div>
            <div className="stat-content-staff-alt">
              <p className="stat-label-staff-alt">Critical Alert</p>
              <p className="stat-value-staff-alt">{criticalCount}</p>
              <p className="stat-description-staff-alt">≤ {thresholdSettings.critical} units</p>
            </div>
          </div>
          
          <div className="stat-card-staff-alt low-staff-alt">
            <div className="stat-icon-staff-alt">
              <FaExclamationCircle style={{ color: iconColor, fontSize: '24px' }} />
            </div>
            <div className="stat-content-staff-alt">
              <p className="stat-label-staff-alt">Low Stock</p>
              <p className="stat-value-staff-alt">{lowCount}</p>
              <p className="stat-description-staff-alt">≤ {thresholdSettings.low} units</p>
            </div>
          </div>
          
          <div className="stat-card-staff-alt medium-staff-alt">
            <div className="stat-icon-staff-alt">
              <FaBolt style={{ color: iconColor, fontSize: '24px' }} />
            </div>
            <div className="stat-content-staff-alt">
              <p className="stat-label-staff-alt">Medium Alert</p>
              <p className="stat-value-staff-alt">{mediumCount}</p>
              <p className="stat-description-staff-alt">≤ {thresholdSettings.medium} units</p>
            </div>
          </div>
          
          <div className="stat-card-staff-alt total-staff-alt">
            <div className="stat-icon-staff-alt">
              <FaBox style={{ color: iconColor, fontSize: '24px' }} />
            </div>
            <div className="stat-content-staff-alt">
              <p className="stat-label-staff-alt">Total Alerts</p>
              <p className="stat-value-staff-alt">{lowStockItems.length}</p>
              <p className="stat-description-staff-alt">Items need attention</p>
            </div>
          </div>
        </div>

        <div className="filters-section-staff-alt">
          <div className="search-bar-staff-alt">
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input
              type="text"
              placeholder="Search by name, brand, or PID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{ paddingLeft: '40px' }}
            />
          </div>

          <div className="filters-grid-staff-alt">
            <select
              value={filters.alertLevel}
              onChange={(e) => setFilters({ ...filters, alertLevel: e.target.value })}
            >
              <option value="all">All Alert Levels</option>
              <option value="critical">Critical</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
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

            <button className="reset-btn-staff-alt" onClick={resetFilters}>
              <FaRedo style={{ marginRight: '5px' }} />
              Reset
            </button>
          </div>
        </div>

        {lowStockItems.length > 0 ? (
          <div className="table-container-staff-alt">
            <table className="low-stock-table-staff-alt">
              <thead>
                <tr>
                  <th>Alert</th>
                  <th onClick={() => handleSort("pid")} style={{ cursor: 'pointer' }}>
                    PID {getSortIcon("pid")}
                  </th>
                  <th onClick={() => handleSort("name")} style={{ cursor: 'pointer' }}>
                    Product Name {getSortIcon("name")}
                  </th>
                  <th onClick={() => handleSort("brand")} style={{ cursor: 'pointer' }}>
                    Brand {getSortIcon("brand")}
                  </th>
                  <th onClick={() => handleSort("pCategory")} style={{ cursor: 'pointer' }}>
                    Category {getSortIcon("pCategory")}
                  </th>
                  <th onClick={() => handleSort("quantity")} style={{ cursor: 'pointer' }}>
                    Quantity {getSortIcon("quantity")}
                  </th>
                  <th onClick={() => handleSort("price")} style={{ cursor: 'pointer' }}>
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
                        className="alert-badge-staff-alt"
                        style={{ backgroundColor: getAlertColor(item.quantity) }}
                        title={getAlertLevel(item.quantity)}
                      >
                        {getAlertIcon(item.quantity)}
                      </span>
                    </td>
                    <td className="pid-cell-staff-alt">{item.pid}</td>
                    <td className="name-cell-staff-alt">{item.name}</td>
                    <td>{item.brand}</td>
                    <td>
                      <span className="category-badge-staff-alt">
                        {item.pCategory?.replace(/_/g, " ") || "-"}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="quantity-badge-staff-alt"
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
                    <td className="price-cell-staff-alt">₹{Number(item.price || 0).toLocaleString()}</td>
                    <td className="date-cell-staff-alt">
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
          <div className="empty-state-staff-alt">
            <div className="empty-icon-staff-alt">
              <FaCheckCircle style={{ color: iconColor, fontSize: '64px' }} />
            </div>
            <h3>All Good!</h3>
            <p>No low stock items found in your branch. All inventory levels are healthy.</p>
          </div>
        )}

        <div className="info-banner-staff-alt">
          <FaInfoCircle style={{ marginRight: '8px', color: iconColor, fontSize: '20px' }} />
          <p>You have read-only access to stock alerts. Contact your manager to adjust alert thresholds or update inventory.</p>
        </div>
      </div>
    </div>
  );
};

export default StaffAlerts;