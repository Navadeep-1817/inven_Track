import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users, Calendar, Download, Store, Award, Activity } from 'lucide-react';
import '../styles/ManagerDashboard.css';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_BASE = `${API_BASE_URL}/api`;

const ManagerDashboard = () => {
  const [branchInfo, setBranchInfo] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [bills, setBills] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [view, setView] = useState('overview');

  // Get auth token
  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  // Get user info from token
  const getUserInfo = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchManagerBranchData();
  }, [dateRange]);

  const fetchManagerBranchData = async () => {
    setLoading(true);
    try {
      const userInfo = getUserInfo();
      console.log('👤 User info from token:', userInfo);

      // Fetch branch info first
      const branchesRes = await axios.get(`${API_BASE}/branches`);
      const userBranch = branchesRes.data.find(b => b.branch_id === userInfo.branchId);
      
      if (!userBranch) {
        setError('Branch not found. Please contact administrator.');
        setLoading(false);
        return;
      }

      setBranchInfo(userBranch);
      console.log('🏢 Manager branch:', userBranch);

      // Fetch data for manager's branch in parallel
      const [inventoryRes, billsRes, staffRes] = await Promise.all([
        axios.get(`${API_BASE}/inventory/${userBranch.branch_id}`, getAuthConfig())
          .catch(err => {
            console.warn('⚠️ Inventory fetch error:', err.response?.data || err.message);
            return { data: [] };
          }),
        axios.get(`${API_BASE}/bills/branch/${userBranch.branch_id}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=1000`, getAuthConfig())
          .catch(err => {
            console.warn('⚠️ Bills fetch error:', err.response?.data || err.message);
            return { data: { bills: [] } };
          }),
        axios.get(`${API_BASE}/staff/branches/${userBranch.branch_id}/staff`, getAuthConfig())
          .catch(err => {
            console.warn('⚠️ Staff fetch error:', err.response?.data || err.message);
            return { data: [] };
          })
      ]);

      console.log('📦 Inventory data:', inventoryRes.data);
      console.log('📝 Bills data:', billsRes.data);
      console.log('👥 Staff data:', staffRes.data);

      setInventory(Array.isArray(inventoryRes.data) ? inventoryRes.data : []);
      setBills(billsRes.data.bills || billsRes.data || []);
      setStaff(Array.isArray(staffRes.data) ? staffRes.data : []);
      setError(null);
    } catch (error) {
      console.error('❌ Error fetching branch data:', error);
      setError('Failed to fetch branch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    if (!bills.length) {
      console.warn('⚠️ No bills data available');
      return null;
    }

    const completedBills = bills.filter(b => b.status === 'completed');
    const totalRevenue = completedBills.reduce((sum, bill) => sum + (bill.totals?.total || 0), 0);
    const totalBills = completedBills.length;
    const avgBillValue = totalBills > 0 ? totalRevenue / totalBills : 0;
    
    const productSales = {};
    completedBills.forEach(bill => {
      bill.items?.forEach(item => {
        if (!productSales[item.pid]) {
          productSales[item.pid] = {
            pid: item.pid,
            name: item.name,
            category: item.category,
            totalQuantity: 0,
            totalRevenue: 0,
            billCount: 0
          };
        }
        productSales[item.pid].totalQuantity += item.quantity;
        productSales[item.pid].totalRevenue += item.amount;
        productSales[item.pid].billCount += 1;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    const bottomProducts = Object.values(productSales)
      .sort((a, b) => a.totalRevenue - b.totalRevenue)
      .slice(0, 5);

    const categoryRevenue = {};
    Object.values(productSales).forEach(product => {
      const cat = product.category || 'Uncategorized';
      if (!categoryRevenue[cat]) {
        categoryRevenue[cat] = { name: cat, revenue: 0, quantity: 0 };
      }
      categoryRevenue[cat].revenue += product.totalRevenue;
      categoryRevenue[cat].quantity += product.totalQuantity;
    });

    const categoryData = Object.values(categoryRevenue)
      .sort((a, b) => b.revenue - a.revenue);

    // Calculate brand-wise performance
    const brandRevenue = {};
    completedBills.forEach(bill => {
      bill.items?.forEach(item => {
        const brand = item.brand || 'Unknown';
        if (!brandRevenue[brand]) {
          brandRevenue[brand] = { name: brand, revenue: 0, quantity: 0, products: 0 };
        }
        brandRevenue[brand].revenue += item.amount;
        brandRevenue[brand].quantity += item.quantity;
        brandRevenue[brand].products += 1;
      });
    });

    const brandData = Object.values(brandRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const revenueTrend = {};
    completedBills.forEach(bill => {
      const date = new Date(bill.billDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!revenueTrend[date]) {
        revenueTrend[date] = { date, revenue: 0, bills: 0 };
      }
      revenueTrend[date].revenue += bill.totals?.total || 0;
      revenueTrend[date].bills += 1;
    });

    const trendData = Object.values(revenueTrend).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    const paymentMethods = {};
    completedBills.forEach(bill => {
      const method = bill.paymentMethod || 'Cash';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { name: method, count: 0, revenue: 0 };
      }
      paymentMethods[method].count += 1;
      paymentMethods[method].revenue += bill.totals?.total || 0;
    });

    const totalProducts = inventory.length;
    const totalStock = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalInventoryValue = inventory.reduce((sum, item) => 
      sum + ((item.price || 0) * (item.quantity || 0)), 0
    );

    const staffPerformance = {};
    completedBills.forEach(bill => {
      const staffName = bill.staffName || 'Unknown';
      if (!staffPerformance[staffName]) {
        staffPerformance[staffName] = { name: staffName, bills: 0, revenue: 0 };
      }
      staffPerformance[staffName].bills += 1;
      staffPerformance[staffName].revenue += bill.totals?.total || 0;
    });

    const topStaff = Object.values(staffPerformance)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const midPoint = new Date((new Date(dateRange.startDate).getTime() + new Date(dateRange.endDate).getTime()) / 2);
    const firstHalfRevenue = completedBills
      .filter(b => new Date(b.billDate) < midPoint)
      .reduce((sum, b) => sum + (b.totals?.total || 0), 0);
    const secondHalfRevenue = completedBills
      .filter(b => new Date(b.billDate) >= midPoint)
      .reduce((sum, b) => sum + (b.totals?.total || 0), 0);
    const growthRate = firstHalfRevenue > 0 ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalBills,
      avgBillValue,
      totalProducts,
      totalStock,
      totalInventoryValue,
      growthRate,
      topProducts,
      bottomProducts,
      categoryData,
      brandData,
      trendData,
      paymentMethods: Object.values(paymentMethods),
      topStaff,
      staffCount: staff.length
    };
  };

  const metrics = calculateMetrics();

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const exportReport = () => {
    if (!metrics || !branchInfo) return;
    
    const report = {
      branch: branchInfo.branch_name,
      location: branchInfo.branch_location,
      dateRange: dateRange,
      generatedBy: getUserInfo()?.name || 'Manager',
      generatedAt: new Date().toISOString(),
      summary: {
        totalRevenue: metrics.totalRevenue,
        totalBills: metrics.totalBills,
        avgBillValue: metrics.avgBillValue,
        growthRate: metrics.growthRate,
        totalProducts: metrics.totalProducts,
        totalStock: metrics.totalStock
      },
      topProducts: metrics.topProducts,
      categoryPerformance: metrics.categoryData,
      brandPerformance: metrics.brandData,
      staffPerformance: metrics.topStaff
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${branchInfo.branch_name}_report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  if (loading) {
    return (
      <div className="loading-container-mngdsb">
        <div className="loading-content-mngdsb">
          <div className="loading-spinner-mngdsb"></div>
          <p className="loading-text-mngdsb">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !branchInfo) {
    return (
      <div className="dashboard-container-mngdsb">
        <div className="dashboard-header-mngdsb">
          <h1 className="dashboard-title-mngdsb">Branch Performance Dashboard</h1>
        </div>
        <div className="no-data-container-mngdsb">
          <Store className="no-data-icon-mngdsb" size={48} />
          <h3 className="no-data-title-mngdsb">Unable to Load Dashboard</h3>
          <p className="no-data-text-mngdsb">
            {error || 'Unable to fetch branch information. Please contact administrator.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container-mngdsb">
      <div className="dashboard-header-mngdsb">
        <h1 className="dashboard-title-mngdsb">Branch Performance Dashboard</h1>
        <p className="dashboard-subtitle-mngdsb">
          {branchInfo.branch_name} - {branchInfo.branch_location}
        </p>
      </div>

      <div className="controls-container-mngdsb">
        <div className="controls-content-mngdsb">
          <div className="branch-selector-mngdsb">
            <Store className="branch-icon-mngdsb" size={24} />
            <span className="branch-name-mngdsb">
              {branchInfo.branch_name}
            </span>
          </div>

          <div className="date-range-selector-mngdsb">
            <Calendar className="calendar-icon-mngdsb" size={20} />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="date-input-mngdsb"
            />
            <span className="date-separator-mngdsb">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="date-input-mngdsb"
            />
          </div>

          <button onClick={exportReport} className="export-button-mngdsb" disabled={!metrics}>
            <Download size={20} />
            Export Report
          </button>
        </div>
      </div>

      <div className="view-tabs-mngdsb">
        {['overview', 'products', 'revenue', 'brands'].map(tab => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`view-tab-mngdsb ${view === tab ? 'view-tab-active-mngdsb' : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {metrics ? (
        <>
          {view === 'overview' && (
            <>
              <div className="metrics-grid-mngdsb">
                <MetricCard
                  title="Total Revenue"
                  value={`$${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  icon={<DollarSign size={24} />}
                  change={metrics.growthRate}
                  positive={metrics.growthRate > 0}
                  bgColor="metric-bg-blue-mngdsb"
                  iconColor="metric-icon-blue-mngdsb"
                />
                <MetricCard
                  title="Total Bills"
                  value={metrics.totalBills}
                  icon={<ShoppingCart size={24} />}
                  subtitle={`Avg: $${metrics.avgBillValue.toFixed(2)}`}
                  bgColor="metric-bg-green-mngdsb"
                  iconColor="metric-icon-green-mngdsb"
                />
                <MetricCard
                  title="Products in Stock"
                  value={metrics.totalStock}
                  icon={<Package size={24} />}
                  subtitle={`${metrics.totalProducts} unique products`}
                  bgColor="metric-bg-purple-mngdsb"
                  iconColor="metric-icon-purple-mngdsb"
                />
                <MetricCard
                  title="Staff Members"
                  value={metrics.staffCount}
                  icon={<Users size={24} />}
                  subtitle="Active employees"
                  bgColor="metric-bg-orange-mngdsb"
                  iconColor="metric-icon-orange-mngdsb"
                />
              </div>

              <div className="charts-grid-mngdsb">
                <div className="chart-card-mngdsb">
                  <h3 className="chart-title-mngdsb">
                    <Activity size={20} className="chart-title-icon-mngdsb" />
                    Revenue Trend
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics.trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                        formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card-mngdsb">
                  <h3 className="chart-title-mngdsb">Category Revenue</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={metrics.categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {metrics.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {metrics.topStaff.length > 0 && (
                <div className="staff-performance-card-mngdsb">
                  <h3 className="staff-performance-title-mngdsb">
                    <Award size={20} className="staff-performance-icon-mngdsb" />
                    Top Performing Staff
                  </h3>
                  <div className="staff-grid-mngdsb">
                    {metrics.topStaff.map((staff, index) => (
                      <div key={staff.name} className="staff-item-mngdsb">
                        <div className="staff-header-mngdsb">
                          <span className={`staff-rank-mngdsb staff-rank-${index + 1}-mngdsb`}>
                            #{index + 1}
                          </span>
                          <span className="staff-bills-mngdsb">{staff.bills} bills</span>
                        </div>
                        <p className="staff-name-mngdsb">{staff.name}</p>
                        <p className="staff-revenue-mngdsb">
                          ${staff.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="payment-methods-card-mngdsb">
                <h3 className="payment-methods-title-mngdsb">Payment Methods</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metrics.paymentMethods}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                      formatter={(value, name) => [
                        name === 'revenue' ? `$${value.toLocaleString()}` : value,
                        name === 'revenue' ? 'Revenue' : 'Count'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#10b981" name="Transaction Count" />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {view === 'products' && (
            <>
              {metrics.topProducts.length > 0 ? (
                <>
                  <div className="products-section-mngdsb">
                    <h3 className="products-title-mngdsb">
                      <TrendingUp size={20} className="products-icon-mngdsb" />
                      Top 10 Performing Products
                    </h3>
                    <div className="products-table-container-mngdsb">
                      <table className="products-table-mngdsb">
                        <thead>
                          <tr className="products-table-header-mngdsb">
                            <th className="table-header-cell-mngdsb">Rank</th>
                            <th className="table-header-cell-mngdsb">Product ID</th>
                            <th className="table-header-cell-mngdsb">Name</th>
                            <th className="table-header-cell-mngdsb">Category</th>
                            <th className="table-header-cell-right-mngdsb">Units Sold</th>
                            <th className="table-header-cell-right-mngdsb">Revenue</th>
                            <th className="table-header-cell-right-mngdsb">Bills</th>
                            <th className="table-header-cell-right-mngdsb">Avg/Bill</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.topProducts.map((product, index) => (
                            <tr key={product.pid} className="table-row-mngdsb">
                              <td className="table-cell-mngdsb">
                                <span className={`rank-badge-mngdsb rank-badge-${index + 1}-mngdsb`}>
                                  {index + 1}
                                </span>
                              </td>
                              <td className="table-cell-mngdsb table-cell-medium-mngdsb">{product.pid}</td>
                              <td className="table-cell-mngdsb">{product.name || 'N/A'}</td>
                              <td className="table-cell-mngdsb">
                                <span className="category-badge-mngdsb">
                                  {product.category || 'N/A'}
                                </span>
                              </td>
                              <td className="table-cell-right-mngdsb table-cell-medium-mngdsb">
                                {product.totalQuantity.toLocaleString()}
                              </td>
                              <td className="table-cell-right-mngdsb table-cell-revenue-mngdsb">
                                ${product.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="table-cell-right-mngdsb">{product.billCount}</td>
                              <td className="table-cell-right-mngdsb">
                                ${(product.totalRevenue / product.billCount).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {metrics.bottomProducts.length > 0 && (
                    <div className="bottom-products-section-mngdsb">
                      <h3 className="bottom-products-title-mngdsb">
                        <TrendingDown size={20} className="bottom-products-icon-mngdsb" />
                        Bottom 5 Performing Products (Action Required)
                      </h3>
                      <div className="products-table-container-mngdsb">
                        <table className="products-table-mngdsb">
                          <thead>
                            <tr className="products-table-header-mngdsb">
                              <th className="table-header-cell-mngdsb">Product ID</th>
                              <th className="table-header-cell-mngdsb">Name</th>
                              <th className="table-header-cell-mngdsb">Category</th>
                              <th className="table-header-cell-right-mngdsb">Units Sold</th>
                              <th className="table-header-cell-right-mngdsb">Revenue</th>
                              <th className="table-header-cell-center-mngdsb">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {metrics.bottomProducts.map((product) => (
                              <tr key={product.pid} className="table-row-bottom-mngdsb">
                                <td className="table-cell-mngdsb table-cell-medium-mngdsb">{product.pid}</td>
                                <td className="table-cell-mngdsb">{product.name || 'N/A'}</td>
                                <td className="table-cell-mngdsb">
                                  <span className="category-badge-gray-mngdsb">
                                    {product.category || 'N/A'}
                                  </span>
                                </td>
                                <td className="table-cell-right-mngdsb">{product.totalQuantity}</td>
                                <td className="table-cell-right-mngdsb">
                                  ${product.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="table-cell-center-mngdsb">
                                  <span className="status-badge-mngdsb">Low Sales</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="recommendation-card-mngdsb">
                        <p className="recommendation-text-mngdsb">
                          <strong>Recommendation:</strong> Consider promotional strategies, price adjustments, or discontinuing these products based on profitability analysis.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-data-container-mngdsb">
                  <Package className="no-data-icon-mngdsb" size={48} />
                  <h3 className="no-data-title-mngdsb">No Product Sales Data</h3>
                  <p className="no-data-text-mngdsb">
                    No products have been sold in the selected date range.
                  </p>
                </div>
              )}
            </>
          )}

          {view === 'revenue' && (
            <>
              <div className="revenue-summary-grid-mngdsb">
                <div className="revenue-card-blue-mngdsb">
                  <h3 className="revenue-card-label-mngdsb">Total Revenue</h3>
                  <p className="revenue-card-value-mngdsb">
                    ${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="revenue-card-subtitle-mngdsb">From {metrics.totalBills} transactions</p>
                </div>
                <div className="revenue-card-green-mngdsb">
                  <h3 className="revenue-card-label-mngdsb">Average Bill Value</h3>
                  <p className="revenue-card-value-mngdsb">${metrics.avgBillValue.toFixed(2)}</p>
                  <p className="revenue-card-subtitle-mngdsb">Per transaction</p>
                </div>
                <div className="revenue-card-purple-mngdsb">
                  <h3 className="revenue-card-label-mngdsb">Inventory Value</h3>
                  <p className="revenue-card-value-mngdsb">
                    ${metrics.totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="revenue-card-subtitle-mngdsb">{metrics.totalStock} units in stock</p>
                </div>
              </div>

              {metrics.categoryData.length > 0 && (
                <div className="revenue-by-category-card-mngdsb">
                  <h3 className="revenue-by-category-title-mngdsb">Revenue by Category</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={metrics.categoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" />
                      <YAxis dataKey="name" type="category" stroke="#6b7280" width={120} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                        formatter={(value, name) => [
                          name === 'revenue' ? `$${value.toLocaleString()}` : value,
                          name === 'revenue' ? 'Revenue' : 'Quantity'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Revenue ($)" />
                      <Bar dataKey="quantity" fill="#10b981" name="Units Sold" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="daily-revenue-card-mngdsb">
                <h3 className="daily-revenue-title-mngdsb">Daily Revenue Breakdown</h3>
                <div className="daily-revenue-table-container-mngdsb">
                  <table className="daily-revenue-table-mngdsb">
                    <thead>
                      <tr className="daily-revenue-header-mngdsb">
                        <th className="table-header-cell-mngdsb">Date</th>
                        <th className="table-header-cell-right-mngdsb">Bills Count</th>
                        <th className="table-header-cell-right-mngdsb">Revenue</th>
                        <th className="table-header-cell-right-mngdsb">Avg Bill</th>
                        <th className="table-header-cell-right-mngdsb">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.trendData.slice().reverse().map((day) => {
                        const avgBill = day.bills > 0 ? day.revenue / day.bills : 0;
                        const performanceRating = day.revenue > metrics.avgBillValue * day.bills ? 'High' : 
                                                 day.revenue > (metrics.avgBillValue * day.bills * 0.7) ? 'Medium' : 'Low';
                        return (
                          <tr key={day.date} className="daily-revenue-row-mngdsb">
                            <td className="table-cell-mngdsb table-cell-medium-mngdsb">{day.date}</td>
                            <td className="table-cell-right-mngdsb">{day.bills}</td>
                            <td className="table-cell-right-mngdsb table-cell-bold-mngdsb">
                              ${day.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="table-cell-right-mngdsb">${avgBill.toFixed(2)}</td>
                            <td className="table-cell-right-mngdsb">
                              <span className={`performance-badge-mngdsb performance-badge-${performanceRating.toLowerCase()}-mngdsb`}>
                                {performanceRating}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="daily-revenue-footer-mngdsb">
                        <td className="table-cell-mngdsb table-cell-bold-mngdsb">Total</td>
                        <td className="table-cell-right-mngdsb table-cell-bold-mngdsb">{metrics.totalBills}</td>
                        <td className="table-cell-right-mngdsb table-footer-revenue-mngdsb">
                          ${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="table-cell-right-mngdsb table-cell-bold-mngdsb">
                          ${metrics.avgBillValue.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}

          {view === 'brands' && (
            <>
              <div className="revenue-by-category-card-mngdsb">
                <h3 className="revenue-by-category-title-mngdsb">
                  <Award size={20} style={{ marginRight: '8px' }} />
                  Brand-wise Performance
                </h3>
                {metrics.brandData && metrics.brandData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={500}>
                    <BarChart data={metrics.brandData} layout="horizontal" margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#6b7280" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                        formatter={(value, name) => {
                          if (name === 'revenue') return [`${value.toLocaleString()}`, 'Revenue'];
                          if (name === 'quantity') return [value.toLocaleString(), 'Units Sold'];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Revenue ($)" />
                      <Bar dataKey="quantity" fill="#10b981" name="Units Sold" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="no-data-container-mngdsb" style={{ marginTop: '40px' }}>
                    <Package className="no-data-icon-mngdsb" size={48} />
                    <h3 className="no-data-title-mngdsb">No Brand Data</h3>
                    <p className="no-data-text-mngdsb">
                      No brand information available for the selected date range.
                    </p>
                  </div>
                )}
              </div>

              {metrics.brandData && metrics.brandData.length > 0 && (
                <div className="products-section-mngdsb" style={{ marginTop: '30px' }}>
                  <h3 className="products-title-mngdsb">Brand Performance Details</h3>
                  <div className="products-table-container-mngdsb">
                    <table className="products-table-mngdsb">
                      <thead>
                        <tr className="products-table-header-mngdsb">
                          <th className="table-header-cell-mngdsb">Rank</th>
                          <th className="table-header-cell-mngdsb">Brand Name</th>
                          <th className="table-header-cell-right-mngdsb">Total Revenue</th>
                          <th className="table-header-cell-right-mngdsb">Units Sold</th>
                          <th className="table-header-cell-right-mngdsb">Products</th>
                          <th className="table-header-cell-right-mngdsb">Avg Revenue/Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.brandData.map((brand, index) => (
                          <tr key={brand.name} className="table-row-mngdsb">
                            <td className="table-cell-mngdsb">
                              <span className={`rank-badge-mngdsb rank-badge-${index + 1}-mngdsb`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="table-cell-mngdsb table-cell-medium-mngdsb">{brand.name}</td>
                            <td className="table-cell-right-mngdsb table-cell-revenue-mngdsb">
                              ${brand.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="table-cell-right-mngdsb">
                              {brand.quantity.toLocaleString()}
                            </td>
                            <td className="table-cell-right-mngdsb">{brand.products}</td>
                            <td className="table-cell-right-mngdsb">
                              ${(brand.revenue / brand.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <div className="no-data-container-mngdsb">
          <Package className="no-data-icon-mngdsb" size={48} />
          <h3 className="no-data-title-mngdsb">No Data Available</h3>
          <p className="no-data-text-mngdsb">
            There is no sales data for the selected date range.
          </p>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ title, value, icon, change, positive, subtitle, bgColor, iconColor }) => (
  <div className="metric-card-mngdsb">
    <div className="metric-card-header-mngdsb">
      <div className={`metric-icon-container-mngdsb ${bgColor}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      {change !== undefined && (
        <div className={`metric-change-mngdsb ${positive ? 'metric-change-positive-mngdsb' : 'metric-change-negative-mngdsb'}`}>
          {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </div>
    <h3 className="metric-card-title-mngdsb">{title}</h3>
    <p className="metric-card-value-mngdsb">{value}</p>
    {subtitle && <p className="metric-card-subtitle-mngdsb">{subtitle}</p>}
  </div>
);

export default ManagerDashboard;