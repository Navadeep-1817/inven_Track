import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users, Calendar, Download, Store, Award, Activity, RefreshCw } from 'lucide-react';
import axios from 'axios';
import './../styles/Dashboard.css';
const API_BASE = 'http://localhost:5000/api';

const Dashboard = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [bills, setBills] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [view, setView] = useState('overview');
  const [attendance, setAttendance] = useState([]);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

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
    const isRefresh = refreshing;
    if (!isRefresh) setLoading(true);
    
    try {
      console.log('🔄 Fetching data for branch:', branchId);
      
      // Fetch data in parallel
      const [inventoryRes, billsRes, staffRes, attendanceRes] = await Promise.all([
        axios.get(`${API_BASE}/inventory/${branchId}`, getAuthConfig())
          .catch(err => {
            console.warn('⚠️ Inventory fetch error:', err.response?.data || err.message);
            return { data: [] };
          }),
        axios.get(
          `${API_BASE}/bills/branch/${branchId}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=10000`,
          getAuthConfig()
        )
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

      // Process inventory data
      const inventoryData = Array.isArray(inventoryRes.data) ? inventoryRes.data : [];
      setInventory(inventoryData);
      
      // Process bills data - handle both response structures
      const billsData = billsRes.data?.bills || billsRes.data || [];
      const billsArray = Array.isArray(billsData) ? billsData : [];
      setBills(billsArray);
      
      // Process staff data
      const staffData = Array.isArray(staffRes.data) ? staffRes.data : [];
      setStaff(staffData);
      
      // Process attendance data
      const attendanceData = attendanceRes.data?.records || attendanceRes.data || [];
      const attendanceArray = Array.isArray(attendanceData) ? attendanceData : [];
      setAttendance(attendanceArray);
      
      console.log('✅ Data loaded:', {
        branch: branchId,
        inventory: inventoryData.length,
        bills: billsArray.length,
        staff: staffData.length,
        attendance: attendanceArray.length,
        dateRange: `${dateRange.startDate} to ${dateRange.endDate}`
      });
      
      setError(null);
    } catch (error) {
      console.error('❌ Error fetching branch data:', error);
      setError('Failed to fetch some branch data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    if (selectedBranch) {
      setRefreshing(true);
      await fetchBranchData(selectedBranch.branch_id);
    }
  };

  // Create inventory lookup map for performance
  const inventoryMap = useMemo(() => {
    const map = new Map();
    inventory.forEach(item => {
      if (item.pid) {
        map.set(item.pid, item);
      }
    });
    return map;
  }, [inventory]);

  // Memoize metrics calculation to prevent infinite re-renders
  const metrics = useMemo(() => {
    if (!bills || bills.length === 0) {
      console.warn('⚠️ No bills data available for metrics calculation');
      return null;
    }

    const completedBills = bills.filter(b => b.status === 'completed');
    
    if (completedBills.length === 0) {
      console.warn('⚠️ No completed bills in date range');
      return null;
    }

    console.log('📊 Calculating metrics from', completedBills.length, 'completed bills');

    const totalRevenue = completedBills.reduce((sum, bill) => sum + (bill.totals?.total || 0), 0);
    const totalBills = completedBills.length;
    const avgBillValue = totalBills > 0 ? totalRevenue / totalBills : 0;
    
    // Product sales analysis
    const productSales = {};
    const brandRevenue = {};
    const categoryRevenue = {};
    
    completedBills.forEach(bill => {
      if (!bill.items || !Array.isArray(bill.items)) return;
      
      bill.items.forEach(item => {
        const pid = item.pid || 'unknown';
        const inventoryItem = inventoryMap.get(pid);
        const category = inventoryItem?.category || item.category || 'Uncategorized';
        const brand = item.brand || 'Unknown';
        
        // Product sales
        if (!productSales[pid]) {
          productSales[pid] = {
            pid: pid,
            name: item.name || 'Unknown Product',
            brand: brand,
            category: category,
            totalQuantity: 0,
            totalRevenue: 0,
            billCount: 0
          };
        }
        productSales[pid].totalQuantity += item.quantity || 0;
        productSales[pid].totalRevenue += item.amount || (item.price * item.quantity) || 0;
        productSales[pid].billCount += 1;
        
        // Brand performance
        if (!brandRevenue[brand]) {
          brandRevenue[brand] = { 
            name: brand, 
            revenue: 0, 
            quantity: 0, 
            products: new Set() 
          };
        }
        brandRevenue[brand].revenue += item.amount || (item.price * item.quantity) || 0;
        brandRevenue[brand].quantity += item.quantity || 0;
        brandRevenue[brand].products.add(pid);
        
        // Category revenue
        if (!categoryRevenue[category]) {
          categoryRevenue[category] = { 
            name: category, 
            revenue: 0, 
            quantity: 0 
          };
        }
        categoryRevenue[category].revenue += item.amount || (item.price * item.quantity) || 0;
        categoryRevenue[category].quantity += item.quantity || 0;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    const bottomProducts = Object.values(productSales)
      .sort((a, b) => a.totalRevenue - b.totalRevenue)
      .slice(0, 5);

    const categoryData = Object.values(categoryRevenue)
      .filter(cat => cat.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);

    const brandData = Object.values(brandRevenue)
      .map(brand => ({
        name: brand.name,
        revenue: brand.revenue,
        quantity: brand.quantity,
        products: brand.products.size
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Revenue trend
    const revenueTrend = {};
    completedBills.forEach(bill => {
      const billDate = new Date(bill.billDate);
      const dateKey = billDate.toISOString().split('T')[0];
      const displayDate = billDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
      
      if (!revenueTrend[dateKey]) {
        revenueTrend[dateKey] = { 
          dateKey, 
          date: displayDate, 
          revenue: 0, 
          bills: 0,
          timestamp: billDate.getTime()
        };
      }
      revenueTrend[dateKey].revenue += bill.totals?.total || 0;
      revenueTrend[dateKey].bills += 1;
    });

    const trendData = Object.values(revenueTrend)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ date, revenue, bills }) => ({ date, revenue, bills }));

    // Payment methods
    const paymentMethods = {};
    completedBills.forEach(bill => {
      const method = bill.paymentMethod || 'Cash';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { name: method, count: 0, revenue: 0 };
      }
      paymentMethods[method].count += 1;
      paymentMethods[method].revenue += bill.totals?.total || 0;
    });

    // Inventory metrics
    const totalProducts = inventory.length;
    const totalStock = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalInventoryValue = inventory.reduce((sum, item) => 
      sum + ((item.price || 0) * (item.quantity || 0)), 0
    );

    // Staff performance
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

    // Growth rate calculation
    const midPoint = new Date((new Date(dateRange.startDate).getTime() + new Date(dateRange.endDate).getTime()) / 2);
    const firstHalfRevenue = completedBills
      .filter(b => new Date(b.billDate) < midPoint)
      .reduce((sum, b) => sum + (b.totals?.total || 0), 0);
    const secondHalfRevenue = completedBills
      .filter(b => new Date(b.billDate) >= midPoint)
      .reduce((sum, b) => sum + (b.totals?.total || 0), 0);
    const growthRate = firstHalfRevenue > 0 ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 : 0;

    const result = {
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

    console.log('✅ Metrics calculated (memoized):', {
      totalBills: result.totalBills,
      totalRevenue: result.totalRevenue.toFixed(2),
      categories: result.categoryData.length,
      brands: result.brandData.length,
      trendPoints: result.trendData.length
    });

    return result;
  }, [bills, inventory, inventoryMap, staff, dateRange.startDate, dateRange.endDate]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const exportReport = () => {
    if (!metrics) return;
    
    const report = {
      branch: selectedBranch?.branch_name,
      location: selectedBranch?.branch_location,
      dateRange: dateRange,
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
    link.download = `${selectedBranch?.branch_name}_report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const calculateAttendanceStats = () => {
    if (!attendance.length || !staff.length) {
      return [];
    }

    const staffAttendance = {};
    
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

    attendance.forEach(record => {
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

    return Object.values(staffAttendance)
      .filter(staff => staff.totalDays > 0)
      .map(staff => ({
        ...staff,
        attendancePercentage: staff.totalDays > 0 
          ? ((staff.presentDays + staff.lateDays) / staff.totalDays * 100).toFixed(1)
          : '0.0'
      }));
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
    URL.revokeObjectURL(url);
  };

  if (loading && !refreshing) {
    return (
      <div className="loading-container-dsb">
        <div className="loading-content-dsb">
          <div className="spinner-dsb"></div>
          <p className="loading-text-dsb">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && branches.length === 0) {
    return (
      <div className="dashboard-container-dsb">
        <h1 className="dashboard-title-dsb">Branch Performance Dashboard</h1>
        <div className="no-branches-dsb">
          <Store size={48} className="no-branches-icon-dsb" />
          <h3 className="no-branches-title-dsb">No Branches Available</h3>
          <p className="no-branches-text-dsb">{error || 'Please create a branch to start tracking performance.'}</p>
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

      <div className="controls-card-dsb">
        <div className="controls-container-dsb">
          <div className="branch-selector-dsb">
            <Store size={24} className="branch-icon-dsb" />
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

          <div className="date-range-dsb">
            <Calendar size={20} className="date-icon-dsb" />
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

          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className={`refresh-button-dsb ${refreshing ? 'refreshing-dsb' : ''}`}
          >
            <RefreshCw size={20} className={refreshing ? 'spinning-dsb' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <button 
            onClick={exportReport} 
            disabled={!metrics}
            className={`export-button-dsb ${!metrics ? 'export-button-disabled-dsb' : ''}`}
          >
            <Download size={20} />
            Export Report
          </button>

          <button 
            onClick={() => setShowAttendanceModal(true)}
            className="attendance-button-dsb"
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
                  color="#3b82f6"
                />
                <MetricCard
                  title="Total Bills"
                  value={metrics.totalBills}
                  icon={<ShoppingCart size={24} />}
                  subtitle={`Avg: $${metrics.avgBillValue.toFixed(2)}`}
                  color="#10b981"
                />
                <MetricCard
                  title="Products in Stock"
                  value={metrics.totalStock}
                  icon={<Package size={24} />}
                  subtitle={`${metrics.totalProducts} unique products`}
                  color="#8b5cf6"
                />
                <MetricCard
                  title="Staff Members"
                  value={metrics.staffCount}
                  icon={<Users size={24} />}
                  subtitle="Active employees"
                  color="#f59e0b"
                />
              </div>

              <div className="charts-grid-dsb">
                <div className="chart-card-dsb">
                  <h3 className="chart-title-dsb">
                    <Activity size={20} />
                    Revenue Trend
                  </h3>
                  {metrics.trendData && metrics.trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={metrics.trendData}>
                        <CartesianGrid strokeDasharray="3 3" className="chart-grid-dsb" />
                        <XAxis 
                          dataKey="date" 
                          className="chart-axis-dsb"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis className="chart-axis-dsb" />
                        <Tooltip 
                          className="chart-tooltip-dsb"
                          formatter={(value) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Revenue']}
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
                  ) : (
                    <div className="no-data-dsb">
                      <Activity size={48} className="no-data-icon-dsb" />
                      <p>No revenue trend data available</p>
                    </div>
                  )}
                </div>

                <div className="chart-card-dsb">
                  <h3 className="chart-title-dsb">Category Revenue</h3>
                  {metrics.categoryData && metrics.categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={metrics.categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="revenue"
                        >
                          {metrics.categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-dsb">
                      <Package size={48} className="no-data-icon-dsb" />
                      <p>No category data available</p>
                    </div>
                  )}
                </div>
              </div>

              {metrics.topStaff && metrics.topStaff.length > 0 && (
                <div className="staff-card-dsb">
                  <h3 className="staff-title-dsb">
                    <Award size={20} />
                    Top Performing Staff
                  </h3>
                  <div className="staff-grid-dsb">
                    {metrics.topStaff.map((staff, index) => (
                      <div key={staff.name} className="staff-item-dsb">
                        <div className="staff-header-dsb">
                          <span className={`staff-rank-dsb ${
                            index === 0 ? 'staff-rank-gold-dsb' : 
                            index === 1 ? 'staff-rank-silver-dsb' : 
                            'staff-rank-bronze-dsb'
                          }`}>
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
            </>
          )}

          {view === 'products' && (
            <>
              {metrics.topProducts && metrics.topProducts.length > 0 ? (
                <div className="products-card-dsb">
                  <h3 className="products-title-dsb">
                    <TrendingUp size={20} className="trending-up-dsb" />
                    Top 10 Performing Products
                  </h3>
                  <div className="table-container-dsb">
                    <table className="products-table-dsb">
                      <thead>
                        <tr className="table-header-dsb">
                          <th className="table-th-dsb">Rank</th>
                          <th className="table-th-dsb">Product ID</th>
                          <th className="table-th-dsb">Name</th>
                          <th className="table-th-dsb">Brand</th>
                          <th className="table-th-dsb">Category</th>
                          <th className="table-th-dsb text-right-dsb">Units Sold</th>
                          <th className="table-th-dsb text-right-dsb">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.topProducts.map((product, index) => (
                          <tr key={`${product.pid}-${index}`} className="table-row-dsb">
                            <td className="table-td-dsb">
                              <span className={`rank-badge-dsb ${
                                index < 3 ? 'rank-badge-top-dsb' : 'rank-badge-other-dsb'
                              }`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="table-td-dsb product-id-dsb">{product.pid}</td>
                            <td className="table-td-dsb product-name-dsb">{product.name}</td>
                            <td className="table-td-dsb">{product.brand}</td>
                            <td className="table-td-dsb">
                              <span className="category-badge-dsb">
                                {product.category}
                              </span>
                            </td>
                            <td className="table-td-dsb text-right-dsb quantity-dsb">
                              {product.totalQuantity.toLocaleString()}
                            </td>
                            <td className="table-td-dsb text-right-dsb revenue-dsb">
                              ${product.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="no-data-card-dsb">
                  <Package size={48} className="no-data-icon-dsb" />
                  <h3 className="no-data-title-dsb">No Product Sales Data</h3>
                  <p className="no-data-text-dsb">No products have been sold in the selected date range.</p>
                </div>
              )}
            </>
          )}

          {view === 'revenue' && (
            <>
              <div className="revenue-metrics-dsb">
                <div className="revenue-metric-dsb revenue-total-dsb">
                  <h3 className="revenue-metric-title-dsb">Total Revenue</h3>
                  <p className="revenue-metric-value-dsb">
                    ${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="revenue-metric-subtitle-dsb">From {metrics.totalBills} transactions</p>
                </div>
                <div className="revenue-metric-dsb revenue-avg-dsb">
                  <h3 className="revenue-metric-title-dsb">Average Bill Value</h3>
                  <p className="revenue-metric-value-dsb">
                    ${metrics.avgBillValue.toFixed(2)}
                  </p>
                  <p className="revenue-metric-subtitle-dsb">Per transaction</p>
                </div>
                <div className="revenue-metric-dsb revenue-inventory-dsb">
                  <h3 className="revenue-metric-title-dsb">Inventory Value</h3>
                  <p className="revenue-metric-value-dsb">
                    ${metrics.totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="revenue-metric-subtitle-dsb">{metrics.totalStock} units in stock</p>
                </div>
              </div>

              {metrics.categoryData && metrics.categoryData.length > 0 && (
                <div className="chart-card-dsb">
                  <h3 className="chart-title-dsb">Revenue by Category</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={metrics.categoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="chart-grid-dsb" />
                      <XAxis type="number" className="chart-axis-dsb" />
                      <YAxis dataKey="name" type="category" className="chart-axis-dsb" width={120} />
                      <Tooltip 
                        className="chart-tooltip-dsb"
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
            </>
          )}

          {view === 'brands' && (
            <>
              <div className="chart-card-dsb">
                <h3 className="chart-title-dsb">
                  <Award size={20} />
                  Brand-wise Performance
                </h3>
                {metrics.brandData && metrics.brandData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={500}>
                    <BarChart data={metrics.brandData} layout="horizontal" margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" className="chart-grid-dsb" />
                      <XAxis 
                        dataKey="name" 
                        className="chart-axis-dsb"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis className="chart-axis-dsb" />
                      <Tooltip 
                        className="chart-tooltip-dsb"
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
                  <div className="no-data-dsb">
                    <Package size={48} className="no-data-icon-dsb" />
                    <h3 className="no-data-title-dsb">No Brand Data</h3>
                    <p>No brand information available for the selected date range.</p>
                  </div>
                )}
              </div>

              {metrics.brandData && metrics.brandData.length > 0 && (
                <div className="products-card-dsb" style={{ marginTop: '30px' }}>
                  <h3 className="products-title-dsb">Brand Performance Details</h3>
                  <div className="table-container-dsb">
                    <table className="products-table-dsb">
                      <thead>
                        <tr className="table-header-dsb">
                          <th className="table-th-dsb">Rank</th>
                          <th className="table-th-dsb">Brand Name</th>
                          <th className="table-th-dsb text-right-dsb">Total Revenue</th>
                          <th className="table-th-dsb text-right-dsb">Units Sold</th>
                          <th className="table-th-dsb text-right-dsb">Products</th>
                          <th className="table-th-dsb text-right-dsb">Avg Revenue/Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.brandData.map((brand, index) => (
                          <tr key={`${brand.name}-${index}`} className="table-row-dsb">
                            <td className="table-td-dsb">
                              <span className={`rank-badge-dsb ${
                                index < 3 ? 'rank-badge-top-dsb' : 'rank-badge-other-dsb'
                              }`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="table-td-dsb product-name-dsb">{brand.name}</td>
                            <td className="table-td-dsb text-right-dsb revenue-dsb">
                              ${brand.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="table-td-dsb text-right-dsb">
                              {brand.quantity.toLocaleString()}
                            </td>
                            <td className="table-td-dsb text-right-dsb">{brand.products}</td>
                            <td className="table-td-dsb text-right-dsb">
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
        <div className="no-data-card-dsb">
          <Package size={48} className="no-data-icon-dsb" />
          <h3 className="no-data-title-dsb">No Data Available</h3>
          <p className="no-data-text-dsb">There is no sales data for the selected branch and date range.</p>
        </div>
      )}

      {showAttendanceModal && (
        <div 
          className="modal-overlay-dsb"
          onClick={() => setShowAttendanceModal(false)}
        >
          <div 
            className="modal-content-dsb"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-dsb">
              <h2 className="modal-title-dsb">
                <Users size={24} />
                Staff Attendance Report - {selectedBranch?.branch_name}
              </h2>
              <button 
                onClick={() => setShowAttendanceModal(false)}
                className="modal-close-dsb"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body-dsb">
              {(() => {
                const stats = calculateAttendanceStats();
                return stats.length > 0 ? (
                  <>
                    <div className="attendance-header-dsb">
                      <p>Showing attendance data for <strong>{attendance.length}</strong> days</p>
                      <button 
                        onClick={exportAttendanceCSV}
                        className="export-csv-button-dsb"
                      >
                        <Download size={18} />
                        Export as CSV
                      </button>
                    </div>

                    <div className="table-container-dsb">
                      <table className="attendance-table-dsb">
                        <thead>
                          <tr className="table-header-dsb">
                            <th className="table-th-dsb">Name</th>
                            <th className="table-th-dsb">Role</th>
                            <th className="table-th-dsb text-right-dsb">Total Days</th>
                            <th className="table-th-dsb text-right-dsb">Present</th>
                            <th className="table-th-dsb text-right-dsb">Absent</th>
                            <th className="table-th-dsb text-right-dsb">Late</th>
                            <th className="table-th-dsb text-right-dsb">Attendance %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.map((staffMember) => {
                            const percentage = parseFloat(staffMember.attendancePercentage);
                            const bgClass = percentage >= 90 ? 'attendance-high-dsb' : percentage >= 75 ? 'attendance-medium-dsb' : 'attendance-low-dsb';
                            
                            return (
                              <tr key={staffMember.id} className="table-row-dsb">
                                <td className="table-td-dsb">{staffMember.name}</td>
                                <td className="table-td-dsb">
                                  <span className="role-badge-dsb">
                                    {staffMember.role}
                                  </span>
                                </td>
                                <td className="table-td-dsb text-right-dsb">{staffMember.totalDays}</td>
                                <td className="table-td-dsb text-right-dsb present-dsb">
                                  {staffMember.presentDays}
                                </td>
                                <td className="table-td-dsb text-right-dsb absent-dsb">
                                  {staffMember.absentDays}
                                </td>
                                <td className="table-td-dsb text-right-dsb late-dsb">
                                  {staffMember.lateDays}
                                </td>
                                <td className="table-td-dsb text-right-dsb">
                                  <span className={`attendance-percentage-dsb ${bgClass}`}>
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
                  <div className="no-data-dsb">
                    <Users size={48} className="no-data-icon-dsb" />
                    <h3 className="no-data-title-dsb">No Attendance Data</h3>
                    <p>
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

const MetricCard = ({ title, value, icon, change, positive, subtitle, color }) => (
  <div className="metric-card-dsb">
    <div className="metric-header-dsb">
      <div 
        className="metric-icon-container-dsb"
        style={{ backgroundColor: `${color}20`, color: color }}
      >
        {icon}
      </div>
      {change !== undefined && (
        <div className={`metric-change-dsb ${positive ? 'metric-change-positive-dsb' : 'metric-change-negative-dsb'}`}>
          {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </div>
    <h3 className="metric-title-dsb">{title}</h3>
    <p className="metric-value-dsb">{value}</p>
    {subtitle && <p className="metric-subtitle-dsb">{subtitle}</p>}
  </div>
);

export default Dashboard;