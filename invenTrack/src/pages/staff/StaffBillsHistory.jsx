import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import "../../styles/StaffBillsHistory.css";

const StaffBillsHistory = () => {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchInfo, setBranchInfo] = useState(null);
  
  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [billsPerPage] = useState(10);
  
  // Selected bill for detail view
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    totalBills: 0,
    totalRevenue: 0,
    todayBills: 0,
    todayRevenue: 0,
    completedBills: 0,
    cancelledBills: 0,
  });

  useEffect(() => {
    fetchBranchInfo();
  }, []);

  useEffect(() => {
    if (branchInfo) {
      fetchBills();
    }
  }, [branchInfo]);

  useEffect(() => {
    applyFilters();
  }, [bills, startDate, endDate, searchQuery, statusFilter, paymentMethodFilter]);

  const fetchBranchInfo = async () => {
    try {
      const staffRes = await axiosInstance.get("/auth/me");
      const branchId = staffRes.data.branch_id;
      
      const branchRes = await axiosInstance.get("/branches");
      const branch = branchRes.data.find(b => b.branch_id === branchId);
      
      // ✅ FIX: Store branchId (camelCase) to match backend expectations
      setBranchInfo({
        branchId: branch.branch_id, // Store as branchId for consistency
        branch_name: branch.branch_name,
        branch_location: branch.branch_location || ""
      });
    } catch (error) {
      console.error("Error fetching branch info:", error);
      alert("Error loading branch information");
    }
  };

  const fetchBills = async () => {
    try {
      setLoading(true);
      console.log("Fetching bills for branchId:", branchInfo.branchId); // Debug log
      
      // ✅ FIX: Use branchId (camelCase) to match backend
      const response = await axiosInstance.get(`/bills/branch/${branchInfo.branchId}`, {
        params: {
          limit: 1000, // Get all bills for filtering on frontend
        }
      });
      
      console.log("Bills response:", response.data); // Debug log
      
      const billsData = response.data.bills || response.data || [];
      setBills(billsData);
      calculateStatistics(billsData);
    } catch (error) {
      console.error("Error fetching bills:", error);
      console.error("Error details:", error.response?.data); // More detailed error logging
      alert("Error loading bills: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (billsData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = billsData.reduce((acc, bill) => {
      const billDate = new Date(bill.billDate);
      billDate.setHours(0, 0, 0, 0);
      
      if (bill.status === 'completed') {
        acc.totalRevenue += parseFloat(bill.totals.total);
        acc.completedBills += 1;
        
        if (billDate.getTime() === today.getTime()) {
          acc.todayRevenue += parseFloat(bill.totals.total);
          acc.todayBills += 1;
        }
      }
      
      if (bill.status === 'cancelled') {
        acc.cancelledBills += 1;
      }
      
      return acc;
    }, {
      totalBills: billsData.length,
      totalRevenue: 0,
      todayBills: 0,
      todayRevenue: 0,
      completedBills: 0,
      cancelledBills: 0,
    });
    
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...bills];
    
    // Date range filter
    if (startDate) {
      filtered = filtered.filter(bill => {
        const billDate = new Date(bill.billDate);
        return billDate >= new Date(startDate);
      });
    }
    
    if (endDate) {
      filtered = filtered.filter(bill => {
        const billDate = new Date(bill.billDate);
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        return billDate <= endDateTime;
      });
    }
    
    // Search filter (bill number, customer name, phone)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bill => 
        bill.billNumber.toLowerCase().includes(query) ||
        bill.customer.name.toLowerCase().includes(query) ||
        bill.customer.phone.includes(query)
      );
    }
    
    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(bill => bill.status === statusFilter);
    }
    
    // Payment method filter
    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter(bill => bill.paymentMethod === paymentMethodFilter);
    }
    
    setFilteredBills(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    setStatusFilter("all");
    setPaymentMethodFilter("all");
  };

  const setQuickDateFilter = (type) => {
    const today = new Date();
    let start = new Date();
    
    switch(type) {
      case 'today':
        start = today;
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        break;
      case 'week':
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start.setMonth(today.getMonth() - 1);
        break;
      default:
        return;
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  const viewBillDetails = (bill) => {
    setSelectedBill(bill);
    setShowBillModal(true);
  };

  const downloadBillPDF = (bill) => {
    // Create a temporary element with the bill content
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generateBillHTML(bill));
    printWindow.document.close();
    printWindow.print();
  };

  const generateBillHTML = (bill) => {
    const billDate = new Date(bill.billDate).toLocaleString('en-IN');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${bill.billNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header-stfblhst { text-align: center; margin-bottom: 30px; }
          .company-info-stfblhst { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #667eea; color: white; }
          .totals-stfblhst { margin-top: 20px; text-align: right; }
          .total-row-stfblhst { font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="header-stfblhst">
          <h1>${bill.branchName}</h1>
          <p>${bill.branchLocation}</p>
          <h2>TAX INVOICE</h2>
        </div>
        
        <div class="company-info-stfblhst">
          <p><strong>Invoice No:</strong> ${bill.billNumber}</p>
          <p><strong>Date:</strong> ${billDate}</p>
          <p><strong>Customer:</strong> ${bill.customer.name}</p>
          <p><strong>Phone:</strong> ${bill.customer.phone}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items.map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${item.name}<br><small>${item.brand}</small></td>
                <td>${item.quantity}</td>
                <td>₹${parseFloat(item.price).toFixed(2)}</td>
                <td>₹${parseFloat(item.amount).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals-stfblhst">
          <p>Subtotal: ₹${parseFloat(bill.totals.subtotal).toFixed(2)}</p>
          ${bill.discount > 0 ? `<p>Discount (${bill.discount}%): -₹${parseFloat(bill.totals.discountAmount).toFixed(2)}</p>` : ''}
          <p>GST (${bill.gstRate}%): ₹${parseFloat(bill.totals.gstAmount).toFixed(2)}</p>
          <p class="total-row-stfblhst">Total: ₹${parseFloat(bill.totals.total).toFixed(2)}</p>
        </div>
        
        <p style="text-align: center; margin-top: 40px;">Thank you for your business!</p>
      </body>
      </html>
    `;
  };

  // Pagination
  const indexOfLastBill = currentPage * billsPerPage;
  const indexOfFirstBill = indexOfLastBill - billsPerPage;
  const currentBills = filteredBills.slice(indexOfFirstBill, indexOfLastBill);
  const totalPages = Math.ceil(filteredBills.length / billsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="bills-history-container-stfblhst">
        <div className="loading-spinner-bills-stfblhst">
          <div className="spinner-bills-stfblhst"></div>
          <p>Loading bills history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bills-history-container-stfblhst">
      <div className="bills-history-wrapper-stfblhst">
        
        {/* Header */}
        <div className="bills-header-stfblhst">
          <div>
            <p className="page-subtitle-bills-stfblhst">{branchInfo?.branch_name}</p>
          </div>
          <button className="refresh-btn-stfblhst" onClick={fetchBills}>
            Refresh
          </button>
        </div>

        <div className="stats-grid-stfblhst">
          <div className="stat-card-stfblhst total-stfblhst">
            <div className="stat-details-stfblhst">
              <p className="stat-label-stfblhst">Total Revenue</p>
              <p className="stat-value-stfblhst">₹{stats.totalRevenue.toFixed(2)}</p>
              <p className="stat-subtext-stfblhst">{stats.completedBills} completed bills</p>
            </div>
          </div>
          
          <div className="stat-card-stfblhst today-stfblhst">
            <div className="stat-icon-stfblhst"></div>
            <div className="stat-details-stfblhst">
              <p className="stat-label-stfblhst">Today's Revenue</p>
              <p className="stat-value-stfblhst">₹{stats.todayRevenue.toFixed(2)}</p>
              <p className="stat-subtext-stfblhst">{stats.todayBills} bills today</p>
            </div>
          </div>
          
          <div className="stat-card-stfblhst bills-stfblhst">
            <div className="stat-details-stfblhst">
              <p className="stat-label-stfblhst">Total Bills</p>
              <p className="stat-value-stfblhst">{stats.totalBills}</p>
              <p className="stat-subtext-stfblhst">{stats.cancelledBills} cancelled</p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="filters-section-stfblhst">
          <h2 className="section-title-stfblhst">Filters</h2>
          
          {/* Quick Date Filters */}
          <div className="quick-filters-stfblhst">
            <button onClick={() => setQuickDateFilter('today')} className="quick-filter-btn-stfblhst">
              Today
            </button>
            <button onClick={() => setQuickDateFilter('yesterday')} className="quick-filter-btn-stfblhst">
              Yesterday
            </button>
            <button onClick={() => setQuickDateFilter('week')} className="quick-filter-btn-stfblhst">
              Last 7 Days
            </button>
            <button onClick={() => setQuickDateFilter('month')} className="quick-filter-btn-stfblhst">
              Last Month
            </button>
          </div>
          
          {/* Detailed Filters */}
          <div className="filters-grid-stfblhst">
            <div className="filter-group-stfblhst">
              <label> Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="filter-group-stfblhst">
              <label> End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="filter-group-stfblhst">
              <label> Search</label>
              <input
                type="text"
                placeholder="Bill #, Customer, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="filter-group-stfblhst">
              <label>Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            
            <div className="filter-group-stfblhst">
              <label> Payment Method</label>
              <select value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)}>
                <option value="all">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>
            
            <div className="filter-group-stfblhst">
              <button className="clear-filters-btn-stfblhst" onClick={clearFilters}>
                 Clear Filters
              </button>
            </div>
          </div>
          
          <p className="results-count-stfblhst">
            Showing {currentBills.length} of {filteredBills.length} bills
          </p>
        </div>

        {/* Bills Table */}
        <div className="bills-table-section-stfblhst">
          {currentBills.length === 0 ? (
            <div className="no-bills-stfblhst">
              <p>📭 No bills found matching your filters</p>
            </div>
          ) : (
            <div className="table-responsive-stfblhst">
              <table className="bills-table-stfblhst">
                <thead>
                  <tr>
                    <th>Bill #</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBills.map((bill) => (
                    <tr key={bill._id}>
                      <td className="bill-number-stfblhst">{bill.billNumber}</td>
                      <td>
                        {new Date(bill.billDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <div className="customer-info-stfblhst">
                          <p className="customer-name-stfblhst">{bill.customer.name}</p>
                          <p className="customer-phone-stfblhst">{bill.customer.phone}</p>
                        </div>
                      </td>
                      <td>{bill.items.length} items</td>
                      <td className="amount-stfblhst">₹{parseFloat(bill.totals.total).toFixed(2)}</td>
                      <td>
                        <span className={`payment-badge-stfblhst ${bill.paymentMethod.toLowerCase().replace(' ', '-')}-stfblhst`}>
                          {bill.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge-stfblhst ${bill.status}-stfblhst`}>
                          {bill.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-stfblhst">
                          <button 
                            className="action-btn-stfblhst view-btn-stfblhst"
                            onClick={() => viewBillDetails(bill)}
                            title="View Details"
                          >
                            👁️
                          </button>
                          <button 
                            className="action-btn-stfblhst download-btn-stfblhst"
                            onClick={() => downloadBillPDF(bill)}
                            title="Download PDF"
                          >
                            📥
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-stfblhst">
              <button 
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn-stfblhst"
              >
                ← Previous
              </button>
              
              <div className="pagination-numbers-stfblhst">
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => paginate(pageNumber)}
                        className={`pagination-btn-stfblhst ${currentPage === pageNumber ? 'active-stfblhst' : ''}`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return <span key={pageNumber} className="pagination-dots-stfblhst">...</span>;
                  }
                  return null;
                })}
              </div>
              
              <button 
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn-stfblhst"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bill Detail Modal */}
      {showBillModal && selectedBill && (
        <div className="modal-overlay-stfblhst" onClick={() => setShowBillModal(false)}>
          <div className="modal-content-stfblhst" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-stfblhst">
              <h2>Bill Details</h2>
              <button className="close-btn-stfblhst" onClick={() => setShowBillModal(false)}>✕</button>
            </div>
            
            <div className="modal-body-stfblhst">
              {/* Bill Info */}
              <div className="bill-detail-section-stfblhst">
                <h3>📋 Bill Information</h3>
                <div className="detail-grid-stfblhst">
                  <div className="detail-item-stfblhst">
                    <span className="detail-label-stfblhst">Bill Number:</span>
                    <span className="detail-value-stfblhst">{selectedBill.billNumber}</span>
                  </div>
                  <div className="detail-item-stfblhst">
                    <span className="detail-label-stfblhst">Date:</span>
                    <span className="detail-value-stfblhst">
                      {new Date(selectedBill.billDate).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="detail-item-stfblhst">
                    <span className="detail-label-stfblhst">Status:</span>
                    <span className={`status-badge-stfblhst ${selectedBill.status}-stfblhst`}>
                      {selectedBill.status}
                    </span>
                  </div>
                  <div className="detail-item-stfblhst">
                    <span className="detail-label-stfblhst">Payment Method:</span>
                    <span className="detail-value-stfblhst">{selectedBill.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bill-detail-section-stfblhst">
                <h3>👤 Customer Information</h3>
                <div className="detail-grid-stfblhst">
                  <div className="detail-item-stfblhst">
                    <span className="detail-label-stfblhst">Name:</span>
                    <span className="detail-value-stfblhst">{selectedBill.customer.name}</span>
                  </div>
                  <div className="detail-item-stfblhst">
                    <span className="detail-label-stfblhst">Phone:</span>
                    <span className="detail-value-stfblhst">{selectedBill.customer.phone}</span>
                  </div>
                  {selectedBill.customer.email && (
                    <div className="detail-item-stfblhst">
                      <span className="detail-label-stfblhst">Email:</span>
                      <span className="detail-value-stfblhst">{selectedBill.customer.email}</span>
                    </div>
                  )}
                  {selectedBill.customer.address && (
                    <div className="detail-item-stfblhst full-width-stfblhst">
                      <span className="detail-label-stfblhst">Address:</span>
                      <span className="detail-value-stfblhst">{selectedBill.customer.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="bill-detail-section-stfblhst">
                <h3>🛒 Items ({selectedBill.items.length})</h3>
                <div className="items-list-stfblhst">
                  {selectedBill.items.map((item, index) => (
                    <div key={index} className="item-row-stfblhst">
                      <div className="item-info-stfblhst">
                        <p className="item-name-stfblhst">{item.name}</p>
                        <p className="item-meta-stfblhst">{item.brand} | {item.pid}</p>
                      </div>
                      <div className="item-quantity-stfblhst">Qty: {item.quantity}</div>
                      <div className="item-price-stfblhst">₹{parseFloat(item.price).toFixed(2)}</div>
                      <div className="item-amount-stfblhst">₹{parseFloat(item.amount).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bill-detail-section-stfblhst">
                <h3>💰 Bill Summary</h3>
                <div className="totals-grid-stfblhst">
                  <div className="total-row-stfblhst">
                    <span>Subtotal:</span>
                    <span>₹{parseFloat(selectedBill.totals.subtotal).toFixed(2)}</span>
                  </div>
                  {selectedBill.discount > 0 && (
                    <div className="total-row-stfblhst discount-stfblhst">
                      <span>Discount ({selectedBill.discount}%):</span>
                      <span>-₹{parseFloat(selectedBill.totals.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="total-row-stfblhst">
                    <span>Taxable Amount:</span>
                    <span>₹{parseFloat(selectedBill.totals.taxableAmount).toFixed(2)}</span>
                  </div>
                  <div className="total-row-stfblhst">
                    <span>GST ({selectedBill.gstRate}%):</span>
                    <span>₹{parseFloat(selectedBill.totals.gstAmount).toFixed(2)}</span>
                  </div>
                  <div className="total-row-stfblhst final-stfblhst">
                    <span><strong>Total Amount:</strong></span>
                    <span><strong>₹{parseFloat(selectedBill.totals.total).toFixed(2)}</strong></span>
                  </div>
                </div>
              </div>

              {selectedBill.notes && (
                <div className="bill-detail-section-stfblhst">
                  <h3>📝 Notes</h3>
                  <p className="notes-text-stfblhst">{selectedBill.notes}</p>
                </div>
              )}
            </div>
            
            <div className="modal-footer-stfblhst">
              <button className="modal-action-btn-stfblhst download-stfblhst" onClick={() => downloadBillPDF(selectedBill)}>
                📥 Download PDF
              </button>
              <button className="modal-action-btn-stfblhst close-stfblhst" onClick={() => setShowBillModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffBillsHistory;