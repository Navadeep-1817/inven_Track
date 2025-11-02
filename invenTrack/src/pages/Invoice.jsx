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
  User,
  X,
  FileText,
  Printer
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
    if (branches.length > 0) {
      fetchInvoices();
    }
  }, [filters, branches]);

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API_BASE}/branches`);
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
        limit: 1000
      });

      if (filters.branch) params.append('branch', filters.branch);
      if (filters.status) params.append('status', filters.status);
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters.searchTerm) params.append('search', filters.searchTerm);

      const response = await axios.get(
        `${API_BASE}/invoices?${params.toString()}`,
        getAuthConfig()
      );

      const invoiceData = response.data.invoices || [];
      setInvoices(invoiceData);
      calculateStats(invoiceData);
      setError(null);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to fetch invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invoiceData) => {
    const completed = invoiceData.filter(inv => inv.status === 'completed');
    const pending = invoiceData.filter(inv => inv.status === 'pending');
    const totalRevenue = completed.reduce((sum, inv) => sum + (inv.totals?.total || 0), 0);

    setStats({
      totalInvoices: invoiceData.length,
      totalRevenue,
      completedInvoices: completed.length,
      pendingInvoices: pending.length
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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
      alert('Failed to fetch invoice details');
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
      status: invoice.status
    };

    const dataStr = JSON.stringify(invoiceData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice_${invoice.billId}.json`;
    link.click();
  };

  const printInvoice = (invoice) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice.billId}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .invoice-details { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f4f4f4; }
            .totals { margin-top: 20px; text-align: right; }
            .totals div { margin: 5px 0; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
            <p>Invoice #: ${invoice.billId}</p>
          </div>
          <div class="invoice-details">
            <p><strong>Branch:</strong> ${invoice.branchName}</p>
            <p><strong>Date:</strong> ${new Date(invoice.billDate).toLocaleString()}</p>
            <p><strong>Customer:</strong> ${invoice.customerName || 'Walk-in Customer'}</p>
            <p><strong>Phone:</strong> ${invoice.customerPhone || 'N/A'}</p>
            <p><strong>Payment:</strong> ${invoice.paymentMethod}</p>
            <p><strong>Status:</strong> ${invoice.status}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.price.toFixed(2)}</td>
                  <td>$${item.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <div><strong>Subtotal:</strong> $${invoice.totals.subtotal.toFixed(2)}</div>
            <div><strong>Discount:</strong> $${invoice.totals.discount.toFixed(2)}</div>
            <div><strong>Tax:</strong> $${invoice.totals.tax.toFixed(2)}</div>
            <div style="font-size: 18px; margin-top: 10px;"><strong>Total:</strong> $${invoice.totals.total.toFixed(2)}</div>
          </div>
          <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">Print Invoice</button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportAllInvoices = () => {
    const csvHeaders = ['Invoice ID', 'Branch', 'Date', 'Customer', 'Phone', 'Items', 'Total', 'Payment', 'Status', 'Staff'];
    const csvRows = invoices.map(inv => [
      inv.billId,
      inv.branchName,
      new Date(inv.billDate).toLocaleString(),
      inv.customerName || 'N/A',
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

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
        <button onClick={exportAllInvoices} className="export-btn-invc" disabled={invoices.length === 0}>
          <Download size={20} />
          Export All
        </button>
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
            <p className="stat-value-invc">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
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

      {/* Invoice Table */}
      {error && (
        <div className="error-message-invc">
          {error}
        </div>
      )}

      {invoices.length === 0 && !loading ? (
        <div className="no-data-invc">
          <FileText size={48} />
          <h3>No Invoices Found</h3>
          <p>Try adjusting your filters or date range</p>
        </div>
      ) : (
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
                    ${invoice.totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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