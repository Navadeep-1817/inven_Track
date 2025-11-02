import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users, Calendar, Download, Store, Award, Activity } from 'lucide-react';
import '../styles/Dashboard.css';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const Dashboard = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
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
  const [attendance, setAttendance] = useState([]);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  // Get auth token
  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchBranchData(selectedBranch.branch_id);
    }
  }, [selectedBranch, dateRange]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/branches`);

      
      if (Array.isArray(response.data) && response.data.length > 0) {
        setBranches(response.data);
        setSelectedBranch(response.data[0]);
        setError(null);
      } else {
        console.warn('⚠️ No branches found');
        setBranches([]);
        setError('No branches available. Please create a branch first.');
      }
    } catch (err) {
      console.error('❌ Error fetching branches:', err);
      setError('Failed to fetch branches. Please check your connection.');
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchData = async (branchId) => {
    try {

      
      // Fetch inventory, bills, staff, and attendance in parallel
      const [inventoryRes, billsRes, staffRes, attendanceRes] = await Promise.all([
        axios.get(`${API_BASE}/inventory/${branchId}`, getAuthConfig())
          .catch(err => {
            console.warn('⚠️ Inventory fetch error:', err.response?.data || err.message);
            return { data: [] };
          }),
        axios.get(`${API_BASE}/bills/branch/${branchId}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=1000`, getAuthConfig())
          .catch(err => {
            console.warn('⚠️ Bills fetch error:', err.response?.data || err.message);
            return { data: { bills: [] } };
          }),
        axios.get(`${API_BASE}/staff/branches/${branchId}/staff`, getAuthConfig())
          .catch(err => {
            console.warn('⚠️ Staff fetch error:', err.response?.data || err.message);
            return { data: [] };
          }),
        axios.get(`${API_BASE}/attendance/branch/${branchId}`, getAuthConfig())
          .catch(err => {
            console.warn('⚠️ Attendance fetch error:', err.response?.data || err.message);
            return { data: { records: [] } };
          })
      ]);


      setInventory(Array.isArray(inventoryRes.data) ? inventoryRes.data : []);
      setBills(billsRes.data.bills || billsRes.data || []);
      setStaff(Array.isArray(staffRes.data) ? staffRes.data : []);
      
      // Set attendance records from the API response
      const attendanceData = attendanceRes.data.records || attendanceRes.data || [];
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
      
      setError(null);
    } catch (error) {
      console.error('❌ Error fetching branch data:', error);
      setError('Failed to fetch some branch data.');
    }
  };

  const calculateMetrics = () => {
    // Allow metrics even if only bills exist
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
      .slice(0, 10); // Top 10 brands

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
    if (!metrics) return;
    
    const report = {
      branch: selectedBranch?.branch_name,
      location: selectedBranch?.branch_location,
      dateRange: dateRange,
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
    link.download = `${selectedBranch?.branch_name}_report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const calculateAttendanceStats = () => {

    if (!attendance.length || !staff.length) {
      console.warn('⚠️ Missing data - staff:', staff.length, 'attendance:', attendance.length);
      return [];
    }

    const staffAttendance = {};
    
    // Initialize all staff
    staff.forEach(member => {
      staffAttendance[member._id] = {
        id: member._id,
        name: member.name,
        role: member.role,
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0
      };
    });


    // Calculate attendance from records
    attendance.forEach((record, recordIndex) => {
      console.log(`📅 Processing record ${recordIndex + 1}:`, {
        date: record.date,
        staffCount: record.staff?.length || 0
      });

      if (record.staff && Array.isArray(record.staff)) {
        record.staff.forEach(staffRecord => {
          if (staffAttendance[staffRecord.staff_id]) {
            staffAttendance[staffRecord.staff_id].totalDays += 1;
            
            if (staffRecord.status === 'Present') {
              staffAttendance[staffRecord.staff_id].presentDays += 1;
            } else if (staffRecord.status === 'Absent') {
              staffAttendance[staffRecord.staff_id].absentDays += 1;
            } else if (staffRecord.status === 'Late') {
              staffAttendance[staffRecord.staff_id].lateDays += 1;
            }
          }
        });
      }
    });

    const stats = Object.values(staffAttendance)
      .filter(staff => staff.totalDays > 0) // Only include staff with attendance records
      .map(staff => ({
        ...staff,
        attendancePercentage: staff.totalDays > 0 
          ? ((staff.presentDays + staff.lateDays) / staff.totalDays * 100).toFixed(1)
          : '0.0'
      }));
    return stats;
  };

  const exportAttendanceCSV = () => {
    const attendanceStats = calculateAttendanceStats();
    if (!attendanceStats.length) return;

    const headers = ['Name', 'Role', 'Total Days', 'Present', 'Absent', 'Late', 'Attendance %'];
    const rows = attendanceStats.map(staff => [
      staff.name,
      staff.role,
      staff.totalDays,
      staff.presentDays,
      staff.absentDays,
      staff.lateDays,
      staff.attendancePercentage
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedBranch?.branch_name}_attendance_${new Date().toISOString().split('T')[0]}.csv`;
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

  if (error && branches.length === 0) {
    return (
      <div className="dashboard-container-dsb">
        <div className="dashboard-header-dsb">
          <h1 className="dashboard-title-dsb">Branch Performance Dashboard</h1>
        </div>
        <div className="no-data-container-dsb">
          <Store className="no-data-icon-dsb" size={48} />
          <h3 className="no-data-title-dsb">No Branches Available</h3>
          <p className="no-data-text-dsb">
            {error || 'Please create a branch to start tracking performance.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container-dsb">
      <div className="dashboard-header-dsb">
        <h1 className="dashboard-title-dsb">Branch Performance Dashboard</h1>
        <p className="dashboard-subtitle-dsb">Monitor branch performance, revenue, and product analytics</p>
      </div>

      <div className="controls-container-dsb">
        <div className="controls-content-dsb">
          <div className="branch-selector-dsb">
            <Store className="branch-icon-dsb" size={24} />
            <select
              value={selectedBranch?.branch_id || ''}
              onChange={(e) => {
                const branch = branches.find(b => b.branch_id === e.target.value);
                setSelectedBranch(branch);
              }}
              className="branch-select-dsb"
            >
              {branches.map(branch => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.branch_name} - {branch.branch_location}
                </option>
              ))}
            </select>
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

          <button 
            onClick={() => setShowAttendanceModal(true)} 
            className="export-button-dsb"
            style={{ marginLeft: '10px', backgroundColor: '#10b981' }}
          >
            <Users size={20} />
            View Attendance
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
                          name === 'revenue' ? `${value.toLocaleString()}` : value,
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
            There is no sales data for the selected branch and date range.
          </p>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="modal-overlay-dsb" onClick={() => setShowAttendanceModal(false)}>
          <div className="modal-content-dsb" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-dsb">
              <h2 className="modal-title-dsb">
                <Users size={24} style={{ marginRight: '10px' }} />
                Staff Attendance Report - {selectedBranch?.branch_name}
              </h2>
              <button 
                className="modal-close-dsb" 
                onClick={() => setShowAttendanceModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body-dsb">
              {(() => {
                const stats = calculateAttendanceStats();
                return stats.length > 0 ? (
                  <>
                    <div className="attendance-summary-dsb">
                      <p>Showing attendance data for <strong>{attendance.length}</strong> days</p>
                      <button 
                        onClick={exportAttendanceCSV} 
                        className="export-button-dsb"
                        style={{ marginTop: '10px' }}
                      >
                        <Download size={18} />
                        Export as CSV
                      </button>
                    </div>

                    <div className="attendance-table-container-dsb">
                      <table className="products-table-dsb">
                        <thead>
                          <tr className="products-table-header-dsb">
                            <th className="table-header-cell-dsb">Name</th>
                            <th className="table-header-cell-dsb">Role</th>
                            <th className="table-header-cell-right-dsb">Total Days</th>
                            <th className="table-header-cell-right-dsb">Present</th>
                            <th className="table-header-cell-right-dsb">Absent</th>
                            <th className="table-header-cell-right-dsb">Late</th>
                            <th className="table-header-cell-right-dsb">Attendance %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.map((staffMember) => {
                            const percentage = parseFloat(staffMember.attendancePercentage);
                            const performanceClass = percentage >= 90 ? 'high' : percentage >= 75 ? 'medium' : 'low';
                            
                            return (
                              <tr key={staffMember.id} className="table-row-dsb">
                                <td className="table-cell-dsb">{staffMember.name}</td>
                                <td className="table-cell-dsb">
                                  <span className="category-badge-dsb">{staffMember.role}</span>
                                </td>
                                <td className="table-cell-right-dsb">{staffMember.totalDays}</td>
                                <td className="table-cell-right-dsb" style={{ color: '#10b981', fontWeight: 'bold' }}>
                                  {staffMember.presentDays}
                                </td>
                                <td className="table-cell-right-dsb" style={{ color: '#ef4444', fontWeight: 'bold' }}>
                                  {staffMember.absentDays}
                                </td>
                                <td className="table-cell-right-dsb" style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                                  {staffMember.lateDays}
                                </td>
                                <td className="table-cell-right-dsb">
                                  <span className={`performance-badge-dsb performance-badge-${performanceClass}-dsb`}>
                                    {staffMember.attendancePercentage}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="no-data-container-dsb">
                    <Users className="no-data-icon-dsb" size={48} />
                    <h3 className="no-data-title-dsb">No Attendance Data</h3>
                    <p className="no-data-text-dsb">
                      {staff.length === 0 
                        ? 'No staff members found for this branch.'
                        : attendance.length === 0
                        ? 'No attendance records found for this branch.'
                        : 'Unable to calculate attendance statistics.'}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
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

export default Dashboard;