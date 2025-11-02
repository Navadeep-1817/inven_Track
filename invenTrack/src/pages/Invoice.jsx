import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Download, 
  Eye, 
  Filter, 
  Calendar, 
  DollarSign, 
  ShoppingBag,
  Store,
  X,
  FileText,
  Printer,
  RefreshCw
} from 'lucide-react';
import '../styles/Invoice.css';

const API_BASE = 'http://localhost:5000/api';

const Invoice = () => {
  const [invoices, setInvoices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    branch: '',
    status: '',
    paymentMethod: '',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    searchTerm: ''
  });

  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    completedInvoices: 0,
    pendingInvoices: 0
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 1000,
    total: 0,
    pages: 0
  });

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
    fetchInvoices();
    fetchStatistics();
  }, [filters, pagination.page]);

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API_BASE}/branches`, getAuthConfig());
      setBranches(response.data || []);
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError('Failed to fetch branches');
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: pagination.limit,
        page: pagination.page
      });

      if (filters.branch) params.append('branch', filters.branch);
      if (filters.status) params.append('status', filters.status);
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters.searchTerm) params.append('search', filters.searchTerm);

      const response = await axios.get(
        `${API_BASE}/invoices?${params.toString()}`,
        getAuthConfig()
      );

      if (response.data.success) {
        setInvoices(response.data.invoices || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }));
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch invoices');
      }
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      if (filters.branch) params.append('branchId', filters.branch);

      const response = await axios.get(
        `${API_BASE}/invoices/statistics?${params.toString()}`,
        getAuthConfig()
      );

      if (response.data.success) {
        setStats(response.data.statistics);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const resetFilters = () => {
    setFilters({
      branch: '',
      status: '',
      paymentMethod: '',
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      searchTerm: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const viewInvoiceDetails = async (billId) => {
    try {
      const response = await axios.get(
        `${API_BASE}/invoices/${billId}`,
        getAuthConfig()
      );
      setSelectedInvoice(response.data);
      setShowInvoiceModal(true);
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      alert(err.response?.data?.message || 'Failed to fetch invoice details');
    }
  };

  const downloadInvoice = (invoice) => {
    const invoiceData = {
      billId: invoice.billId,
      branch: invoice.branchName,
      date: new Date(invoice.billDate).toLocaleString(),
      customer: invoice.customerName || 'Walk-in Customer',
      phone: invoice.customerPhone || 'N/A',
      items: invoice.items,
      totals: invoice.totals,
      paymentMethod: invoice.paymentMethod,
      status: invoice.status,
      staff: invoice.staffName || 'N/A'
    };

    const dataStr = JSON.stringify(invoiceData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice_${invoice.billId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printInvoice = (invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print invoices');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.billId}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 30px; 
              color: #333;
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              border-bottom: 3px solid #333;
              padding-bottom: 20px;
            }
            .header h1 { 
              font-size: 32px; 
              margin-bottom: 10px;
              color: #2563eb;
            }
            .invoice-meta {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .invoice-details, .customer-details {
              flex: 1;
            }
            .invoice-details h3, .customer-details h3 {
              margin-bottom: 10px;
              color: #2563eb;
              font-size: 16px;
            }
            .invoice-details p, .customer-details p {
              margin: 5px 0;
              font-size: 14px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 30px 0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px; 
              text-align: left; 
            }
            th { 
              background-color: #2563eb; 
              color: white;
              font-weight: 600;
            }
            tbody tr:nth-child(even) {
              background-color: #f9fafb;
            }
            tbody tr:hover {
              background-color: #f3f4f6;
            }
            .totals { 
              margin-top: 30px; 
              text-align: right;
              border-top: 2px solid #ddd;
              padding-top: 20px;
            }
            .totals div { 
              margin: 8px 0; 
              font-size: 16px;
            }
            .totals .final-total {
              font-size: 22px;
              font-weight: bold;
              color: #2563eb;
              margin-top: 15px;
              padding-top: 15px;
              border-top: 2px solid #2563eb;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
            }
            .status-completed { background-color: #d1fae5; color: #065f46; }
            .status-pending { background-color: #fef3c7; color: #92400e; }
            @media print { 
              button { display: none; }
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
            <p style="font-size: 18px; color: #666;">Invoice #: ${invoice.billId}</p>
          </div>
          
          <div class="invoice-meta">
            <div class="invoice-details">
              <h3>Invoice Details</h3>
              <p><strong>Branch:</strong> ${invoice.branchName}</p>
              <p><strong>Date:</strong> ${new Date(invoice.billDate).toLocaleString()}</p>
              <p><strong>Payment:</strong> ${invoice.paymentMethod}</p>
              <p><strong>Status:</strong> <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span></p>
              <p><strong>Staff:</strong> ${invoice.staffName || 'N/A'}</p>
            </div>
            <div class="customer-details">
              <h3>Customer Details</h3>
              <p><strong>Name:</strong> ${invoice.customerName || 'Walk-in Customer'}</p>
              <p><strong>Phone:</strong> ${invoice.customerPhone || 'N/A'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td><strong>${item.name}</strong><br><small>${item.brand || ''}</small></td>
                  <td>${item.category}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.price.toFixed(2)}</td>
                  <td><strong>$${item.amount.toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div><strong>Subtotal:</strong> $${invoice.totals.subtotal.toFixed(2)}</div>
            <div><strong>Discount:</strong> -$${invoice.totals.discount.toFixed(2)}</div>
            <div><strong>Tax:</strong> $${invoice.totals.tax.toFixed(2)}</div>
            <div class="final-total">TOTAL: $${invoice.totals.total.toFixed(2)}</div>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>

          <button onclick="window.print()" style="
            margin-top: 30px; 
            padding: 12px 30px; 
            cursor: pointer;
            background-color: #2563eb;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            display: block;
            margin-left: auto;
            margin-right: auto;
          ">Print Invoice</button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportAllInvoices = () => {
    if (invoices.length === 0) {
      alert('No invoices to export');
      return;
    }

    const csvHeaders = ['Invoice ID', 'Branch', 'Date', 'Customer', 'Phone', 'Items Count', 'Total Amount', 'Payment Method', 'Status', 'Staff'];
    const csvRows = invoices.map(inv => [
      inv.billId,
      inv.branchName,
      new Date(inv.billDate).toLocaleString(),
      `"${inv.customerName || 'Walk-in'}"`,
      inv.customerPhone || 'N/A',
      inv.items.length,
      inv.totals.total.toFixed(2),
      inv.paymentMethod,
      inv.status,
      inv.staffName || 'N/A'
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices_${filters.startDate}_to_${filters.endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading && invoices.length === 0) {
    return (
      <div className="loading-container-invc">
        <div className="loading-spinner-invc"></div>
        <p>Loading invoices...</p>
      </div>
    );
  }

  return (
    <div className="invoice-container-invc">
      <div className="invoice-header-invc">
        <div>
          <h1 className="invoice-title-invc">Invoice Management</h1>
          <p className="invoice-subtitle-invc">View and manage all invoices across branches</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={fetchInvoices} 
            className="export-btn-invc"
            title="Refresh"
          >
            <RefreshCw size={20} />
            Refresh
          </button>
          <button 
            onClick={exportAllInvoices} 
            className="export-btn-invc" 
            disabled={invoices.length === 0}
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid-invc">
        <div className="stat-card-invc stat-card-blue-invc">
          <div className="stat-icon-invc">
            <FileText size={24} />
          </div>
          <div>
            <p className="stat-label-invc">Total Invoices</p>
            <p className="stat-value-invc">{stats.totalInvoices}</p>
          </div>
        </div>
        <div className="stat-card-invc stat-card-green-invc">
          <div className="stat-icon-invc">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="stat-label-invc">Total Revenue</p>
            <p className="stat-value-invc">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="stat-card-invc stat-card-purple-invc">
          <div className="stat-icon-invc">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="stat-label-invc">Completed</p>
            <p className="stat-value-invc">{stats.completedInvoices}</p>
          </div>
        </div>
        <div className="stat-card-invc stat-card-orange-invc">
          <div className="stat-icon-invc">
            <Calendar size={24} />
          </div>
          <div>
            <p className="stat-label-invc">Pending</p>
            <p className="stat-value-invc">{stats.pendingInvoices}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container-invc">
        <div className="filters-grid-invc">
          <div className="filter-group-invc">
            <label className="filter-label-invc">
              <Store size={16} />
              Branch
            </label>
            <select
              value={filters.branch}
              onChange={(e) => handleFilterChange('branch', e.target.value)}
              className="filter-select-invc"
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.branch_name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group-invc">
            <label className="filter-label-invc">
              <Filter size={16} />
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select-invc"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-group-invc">
            <label className="filter-label-invc">
              <DollarSign size={16} />
              Payment Method
            </label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              className="filter-select-invc"
            >
              <option value="">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="filter-group-invc">
            <label className="filter-label-invc">
              <Calendar size={16} />
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="filter-input-invc"
            />
          </div>

          <div className="filter-group-invc">
            <label className="filter-label-invc">
              <Calendar size={16} />
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="filter-input-invc"
            />
          </div>

          <div className="filter-group-invc">
            <label className="filter-label-invc">
              <Search size={16} />
              Search
            </label>
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              placeholder="Invoice ID, Customer..."
              className="filter-input-invc"
            />
          </div>
        </div>

        <button onClick={resetFilters} className="reset-btn-invc">
          Reset Filters
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message-invc">
          {error}
        </div>
      )}

      {/* Invoice Table */}
      {invoices.length === 0 && !loading ? (
        <div className="no-data-invc">
          <FileText size={48} />
          <h3>No Invoices Found</h3>
          <p>Try adjusting your filters or date range</p>
        </div>
      ) : (
        <>
          <div className="table-container-invc">
            <table className="invoice-table-invc">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Branch</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Staff</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.billId}>
                    <td className="invoice-id-invc">{invoice.billId}</td>
                    <td>{invoice.branchName}</td>
                    <td>{new Date(invoice.billDate).toLocaleDateString()}</td>
                    <td>
                      <div className="customer-info-invc">
                        <span>{invoice.customerName || 'Walk-in'}</span>
                        {invoice.customerPhone && (
                          <span className="phone-invc">{invoice.customerPhone}</span>
                        )}
                      </div>
                    </td>
                    <td>{invoice.items.length}</td>
                    <td className="amount-invc">
                      ${invoice.totals.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className="payment-badge-invc">
                        {invoice.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge-invc status-${invoice.status}-invc`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td>{invoice.staffName || 'N/A'}</td>
                    <td>
                      <div className="action-buttons-invc">
                        <button
                          onClick={() => viewInvoiceDetails(invoice.billId)}
                          className="action-btn-invc action-btn-view-invc"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => printInvoice(invoice)}
                          className="action-btn-invc action-btn-print-invc"
                          title="Print Invoice"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={() => downloadInvoice(invoice)}
                          className="action-btn-invc action-btn-download-invc"
                          title="Download JSON"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination-invc">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="pagination-btn-invc"
              >
                Previous
              </button>
              <span className="pagination-info-invc">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="pagination-btn-invc"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Invoice Detail Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="modal-overlay-invc" onClick={() => setShowInvoiceModal(false)}>
          <div className="modal-content-invc" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-invc">
              <h2>Invoice Details</h2>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="modal-close-invc"
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-body-invc">
              <div className="invoice-detail-grid-invc">
                <div className="detail-item-invc">
                  <span className="detail-label-invc">Invoice ID:</span>
                  <span className="detail-value-invc">{selectedInvoice.billId}</span>
                </div>
                <div className="detail-item-invc">
                  <span className="detail-label-invc">Branch:</span>
                  <span className="detail-value-invc">{selectedInvoice.branchName}</span>
                </div>
                <div className="detail-item-invc">
                  <span className="detail-label-invc">Date:</span>
                  <span className="detail-value-invc">
                    {new Date(selectedInvoice.billDate).toLocaleString()}
                  </span>
                </div>
                <div className="detail-item-invc">
                  <span className="detail-label-invc">Customer:</span>
                  <span className="detail-value-invc">
                    {selectedInvoice.customerName || 'Walk-in Customer'}
                  </span>
                </div>
                <div className="detail-item-invc">
                  <span className="detail-label-invc">Phone:</span>
                  <span className="detail-value-invc">
                    {selectedInvoice.customerPhone || 'N/A'}
                  </span>
                </div>
                <div className="detail-item-invc">
                  <span className="detail-label-invc">Payment Method:</span>
                  <span className="detail-value-invc">{selectedInvoice.paymentMethod}</span>
                </div>
                <div className="detail-item-invc">
                  <span className="detail-label-invc">Status:</span>
                  <span className={`status-badge-invc status-${selectedInvoice.status}-invc`}>
                    {selectedInvoice.status}
                  </span>
                </div>
                <div className="detail-item-invc">
                  <span className="detail-label-invc">Staff:</span>
                  <span className="detail-value-invc">{selectedInvoice.staffName || 'N/A'}</span>
                </div>
              </div>

              <h3 className="items-title-invc">Items</h3>
              <table className="items-table-invc">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>{item.brand || 'N/A'}</td>
                      <td>{item.quantity}</td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>${item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="totals-section-invc">
                <div className="total-row-invc">
                  <span>Subtotal:</span>
                  <span>${selectedInvoice.totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="total-row-invc">
                  <span>Discount:</span>
                  <span>-${selectedInvoice.totals.discount.toFixed(2)}</span>
                </div>
                <div className="total-row-invc">
                  <span>Tax:</span>
                  <span>${selectedInvoice.totals.tax.toFixed(2)}</span>
                </div>
                <div className="total-row-invc total-row-final-invc">
                  <span>Total:</span>
                  <span>${selectedInvoice.totals.total.toFixed(2)}</span>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="notes-section-invc">
                  <h4>Notes:</h4>
                  <p>{selectedInvoice.notes}</p>
                </div>
              )}

              <div className="modal-actions-invc">
                <button
                  onClick={() => printInvoice(selectedInvoice)}
                  className="modal-btn-invc modal-btn-primary-invc"
                >
                  <Printer size={18} />
                  Print Invoice
                </button>
                <button
                  onClick={() => downloadInvoice(selectedInvoice)}
                  className="modal-btn-invc modal-btn-secondary-invc"
                >
                  <Download size={18} />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoice;