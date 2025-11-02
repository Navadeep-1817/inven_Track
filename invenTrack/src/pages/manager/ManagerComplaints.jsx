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
  Filter,
  TrendingUp,
  RefreshCw,
  Send
} from 'lucide-react';
import "./../../styles/ManagerComplaints.css";

const API_BASE = 'http://localhost:5000/api';

const ManagerComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [filters, setFilters] = useState({
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
    fetchComplaints();
    fetchStatistics();
  }, [filters]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate
      });

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
    
    if (!responseForm.managerResponse.trim()) {
      alert('Please enter a response before updating');
      return;
    }

    try {
      const response = await axios.put(
        `${API_BASE}/complaints/${selectedComplaint._id}`,
        responseForm,
        getAuthConfig()
      );

      if (response.data.success) {
        setSuccessMessage('Response submitted successfully!');
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
    return `status-badge-mngcmp status-${status.toLowerCase().replace(' ', '-')}-mngcmp`;
  };

  const getPriorityClass = (priority) => {
    return `priority-badge-mngcmp priority-${priority.toLowerCase()}-mngcmp`;
  };

  return (
    <div className="complaints-container-mngcmp">
      <div className="complaints-header-mngcmp">
        <div className="header-content-mngcmp">
          <h1 className="complaints-title-mngcmp">Manager - Complaints Management</h1>
          <p className="complaints-subtitle-mngcmp">Review and respond to complaints from your branch staff</p>
        </div>
        <button 
          onClick={fetchComplaints} 
          className="refresh-btn-mngcmp"
        >
          <RefreshCw size={20} />
          Refresh
        </button>
      </div>

      {successMessage && (
        <div className="success-message-mngcmp">
          <CheckCircle size={20} />
          {successMessage}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid-mngcmp">
        <div className="stat-card-mngcmp stat-total-mngcmp">
          <div className="stat-content-mngcmp">
            <FileText size={32} className="stat-icon-mngcmp" />
            <div className="stat-info-mngcmp">
              <p className="stat-label-mngcmp">Total</p>
              <p className="stat-value-mngcmp">{stats.totalComplaints}</p>
            </div>
          </div>
        </div>

        <div className="stat-card-mngcmp stat-pending-mngcmp">
          <div className="stat-content-mngcmp">
            <Clock size={32} className="stat-icon-mngcmp" />
            <div className="stat-info-mngcmp">
              <p className="stat-label-mngcmp">Pending</p>
              <p className="stat-value-mngcmp">{stats.pendingComplaints}</p>
            </div>
          </div>
        </div>

        <div className="stat-card-mngcmp stat-review-mngcmp">
          <div className="stat-content-mngcmp">
            <AlertCircle size={32} className="stat-icon-mngcmp" />
            <div className="stat-info-mngcmp">
              <p className="stat-label-mngcmp">Under Review</p>
              <p className="stat-value-mngcmp">{stats.underReviewComplaints}</p>
            </div>
          </div>
        </div>

        <div className="stat-card-mngcmp stat-resolved-mngcmp">
          <div className="stat-content-mngcmp">
            <CheckCircle size={32} className="stat-icon-mngcmp" />
            <div className="stat-info-mngcmp">
              <p className="stat-label-mngcmp">Resolved</p>
              <p className="stat-value-mngcmp">{stats.resolvedComplaints}</p>
            </div>
          </div>
        </div>

        <div className="stat-card-mngcmp stat-rejected-mngcmp">
          <div className="stat-content-mngcmp">
            <XCircle size={32} className="stat-icon-mngcmp" />
            <div className="stat-info-mngcmp">
              <p className="stat-label-mngcmp">Rejected</p>
              <p className="stat-value-mngcmp">{stats.rejectedComplaints}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container-mngcmp">
        <div className="filters-grid-mngcmp">
          <div className="filter-group-mngcmp">
            <label className="filter-label-mngcmp">
              <Filter size={16} />
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select-mngcmp"
            >
              <option value="">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="filter-group-mngcmp">
            <label className="filter-label-mngcmp">
              <TrendingUp size={16} />
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="filter-select-mngcmp"
            >
              <option value="">All Priorities</option>
              {priorities.map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>

          <div className="filter-group-mngcmp">
            <label className="filter-label-mngcmp">
              <FileText size={16} />
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="filter-select-mngcmp"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-group-mngcmp">
            <label className="filter-label-mngcmp">
              <Calendar size={16} />
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="filter-input-mngcmp"
            />
          </div>

          <div className="filter-group-mngcmp">
            <label className="filter-label-mngcmp">
              <Calendar size={16} />
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="filter-input-mngcmp"
            />
          </div>
        </div>

        <button 
          onClick={resetFilters} 
          className="reset-btn-mngcmp"
        >
          Reset Filters
        </button>
      </div>

      {/* Complaints List */}
      {error && (
        <div className="error-message-mngcmp">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-container-mngcmp">
          <div className="loading-spinner-mngcmp"></div>
          <p>Loading complaints...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="no-data-mngcmp">
          <MessageSquare size={48} />
          <h3>No Complaints Found</h3>
          <p>No complaints have been submitted from your branch yet</p>
        </div>
      ) : (
        <div className="complaints-list-mngcmp">
          {complaints.map((complaint) => (
            <div key={complaint._id} className="complaint-card-mngcmp">
              <div className="complaint-card-header-mngcmp">
                <div className="complaint-meta-mngcmp">
                  <span className={getStatusClass(complaint.status)}>
                    {getStatusIcon(complaint.status)}
                    {complaint.status}
                  </span>
                  <span className={getPriorityClass(complaint.priority)}>
                    {complaint.priority}
                  </span>
                  <span className="category-badge-mngcmp">
                    {complaint.category}
                  </span>
                </div>
                <div className="complaint-date-mngcmp">
                  <Calendar size={16} />
                  {new Date(complaint.complaintDate).toLocaleDateString()}
                </div>
              </div>

              <div className="complaint-card-body-mngcmp">
                <div className="complaint-info-mngcmp">
                  <User size={16} />
                  <span>
                    <strong>From:</strong> {complaint.isAnonymous ? 'Anonymous Staff Member' : `${complaint.staffName} (ID: ${complaint.employeeId})`}
                  </span>
                </div>

                <p className="complaint-text-mngcmp">
                  {complaint.complaintText}
                </p>

                {complaint.managerResponse && (
                  <div className="manager-response-mngcmp">
                    <h4>Your Response:</h4>
                    <p>{complaint.managerResponse}</p>
                    {complaint.respondedAt && (
                      <small>
                        Responded on: {new Date(complaint.respondedAt).toLocaleString()}
                      </small>
                    )}
                  </div>
                )}

                <div className="complaint-actions-mngcmp">
                  <button
                    onClick={() => viewComplaint(complaint)}
                    className={`response-btn-mngcmp ${complaint.managerResponse ? 'update-btn-mngcmp' : 'respond-btn-mngcmp'}`}
                  >
                    <Send size={16} />
                    {complaint.managerResponse ? 'Update Response' : 'Respond to Complaint'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {showModal && selectedComplaint && (
        <div className="modal-overlay-mngcmp" onClick={() => setShowModal(false)}>
          <div className="modal-content-mngcmp" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-mngcmp">
              <h2>
                <MessageSquare size={24} />
                Respond to Complaint
              </h2>
            </div>

            <div className="complaint-summary-mngcmp">
              <p><strong>Staff:</strong> {selectedComplaint.isAnonymous ? 'Anonymous' : selectedComplaint.staffName}</p>
              <p><strong>Employee ID:</strong> {selectedComplaint.employeeId}</p>
              <p><strong>Date:</strong> {new Date(selectedComplaint.complaintDate).toLocaleString()}</p>
              <p><strong>Category:</strong> {selectedComplaint.category}</p>
              <p><strong>Priority:</strong> {selectedComplaint.priority}</p>
            </div>

            <div className="complaint-details-mngcmp">
              <h4>Complaint Details:</h4>
              <p className="complaint-text-display-mngcmp">
                {selectedComplaint.complaintText}
              </p>
            </div>

            <form onSubmit={submitResponse} className="response-form-mngcmp">
              <div className="form-group-mngcmp">
                <label>
                  Update Status *
                </label>
                <select
                  name="status"
                  value={responseForm.status}
                  onChange={handleResponseChange}
                  required
                  className="form-select-mngcmp"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <small>
                  Change status to track complaint progress
                </small>
              </div>

              <div className="form-group-mngcmp">
                <label>
                  Your Response *
                </label>
                <textarea
                  name="managerResponse"
                  value={responseForm.managerResponse}
                  onChange={handleResponseChange}
                  rows="5"
                  required
                  placeholder="Provide a detailed response to the staff member's complaint. Explain what actions will be taken or have been taken..."
                  className="form-textarea-mngcmp"
                />
                <small>
                  This response will be visible to the staff member
                </small>
              </div>

              <div className="modal-actions-mngcmp">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="cancel-btn-mngcmp"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-response-btn-mngcmp"
                >
                  <Send size={16} />
                  Submit Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerComplaints;