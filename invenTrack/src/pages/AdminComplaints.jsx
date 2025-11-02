import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  XCircle,
  FileText,
  Calendar,
  User,
  Store,
  Filter,
  Search,
  Trash2,
  Eye,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import '../styles/AdminComplaints.css';

const API_BASE = 'http://localhost:5000/api';

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    branchId: '',
    status: '',
    priority: '',
    category: '',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Statistics
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    underReviewComplaints: 0,
    resolvedComplaints: 0,
    rejectedComplaints: 0
  });

  // Response form
  const [responseForm, setResponseForm] = useState({
    status: '',
    managerResponse: ''
  });

  const categories = ['Workplace', 'Equipment', 'Management', 'Customer', 'Safety', 'Other'];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];
  const statuses = ['Pending', 'Under Review', 'Resolved', 'Rejected'];

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
    fetchComplaints();
    fetchStatistics();
  }, [filters]);

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API_BASE}/branches`, getAuthConfig());
      setBranches(response.data || []);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      if (filters.branchId) params.append('branchId', filters.branchId);
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.category) params.append('category', filters.category);

      const response = await axios.get(
        `${API_BASE}/complaints?${params.toString()}`,
        getAuthConfig()
      );

      if (response.data.success) {
        setComplaints(response.data.complaints);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError(err.response?.data?.message || 'Failed to fetch complaints');
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

      if (filters.branchId) params.append('branchId', filters.branchId);

      const response = await axios.get(
        `${API_BASE}/complaints/statistics?${params.toString()}`,
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
  };

  const resetFilters = () => {
    setFilters({
      branchId: '',
      status: '',
      priority: '',
      category: '',
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });
  };

  const viewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setResponseForm({
      status: complaint.status,
      managerResponse: complaint.managerResponse || ''
    });
    setShowModal(true);
  };

  const handleResponseChange = (e) => {
    const { name, value } = e.target;
    setResponseForm(prev => ({ ...prev, [name]: value }));
  };

  const submitResponse = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.put(
        `${API_BASE}/complaints/${selectedComplaint._id}`,
        responseForm,
        getAuthConfig()
      );

      if (response.data.success) {
        setSuccessMessage('Complaint updated successfully!');
        setShowModal(false);
        fetchComplaints();
        fetchStatistics();
        
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error updating complaint:', err);
      alert(err.response?.data?.message || 'Failed to update complaint');
    }
  };

  const deleteComplaint = async (complaintId) => {
    if (!window.confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_BASE}/complaints/${complaintId}`,
        getAuthConfig()
      );

      if (response.data.success) {
        setSuccessMessage('Complaint deleted successfully!');
        fetchComplaints();
        fetchStatistics();
        
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error deleting complaint:', err);
      alert(err.response?.data?.message || 'Failed to delete complaint');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock size={18} color="#f59e0b" />;
      case 'Under Review':
        return <AlertCircle size={18} color="#3b82f6" />;
      case 'Resolved':
        return <CheckCircle size={18} color="#10b981" />;
      case 'Rejected':
        return <XCircle size={18} color="#ef4444" />;
      default:
        return <FileText size={18} />;
    }
  };

  const getStatusClass = (status) => {
    return `status-badge-admcmp status-${status.toLowerCase().replace(' ', '-')}-admcmp`;
  };

  const getPriorityClass = (priority) => {
    return `priority-badge-admcmp priority-${priority.toLowerCase()}-admcmp`;
  };

  return (
    <div className="complaints-container-admcmp">
      <div className="complaints-header-admcmp">
        <div>
          <h1 className="complaints-title-admcmp">Complaints</h1>
          <p className="complaints-subtitle-admcmp">View and manage complaints from all branches</p>
        </div>
        <button 
          onClick={fetchComplaints} 
          className="submit-btn-admcmp"
          style={{ alignSelf: 'flex-start' }}
        >
          <RefreshCw size={20} />
          Refresh
        </button>
      </div>

      {successMessage && (
        <div className="success-message-admcmp">
          <CheckCircle size={20} />
          {successMessage}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid-admcmp">
        <div className="stat-card-admcmp stat-card-blue-admcmp">
          <div className="stat-card-content-admcmp">
            <FileText size={32} color="#3b82f6" />
            <div>
              <p className="stat-label-admcmp">Total Complaints</p>
              <p className="stat-value-admcmp">{stats.totalComplaints}</p>
            </div>
          </div>
        </div>

        <div className="stat-card-admcmp stat-card-orange-admcmp">
          <div className="stat-card-content-admcmp">
            <Clock size={32} color="#f59e0b" />
            <div>
              <p className="stat-label-admcmp">Pending</p>
              <p className="stat-value-admcmp">{stats.pendingComplaints}</p>
            </div>
          </div>
        </div>

        <div className="stat-card-admcmp stat-card-blue-admcmp">
          <div className="stat-card-content-admcmp">
            <AlertCircle size={32} color="#3b82f6" />
            <div>
              <p className="stat-label-admcmp">Under Review</p>
              <p className="stat-value-admcmp">{stats.underReviewComplaints}</p>
            </div>
          </div>
        </div>

        <div className="stat-card-admcmp stat-card-green-admcmp">
          <div className="stat-card-content-admcmp">
            <CheckCircle size={32} color="#10b981" />
            <div>
              <p className="stat-label-admcmp">Resolved</p>
              <p className="stat-value-admcmp">{stats.resolvedComplaints}</p>
            </div>
          </div>
        </div>

        <div className="stat-card-admcmp stat-card-red-admcmp">
          <div className="stat-card-content-admcmp">
            <XCircle size={32} color="#ef4444" />
            <div>
              <p className="stat-label-admcmp">Rejected</p>
              <p className="stat-value-admcmp">{stats.rejectedComplaints}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container-admcmp">
        <div className="filters-grid-admcmp">
          <div className="filter-group-admcmp">
            <label className="filter-label-admcmp">
              <Store size={16} />
              Branch
            </label>
            <select
              value={filters.branchId}
              onChange={(e) => handleFilterChange('branchId', e.target.value)}
              className="filter-select-admcmp"
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.branch_name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group-admcmp">
            <label className="filter-label-admcmp">
              <Filter size={16} />
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select-admcmp"
            >
              <option value="">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="filter-group-admcmp">
            <label className="filter-label-admcmp">
              <TrendingUp size={16} />
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="filter-select-admcmp"
            >
              <option value="">All Priorities</option>
              {priorities.map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>

          <div className="filter-group-admcmp">
            <label className="filter-label-admcmp">
              <FileText size={16} />
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="filter-select-admcmp"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-group-admcmp">
            <label className="filter-label-admcmp">
              <Calendar size={16} />
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="filter-input-admcmp"
            />
          </div>

          <div className="filter-group-admcmp">
            <label className="filter-label-admcmp">
              <Calendar size={16} />
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="filter-input-admcmp"
            />
          </div>
        </div>

        <button 
          onClick={resetFilters} 
          className="reset-btn-admcmp"
        >
          Reset Filters
        </button>
      </div>

      {/* Complaints List */}
      {error && (
        <div className="error-message-admcmp">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-container-admcmp">
          <div className="loading-spinner-admcmp"></div>
          <p>Loading complaints...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="no-data-admcmp">
          <MessageSquare size={48} />
          <h3>No Complaints Found</h3>
          <p>Try adjusting your filters</p>
        </div>
      ) : (
        <div className="complaints-list-admcmp">
          {complaints.map((complaint) => (
            <div key={complaint._id} className="complaint-card-admcmp">
              <div className="complaint-card-header-admcmp">
                <div className="complaint-meta-admcmp">
                  <span className={getStatusClass(complaint.status)}>
                    {getStatusIcon(complaint.status)}
                    {complaint.status}
                  </span>
                  <span className={getPriorityClass(complaint.priority)}>
                    {complaint.priority}
                  </span>
                  <span className="category-badge-admcmp">
                    {complaint.category}
                  </span>
                </div>
                <div className="complaint-date-container-admcmp">
                  <div className="complaint-date-admcmp">
                    <Calendar size={16} />
                    {new Date(complaint.complaintDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="complaint-card-body-admcmp">
                <div className="complaint-info-row-admcmp">
                  <div className="complaint-info-admcmp">
                    <Store size={16} />
                    <span><strong>Branch:</strong> {complaint.branchName}</span>
                  </div>
                  <div className="complaint-info-admcmp">
                    <User size={16} />
                    <span><strong>Staff:</strong> {complaint.staffName} (ID: {complaint.employeeId})</span>
                  </div>
                </div>

                <p className="complaint-text-admcmp">
                  {complaint.complaintText}
                </p>

                {complaint.managerResponse && (
                  <div className="manager-response-admcmp">
                    <h4>Response:</h4>
                    <p>{complaint.managerResponse}</p>
                    {complaint.respondedAt && (
                      <small>
                        Responded on: {new Date(complaint.respondedAt).toLocaleString()}
                      </small>
                    )}
                  </div>
                )}

                <div className="complaint-actions-admcmp">
                  <button
                    onClick={() => viewComplaint(complaint)}
                    className="action-btn-admcmp action-btn-view-admcmp"
                  >
                    <Eye size={16} />
                    Review
                  </button>
                  <button
                    onClick={() => deleteComplaint(complaint._id)}
                    className="action-btn-admcmp action-btn-delete-admcmp"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showModal && selectedComplaint && (
        <div 
          className="modal-overlay-admcmp" 
          onClick={() => setShowModal(false)}
        >
          <div 
            className="modal-content-admcmp" 
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title-admcmp">Review Complaint</h2>

            <div className="complaint-details-admcmp">
              <p><strong>Branch:</strong> {selectedComplaint.branchName}</p>
              <p><strong>Staff:</strong> {selectedComplaint.staffName}</p>
              <p><strong>Employee ID:</strong> {selectedComplaint.employeeId}</p>
              <p><strong>Date:</strong> {new Date(selectedComplaint.complaintDate).toLocaleString()}</p>
              <p><strong>Category:</strong> {selectedComplaint.category}</p>
              <p><strong>Priority:</strong> {selectedComplaint.priority}</p>
            </div>

            <div className="complaint-content-admcmp">
              <h4>Complaint:</h4>
              <p className="complaint-text-modal-admcmp">
                {selectedComplaint.complaintText}
              </p>
            </div>

            <form onSubmit={submitResponse}>
              <div className="form-group-modal-admcmp">
                <label className="form-label-modal-admcmp">
                  Status
                </label>
                <select
                  name="status"
                  value={responseForm.status}
                  onChange={handleResponseChange}
                  required
                  className="form-select-modal-admcmp"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-modal-admcmp">
                <label className="form-label-modal-admcmp">
                  Response
                </label>
                <textarea
                  name="managerResponse"
                  value={responseForm.managerResponse}
                  onChange={handleResponseChange}
                  rows="4"
                  placeholder="Enter your response to this complaint..."
                  className="form-textarea-modal-admcmp"
                />
              </div>

              <div className="modal-actions-admcmp">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="modal-btn-admcmp modal-btn-cancel-admcmp"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-btn-admcmp modal-btn-submit-admcmp"
                >
                  Update Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComplaints;