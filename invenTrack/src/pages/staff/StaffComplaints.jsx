import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MessageSquare, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  XCircle,
  FileText,
  Calendar,
  User
} from 'lucide-react';
import "../../styles/StaffComplaints.css";

const API_BASE = 'http://localhost:5000/api';

const StaffComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [form, setForm] = useState({
    complaintText: '',
    category: 'Other',
    priority: 'Medium',
    isAnonymous: false
  });

  const [filterStatus, setFilterStatus] = useState('');

  const categories = ['Workplace', 'Equipment', 'Management', 'Customer', 'Safety', 'Other'];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  useEffect(() => {
    fetchMyComplaints();
  }, [filterStatus]);

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);

      const response = await axios.get(
        `${API_BASE}/complaints/my-complaints?${params.toString()}`,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.complaintText.trim().length < 10) {
      setError('Complaint must be at least 10 characters long');
      return;
    }

    setSubmitLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      const response = await axios.post(
        `${API_BASE}/complaints`,
        form,
        getAuthConfig()
      );

      if (response.data.success) {
        setSuccessMessage('Complaint submitted successfully!');
        setForm({
          complaintText: '',
          category: 'Other',
          priority: 'Medium',
          isAnonymous: false
        });
        fetchMyComplaints();
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (err) {
      console.error('Error submitting complaint:', err);
      setError(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
    return `status-badge-cmp status-${status.toLowerCase().replace(' ', '-')}-cmp`;
  };

  const getPriorityClass = (priority) => {
    return `priority-badge-cmp priority-${priority.toLowerCase()}-cmp`;
  };

  return (
    <div className="complaints-container-cmp">
      <div className="complaints-header-cmp">
        <div>
          <h1 className="complaints-title-cmp">Complaints</h1>
          <p className="complaints-subtitle-cmp">Submit and track your workplace concerns</p>
        </div>
      </div>

      {/* Submit New Complaint Form */}
      <div className="complaint-form-section-cmp">
        <h2 className="form-title-cmp">
          <MessageSquare size={24} />
          Submit New Complaint
        </h2>

        <form onSubmit={handleSubmit} className="complaint-form-cmp">
          <div className="form-grid-cmp">
            <div className="form-group-cmp full-width-cmp">
              <label className="form-label-cmp">
                Complaint Description *
              </label>
              <textarea
                name="complaintText"
                value={form.complaintText}
                onChange={handleChange}
                placeholder="Describe your complaint in detail (minimum 10 characters)..."
                className="form-textarea-cmp"
                rows="6"
                required
                disabled={submitLoading}
              />
              <small className="character-count-cmp">
                {form.complaintText.length} characters
              </small>
            </div>

            <div className="form-group-cmp">
              <label className="form-label-cmp">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="form-select-cmp"
                disabled={submitLoading}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group-cmp">
              <label className="form-label-cmp">Priority</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="form-select-cmp"
                disabled={submitLoading}
              >
                {priorities.map(pri => (
                  <option key={pri} value={pri}>{pri}</option>
                ))}
              </select>
            </div>

            <div className="form-group-cmp full-width-cmp">
              <label className="checkbox-label-cmp">
                <input
                  type="checkbox"
                  name="isAnonymous"
                  checked={form.isAnonymous}
                  onChange={handleChange}
                  disabled={submitLoading}
                />
                <span>Submit as Anonymous</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="error-message-cmp">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="success-message-cmp">
              <CheckCircle size={20} />
              {successMessage}
            </div>
          )}

          <button 
            type="submit" 
            className="submit-btn-cmp"
            disabled={submitLoading}
          >
            <Send size={20} />
            {submitLoading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </div>

      {/* My Complaints Section */}
      <div className="my-complaints-section-cmp">
        <div className="section-header-cmp">
          <h2 className="section-title-cmp">
            <FileText size={24} />
            My Complaints History
          </h2>
          <div className="filter-group-cmp">
            <label>Filter by Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select-cmp"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-container-cmp">
            <div className="loading-spinner-cmp"></div>
            <p>Loading complaints...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="no-data-cmp">
            <MessageSquare size={48} />
            <h3>No Complaints Found</h3>
            <p>You haven't submitted any complaints yet</p>
          </div>
        ) : (
          <div className="complaints-list-cmp">
            {complaints.map((complaint) => (
              <div key={complaint._id} className="complaint-card-cmp">
                <div className="complaint-card-header-cmp">
                  <div className="complaint-meta-cmp">
                    <span className={getStatusClass(complaint.status)}>
                      {getStatusIcon(complaint.status)}
                      {complaint.status}
                    </span>
                    <span className={getPriorityClass(complaint.priority)}>
                      {complaint.priority}
                    </span>
                    <span className="category-badge-cmp">
                      {complaint.category}
                    </span>
                  </div>
                  <div className="complaint-date-cmp">
                    <Calendar size={16} />
                    {new Date(complaint.complaintDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="complaint-card-body-cmp">
                  <div className="complaint-info-cmp">
                    <User size={16} />
                    <span>
                      {complaint.isAnonymous ? 'Anonymous' : complaint.staffName}
                    </span>
                  </div>
                  <p className="complaint-text-cmp">
                    {complaint.complaintText}
                  </p>

                  {complaint.managerResponse && (
                    <div className="manager-response-cmp">
                      <h4>Manager Response:</h4>
                      <p>{complaint.managerResponse}</p>
                      {complaint.respondedAt && (
                        <small>
                          Responded on: {new Date(complaint.respondedAt).toLocaleString()}
                        </small>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffComplaints;