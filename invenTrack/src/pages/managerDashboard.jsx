import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users, Calendar, Download, Store, Award, Activity } from 'lucide-react';
import '../styles/Dashboard.css';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

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
      <div className="loading-container-dsb">
        <div className="loading-content-dsb">
          <div className="loading-spinner-dsb"></div>
          <p className="loading-text-dsb">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !branchInfo) {
    return (
      <div className="dashboard-container-dsb">
        <div className="dashboard-header-dsb">
          <h1 className="dashboard-title-dsb">Branch Performance Dashboard</h1>
        </div>
        <div className="no-data-container-dsb">
          <Store className="no-data-icon-dsb" size={48} />
          <h3 className="no-data-title-dsb">Unable to Load Dashboard</h3>
          <p className="no-data-text-dsb">
            {error || 'Unable to fetch branch information. Please contact administrator.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container-dsb">
      <div className="dashboard-header-dsb">
        <h1 className="dashboard-title-dsb">Branch Performance Dashboard</h1>
        <p className="dashboard-subtitle-dsb">
          {branchInfo.branch_name} - {branchInfo.branch_location}
        </p>
      </div>

      <div className="controls-container-dsb">
        <div className="controls-content-dsb">
          <div className="branch-selector-dsb" style={{ backgroundColor: '#f3f4f6', padding: '12px 20px', borderRadius: '8px' }}>
            <Store className="branch-icon-dsb" size={24} />
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
              {branchInfo.branch_name}
            </span>
          </div>

          <div className="date-range-selector-dsb">
            <Calendar className="calendar-icon-dsb" size={20} />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="date-input-dsb"
            />
            <span className="date-separator-dsb">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="date-input-dsb"
            />
          </div>

          <button onClick={exportReport} className="export-button-dsb" disabled={!metrics}>
            <Download size={20} />
            Export Report
          </button>
        </div>
      </div>

      <div className="view-tabs-dsb">
        {['overview', 'products', 'revenue', 'brands'].map(tab => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`view-tab-dsb ${view === tab ? 'view-tab-active-dsb' : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {metrics ? (
        <>
          {view === 'overview' && (
            <>
              <div className="metrics-grid-dsb">
                <MetricCard
                  title="Total Revenue"
                  value={`$${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  icon={<DollarSign size={24} />}
                  change={metrics.growthRate}
                  positive={metrics.growthRate > 0}
                  bgColor="metric-bg-blue-dsb"
                  iconColor="metric-icon-blue-dsb"
                />
                <MetricCard
                  title="Total Bills"
                  value={metrics.totalBills}
                  icon={<ShoppingCart size={24} />}
                  subtitle={`Avg: $${metrics.avgBillValue.toFixed(2)}`}
                  bgColor="metric-bg-green-dsb"
                  iconColor="metric-icon-green-dsb"
                />
                <MetricCard
                  title="Products in Stock"
                  value={metrics.totalStock}
                  icon={<Package size={24} />}
                  subtitle={`${metrics.totalProducts} unique products`}
                  bgColor="metric-bg-purple-dsb"
                  iconColor="metric-icon-purple-dsb"
                />
                <MetricCard
                  title="Staff Members"
                  value={metrics.staffCount}
                  icon={<Users size={24} />}
                  subtitle="Active employees"
                  bgColor="metric-bg-orange-dsb"
                  iconColor="metric-icon-orange-dsb"
                />
              </div>

              <div className="charts-grid-dsb">
                <div className="chart-card-dsb">
                  <h3 className="chart-title-dsb">
                    <Activity size={20} className="chart-title-icon-dsb" />
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

                <div className="chart-card-dsb">
                  <h3 className="chart-title-dsb">Category Revenue</h3>
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
                <div className="staff-performance-card-dsb">
                  <h3 className="staff-performance-title-dsb">
                    <Award size={20} className="staff-performance-icon-dsb" />
                    Top Performing Staff
                  </h3>
                  <div className="staff-grid-dsb">
                    {metrics.topStaff.map((staff, index) => (
                      <div key={staff.name} className="staff-item-dsb">
                        <div className="staff-header-dsb">
                          <span className={`staff-rank-dsb staff-rank-${index + 1}-dsb`}>
                            #{index + 1}
                          </span>
                          <span className="staff-bills-dsb">{staff.bills} bills</span>
                        </div>
                        <p className="staff-name-dsb">{staff.name}</p>
                        <p className="staff-revenue-dsb">
                          ${staff.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="payment-methods-card-dsb">
                <h3 className="payment-methods-title-dsb">Payment Methods</h3>
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
                  <div className="products-section-dsb">
                    <h3 className="products-title-dsb">
                      <TrendingUp size={20} className="products-icon-dsb" />
                      Top 10 Performing Products
                    </h3>
                    <div className="products-table-container-dsb">
                      <table className="products-table-dsb">
                        <thead>
                          <tr className="products-table-header-dsb">
                            <th className="table-header-cell-dsb">Rank</th>
                            <th className="table-header-cell-dsb">Product ID</th>
                            <th className="table-header-cell-dsb">Name</th>
                            <th className="table-header-cell-dsb">Category</th>
                            <th className="table-header-cell-right-dsb">Units Sold</th>
                            <th className="table-header-cell-right-dsb">Revenue</th>
                            <th className="table-header-cell-right-dsb">Bills</th>
                            <th className="table-header-cell-right-dsb">Avg/Bill</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.topProducts.map((product, index) => (
                            <tr key={product.pid} className="table-row-dsb">
                              <td className="table-cell-dsb">
                                <span className={`rank-badge-dsb rank-badge-${index + 1}-dsb`}>
                                  {index + 1}
                                </span>
                              </td>
                              <td className="table-cell-dsb table-cell-medium-dsb">{product.pid}</td>
                              <td className="table-cell-dsb">{product.name || 'N/A'}</td>
                              <td className="table-cell-dsb">
                                <span className="category-badge-dsb">
                                  {product.category || 'N/A'}
                                </span>
                              </td>
                              <td className="table-cell-right-dsb table-cell-medium-dsb">
                                {product.totalQuantity.toLocaleString()}
                              </td>
                              <td className="table-cell-right-dsb table-cell-revenue-dsb">
                                ${product.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="table-cell-right-dsb">{product.billCount}</td>
                              <td className="table-cell-right-dsb">
                                ${(product.totalRevenue / product.billCount).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {metrics.bottomProducts.length > 0 && (
                    <div className="bottom-products-section-dsb">
                      <h3 className="bottom-products-title-dsb">
                        <TrendingDown size={20} className="bottom-products-icon-dsb" />
                        Bottom 5 Performing Products (Action Required)
                      </h3>
                      <div className="products-table-container-dsb">
                        <table className="products-table-dsb">
                          <thead>
                            <tr className="products-table-header-dsb">
                              <th className="table-header-cell-dsb">Product ID</th>
                              <th className="table-header-cell-dsb">Name</th>
                              <th className="table-header-cell-dsb">Category</th>
                              <th className="table-header-cell-right-dsb">Units Sold</th>
                              <th className="table-header-cell-right-dsb">Revenue</th>
                              <th className="table-header-cell-center-dsb">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {metrics.bottomProducts.map((product) => (
                              <tr key={product.pid} className="table-row-bottom-dsb">
                                <td className="table-cell-dsb table-cell-medium-dsb">{product.pid}</td>
                                <td className="table-cell-dsb">{product.name || 'N/A'}</td>
                                <td className="table-cell-dsb">
                                  <span className="category-badge-gray-dsb">
                                    {product.category || 'N/A'}
                                  </span>
                                </td>
                                <td className="table-cell-right-dsb">{product.totalQuantity}</td>
                                <td className="table-cell-right-dsb">
                                  ${product.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="table-cell-center-dsb">
                                  <span className="status-badge-dsb">Low Sales</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="recommendation-card-dsb">
                        <p className="recommendation-text-dsb">
                          <strong>Recommendation:</strong> Consider promotional strategies, price adjustments, or discontinuing these products based on profitability analysis.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-data-container-dsb">
                  <Package className="no-data-icon-dsb" size={48} />
                  <h3 className="no-data-title-dsb">No Product Sales Data</h3>
                  <p className="no-data-text-dsb">
                    No products have been sold in the selected date range.
                  </p>
                </div>
              )}
            </>
          )}

          {view === 'revenue' && (
            <>
              <div className="revenue-summary-grid-dsb">
                <div className="revenue-card-blue-dsb">
                  <h3 className="revenue-card-label-dsb">Total Revenue</h3>
                  <p className="revenue-card-value-dsb">
                    ${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="revenue-card-subtitle-dsb">From {metrics.totalBills} transactions</p>
                </div>
                <div className="revenue-card-green-dsb">
                  <h3 className="revenue-card-label-dsb">Average Bill Value</h3>
                  <p className="revenue-card-value-dsb">${metrics.avgBillValue.toFixed(2)}</p>
                  <p className="revenue-card-subtitle-dsb">Per transaction</p>
                </div>
                <div className="revenue-card-purple-dsb">
                  <h3 className="revenue-card-label-dsb">Inventory Value</h3>
                  <p className="revenue-card-value-dsb">
                    ${metrics.totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="revenue-card-subtitle-dsb">{metrics.totalStock} units in stock</p>
                </div>
              </div>

              {metrics.categoryData.length > 0 && (
                <div className="revenue-by-category-card-dsb">
                  <h3 className="revenue-by-category-title-dsb">Revenue by Category</h3>
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

              <div className="daily-revenue-card-dsb">
                <h3 className="daily-revenue-title-dsb">Daily Revenue Breakdown</h3>
                <div className="daily-revenue-table-container-dsb">
                  <table className="daily-revenue-table-dsb">
                    <thead>
                      <tr className="daily-revenue-header-dsb">
                        <th className="table-header-cell-dsb">Date</th>
                        <th className="table-header-cell-right-dsb">Bills Count</th>
                        <th className="table-header-cell-right-dsb">Revenue</th>
                        <th className="table-header-cell-right-dsb">Avg Bill</th>
                        <th className="table-header-cell-right-dsb">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.trendData.slice().reverse().map((day) => {
                        const avgBill = day.bills > 0 ? day.revenue / day.bills : 0;
                        const performanceRating = day.revenue > metrics.avgBillValue * day.bills ? 'High' : 
                                                 day.revenue > (metrics.avgBillValue * day.bills * 0.7) ? 'Medium' : 'Low';
                        return (
                          <tr key={day.date} className="daily-revenue-row-dsb">
                            <td className="table-cell-dsb table-cell-medium-dsb">{day.date}</td>
                            <td className="table-cell-right-dsb">{day.bills}</td>
                            <td className="table-cell-right-dsb table-cell-bold-dsb">
                              ${day.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="table-cell-right-dsb">${avgBill.toFixed(2)}</td>
                            <td className="table-cell-right-dsb">
                              <span className={`performance-badge-dsb performance-badge-${performanceRating.toLowerCase()}-dsb`}>
                                {performanceRating}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="daily-revenue-footer-dsb">
                        <td className="table-cell-dsb table-cell-bold-dsb">Total</td>
                        <td className="table-cell-right-dsb table-cell-bold-dsb">{metrics.totalBills}</td>
                        <td className="table-cell-right-dsb table-footer-revenue-dsb">
                          ${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="table-cell-right-dsb table-cell-bold-dsb">
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
              <div className="revenue-by-category-card-dsb">
                <h3 className="revenue-by-category-title-dsb">
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
                  <div className="no-data-container-dsb" style={{ marginTop: '40px' }}>
                    <Package className="no-data-icon-dsb" size={48} />
                    <h3 className="no-data-title-dsb">No Brand Data</h3>
                    <p className="no-data-text-dsb">
                      No brand information available for the selected date range.
                    </p>
                  </div>
                )}
              </div>

              {metrics.brandData && metrics.brandData.length > 0 && (
                <div className="products-section-dsb" style={{ marginTop: '30px' }}>
                  <h3 className="products-title-dsb">Brand Performance Details</h3>
                  <div className="products-table-container-dsb">
                    <table className="products-table-dsb">
                      <thead>
                        <tr className="products-table-header-dsb">
                          <th className="table-header-cell-dsb">Rank</th>
                          <th className="table-header-cell-dsb">Brand Name</th>
                          <th className="table-header-cell-right-dsb">Total Revenue</th>
                          <th className="table-header-cell-right-dsb">Units Sold</th>
                          <th className="table-header-cell-right-dsb">Products</th>
                          <th className="table-header-cell-right-dsb">Avg Revenue/Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.brandData.map((brand, index) => (
                          <tr key={brand.name} className="table-row-dsb">
                            <td className="table-cell-dsb">
                              <span className={`rank-badge-dsb rank-badge-${index + 1}-dsb`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="table-cell-dsb table-cell-medium-dsb">{brand.name}</td>
                            <td className="table-cell-right-dsb table-cell-revenue-dsb">
                              ${brand.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="table-cell-right-dsb">
                              {brand.quantity.toLocaleString()}
                            </td>
                            <td className="table-cell-right-dsb">{brand.products}</td>
                            <td className="table-cell-right-dsb">
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
        <div className="no-data-container-dsb">
          <Package className="no-data-icon-dsb" size={48} />
          <h3 className="no-data-title-dsb">No Data Available</h3>
          <p className="no-data-text-dsb">
            There is no sales data for the selected date range.
          </p>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ title, value, icon, change, positive, subtitle, bgColor, iconColor }) => (
  <div className="metric-card-dsb">
    <div className="metric-card-header-dsb">
      <div className={`metric-icon-container-dsb ${bgColor}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      {change !== undefined && (
        <div className={`metric-change-dsb ${positive ? 'metric-change-positive-dsb' : 'metric-change-negative-dsb'}`}>
          {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </div>
    <h3 className="metric-card-title-dsb">{title}</h3>
    <p className="metric-card-value-dsb">{value}</p>
    {subtitle && <p className="metric-card-subtitle-dsb">{subtitle}</p>}
  </div>
);

export default ManagerDashboard;