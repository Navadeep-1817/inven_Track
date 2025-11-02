import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./../../styles/ManagerAppraisal.css";

const ManagerAppraisal = () => {
  const [activeTab, setActiveTab] = useState("appraisal");
  
  const [managerInfo, setManagerInfo] = useState(null);
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  const [salaries, setSalaries] = useState([]);
  const [staffWithoutSalary, setStaffWithoutSalary] = useState([]);
  const [salaryStats, setSalaryStats] = useState(null);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  
  const [formData, setFormData] = useState({
    review_period: "H1",
    review_year: new Date().getFullYear(),
    strengths: "",
    areas_of_improvement: "",
    achievements: "",
    goals_for_next_period: "",
    overall_rating: "",
    additional_comments: "",
  });

  const [salaryFormData, setSalaryFormData] = useState({
    initial_salary: "",
    joining_date: "",
    new_salary: "",
    effective_date: "",
    reason: "",
    salary_frequency: "Monthly",
    payment_method: "Bank Transfer",
    allowances: {
      hra: 0,
      da: 0,
      transport: 0,
      medical: 0,
      other: 0,
    },
    tax_deduction: 0,
    other_deductions: 0,
    bank_details: {
      account_number: "",
      ifsc_code: "",
      bank_name: "",
      account_holder_name: "",
    },
    notes: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingAppraisal, setEditingAppraisal] = useState(null);

  const getApiBaseUrl = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
      return import.meta.env.VITE_API_BASE_URL;
    }
    if (typeof process !== 'undefined' && process.env?.REACT_APP_API_BASE_URL) {
      return process.env.REACT_APP_API_BASE_URL;
    }
    return "http://localhost:5000/api";
  };

  const API_BASE_URL = getApiBaseUrl();

  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  // Fetch manager's own information
  const fetchManagerInfo = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      
      // Handle different response structures
      const userData = response.data.user || response.data;
      console.log("Manager data:", userData);
      
      // Normalize the branch_id field
      const normalizedUserData = {
        ...userData,
        branch_id: userData.branch_id || userData.branchId || userData.branch
      };
      
      setManagerInfo(normalizedUserData);
      setError("");
    } catch (err) {
      console.error("Error fetching manager info:", err);
      setError(err.response?.data?.message || "Failed to fetch manager information. Please ensure you are logged in.");
      setManagerInfo(null);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Fetch staff members in manager's branch
  const fetchStaff = useCallback(async () => {
    if (!managerInfo?.branch_id) {
      console.log("No branch_id available, skipping staff fetch");
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/manager/branch/${managerInfo.branch_id}/staff`,
        {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        }
      );
      setStaff(response.data.staff || []);
      setError("");
    } catch (err) {
      console.error("Error fetching staff:", err);
      setError(err.response?.data?.message || "Failed to fetch staff members");
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [managerInfo?.branch_id, API_BASE_URL]);

  // Fetch appraisals for the branch
  const fetchAppraisals = useCallback(async () => {
    if (!managerInfo?.branch_id) {
      console.log("No branch_id available, skipping appraisals fetch");
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/manager/appraisals/branch/${managerInfo.branch_id}`,
        {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        }
      );
      setAppraisals(response.data.appraisals || []);
      setError("");
    } catch (err) {
      console.error("Error fetching appraisals:", err);
      setError(err.response?.data?.message || "Failed to fetch appraisals");
      setAppraisals([]);
    } finally {
      setLoading(false);
    }
  }, [managerInfo?.branch_id, API_BASE_URL]);

  // Fetch salaries for the branch
  const fetchSalaries = useCallback(async () => {
    if (!managerInfo?.branch_id) {
      console.log("No branch_id available, skipping salaries fetch");
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/manager/salaries/branch/${managerInfo.branch_id}`,
        {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        }
      );
      setSalaries(response.data.salaries || []);
      setError("");
    } catch (err) {
      console.error("Error fetching salaries:", err);
      setError(err.response?.data?.message || "Failed to fetch salaries");
      setSalaries([]);
    } finally {
      setLoading(false);
    }
  }, [managerInfo?.branch_id, API_BASE_URL]);

  // Fetch staff without salary
  const fetchStaffWithoutSalary = useCallback(async () => {
    if (!managerInfo?.branch_id) {
      console.log("No branch_id available, skipping staff without salary fetch");
      return;
    }
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/manager/salaries/branch/${managerInfo.branch_id}/without-salary`,
        {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        }
      );
      setStaffWithoutSalary(response.data.employees || []);
    } catch (err) {
      console.error("Error fetching staff without salary:", err);
      setStaffWithoutSalary([]);
    }
  }, [managerInfo?.branch_id, API_BASE_URL]);

  // Fetch salary statistics
  const fetchSalaryStats = useCallback(async () => {
    if (!managerInfo?.branch_id) {
      console.log("No branch_id available, skipping salary stats fetch");
      return;
    }
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/manager/salaries/branch/${managerInfo.branch_id}/stats`,
        {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        }
      );
      setSalaryStats(response.data.stats || null);
    } catch (err) {
      console.error("Error fetching salary stats:", err);
      setSalaryStats(null);
    }
  }, [managerInfo?.branch_id, API_BASE_URL]);

  useEffect(() => {
    fetchManagerInfo();
  }, [fetchManagerInfo]);

  useEffect(() => {
    if (managerInfo?.branch_id) {
      if (activeTab === "appraisal") {
        fetchStaff();
        fetchAppraisals();
      } else if (activeTab === "salary") {
        fetchSalaries();
        fetchStaffWithoutSalary();
        fetchSalaryStats();
      }
    }
  }, [managerInfo?.branch_id, activeTab, fetchStaff, fetchAppraisals, fetchSalaries, fetchStaffWithoutSalary, fetchSalaryStats]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError("");
    setSuccessMessage("");
    setShowForm(false);
    setShowSalaryForm(false);
    setSelectedStaff("");
    setSelectedEmployee("");
  };

  const handleStaffChange = (e) => {
    setSelectedStaff(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      review_period: "H1",
      review_year: new Date().getFullYear(),
      strengths: "",
      areas_of_improvement: "",
      achievements: "",
      goals_for_next_period: "",
      overall_rating: "",
      additional_comments: "",
    });
    setEditingAppraisal(null);
  };

  const handleCreateNew = () => {
    if (!selectedStaff) {
      setError("Please select a staff member first");
      return;
    }
    resetForm();
    setShowForm(true);
    setError("");
    setSuccessMessage("");
  };

  const handleEdit = (appraisal) => {
    setEditingAppraisal(appraisal);
    setSelectedStaff(appraisal.staff_id?._id || appraisal.staff_id);
    setFormData({
      review_period: appraisal.review_period,
      review_year: appraisal.review_year,
      strengths: appraisal.strengths,
      areas_of_improvement: appraisal.areas_of_improvement,
      achievements: appraisal.achievements || "",
      goals_for_next_period: appraisal.goals_for_next_period || "",
      overall_rating: appraisal.overall_rating || "",
      additional_comments: appraisal.additional_comments || "",
    });
    setShowForm(true);
    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStaff) {
      setError("Please select a staff member");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const payload = {
        staff_id: selectedStaff,
        ...formData,
      };

      let response;
      if (editingAppraisal) {
        response = await axios.put(
          `${API_BASE_URL}/manager/appraisals/${editingAppraisal._id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
          }
        );
      } else {
        response = await axios.post(`${API_BASE_URL}/manager/appraisals`, payload, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
      }

      setSuccessMessage(response.data.message || "Appraisal saved successfully");
      setShowForm(false);
      resetForm();
      setSelectedStaff("");
      await fetchAppraisals();
    } catch (err) {
      console.error("Error saving appraisal:", err);
      setError(err.response?.data?.message || "Failed to save appraisal");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (appraisalId) => {
    if (!window.confirm("Are you sure you want to delete this appraisal?")) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      
      await axios.delete(`${API_BASE_URL}/manager/appraisals/${appraisalId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      
      setSuccessMessage("Appraisal deleted successfully");
      await fetchAppraisals();
    } catch (err) {
      console.error("Error deleting appraisal:", err);
      setError(err.response?.data?.message || "Failed to delete appraisal");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
    setError("");
    setSuccessMessage("");
  };

  const handleEmployeeChange = (e) => {
    setSelectedEmployee(e.target.value);
  };

  const handleSalaryInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith("allowances.")) {
      const field = name.split(".")[1];
      setSalaryFormData((prev) => ({
        ...prev,
        allowances: {
          ...prev.allowances,
          [field]: parseFloat(value) || 0,
        },
      }));
    } else if (name.startsWith("bank_details.")) {
      const field = name.split(".")[1];
      setSalaryFormData((prev) => ({
        ...prev,
        bank_details: {
          ...prev.bank_details,
          [field]: value,
        },
      }));
    } else {
      setSalaryFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const resetSalaryForm = () => {
    setSalaryFormData({
      initial_salary: "",
      joining_date: "",
      new_salary: "",
      effective_date: "",
      reason: "",
      salary_frequency: "Monthly",
      payment_method: "Bank Transfer",
      allowances: {
        hra: 0,
        da: 0,
        transport: 0,
        medical: 0,
        other: 0,
      },
      tax_deduction: 0,
      other_deductions: 0,
      bank_details: {
        account_number: "",
        ifsc_code: "",
        bank_name: "",
        account_holder_name: "",
      },
      notes: "",
    });
    setEditingSalary(null);
  };

  const handleCreateNewSalary = () => {
    if (!selectedEmployee) {
      setError("Please select a staff member first");
      return;
    }
    resetSalaryForm();
    setShowSalaryForm(true);
    setError("");
    setSuccessMessage("");
  };

  const handleEditSalary = (salary) => {
    setEditingSalary(salary);
    setSelectedEmployee(salary.employee_id?._id || salary.employee_id);
    setSalaryFormData({
      initial_salary: salary.initial_salary,
      joining_date: salary.joining_date ? new Date(salary.joining_date).toISOString().split('T')[0] : "",
      new_salary: "",
      effective_date: "",
      reason: "",
      salary_frequency: salary.salary_frequency,
      payment_method: salary.payment_method,
      allowances: salary.allowances || {
        hra: 0,
        da: 0,
        transport: 0,
        medical: 0,
        other: 0,
      },
      tax_deduction: salary.tax_deduction || 0,
      other_deductions: salary.other_deductions || 0,
      bank_details: salary.bank_details || {
        account_number: "",
        ifsc_code: "",
        bank_name: "",
        account_holder_name: "",
      },
      notes: salary.notes || "",
    });
    setShowSalaryForm(true);
    setError("");
    setSuccessMessage("");
  };

  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      if (editingSalary) {
        const payload = {
          new_salary: parseFloat(salaryFormData.new_salary) || undefined,
          effective_date: salaryFormData.effective_date || undefined,
          reason: salaryFormData.reason,
          allowances: salaryFormData.allowances,
          tax_deduction: parseFloat(salaryFormData.tax_deduction) || 0,
          other_deductions: parseFloat(salaryFormData.other_deductions) || 0,
          bank_details: salaryFormData.bank_details,
          payment_method: salaryFormData.payment_method,
          notes: salaryFormData.notes,
        };

        const response = await axios.put(
          `${API_BASE_URL}/manager/salaries/${editingSalary._id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
          }
        );

        setSuccessMessage(response.data.message || "Salary updated successfully");
      } else {
        if (!selectedEmployee) {
          setError("Please select a staff member");
          return;
        }

        const payload = {
          employee_id: selectedEmployee,
          initial_salary: parseFloat(salaryFormData.initial_salary),
          joining_date: salaryFormData.joining_date,
          salary_frequency: salaryFormData.salary_frequency,
          payment_method: salaryFormData.payment_method,
          allowances: salaryFormData.allowances,
          tax_deduction: parseFloat(salaryFormData.tax_deduction) || 0,
          other_deductions: parseFloat(salaryFormData.other_deductions) || 0,
          bank_details: salaryFormData.bank_details,
          notes: salaryFormData.notes,
        };

        const response = await axios.post(`${API_BASE_URL}/manager/salaries`, payload, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });

        setSuccessMessage(response.data.message || "Salary created successfully");
      }

      setShowSalaryForm(false);
      resetSalaryForm();
      setSelectedEmployee("");
      await fetchSalaries();
      await fetchStaffWithoutSalary();
      await fetchSalaryStats();
    } catch (err) {
      console.error("Error saving salary:", err);
      setError(err.response?.data?.message || "Failed to save salary");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSalary = async (salaryId) => {
    if (!window.confirm("Are you sure you want to delete this salary record?")) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      
      await axios.delete(`${API_BASE_URL}/manager/salaries/${salaryId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      
      setSuccessMessage("Salary record deleted successfully");
      await fetchSalaries();
      await fetchStaffWithoutSalary();
      await fetchSalaryStats();
    } catch (err) {
      console.error("Error deleting salary:", err);
      setError(err.response?.data?.message || "Failed to delete salary");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSalary = () => {
    setShowSalaryForm(false);
    resetSalaryForm();
    setError("");
    setSuccessMessage("");
  };

  const getSelectedStaffName = () => {
    const staffMember = staff.find((s) => s._id === selectedStaff);
    return staffMember ? staffMember.name : "";
  };

  const getSelectedEmployeeName = () => {
    const employee = staffWithoutSalary.find((e) => e._id === selectedEmployee);
    return employee ? employee.name : "";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  if (!managerInfo) {
    return (
      <div className="loading-container-mngapr">
        <div className="loading-content-mngapr">
          <p>Loading manager information...</p>
          {error && <p className="error-text-mngapr">{error}</p>}
        </div>
      </div>
    );
  }

  if (!managerInfo.branch_id) {
    return (
      <div className="error-container-mngapr">
        <div className="error-content-mngapr">
          <p className="error-message-mngapr">Error: No branch assigned to this manager account.</p>
          <p className="debug-info-mngapr">Manager Info: {JSON.stringify(managerInfo)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-mngapr">
      <h1 className="title-mngapr"> Appraisal & Salary </h1>
      <p className="subtitle-mngapr">Manage performance reviews and salary records for your branch staff</p>

      <div className="manager-info-mngapr">
        <div className="manager-details-mngapr">
          <div className="manager-detail-item-mngapr">
            <strong className="detail-label-mngapr">Manager:</strong> {managerInfo.name}
          </div>
          <div className="manager-detail-item-mngapr">
            <strong className="detail-label-mngapr">Employee ID:</strong> {managerInfo.employee_id}
          </div>
          <div className="manager-detail-item-mngapr">
            <strong className="detail-label-mngapr">Branch ID:</strong> {managerInfo.branch_id}
          </div>
        </div>
      </div>

      <div className="tab-navigation-mngapr">
        <button
          onClick={() => handleTabChange("appraisal")}
          className={`tab-button-mngapr ${activeTab === "appraisal" ? "tab-button-active-mngapr" : ""}`}
        >
          Staff Appraisals
        </button>
        <button
          onClick={() => handleTabChange("salary")}
          className={`tab-button-mngapr ${activeTab === "salary" ? "tab-button-active-mngapr" : ""}`}
        >
          Staff Salaries
        </button>
      </div>

      {error && (
        <div className="error-banner-mngapr">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="success-banner-mngapr">
          {successMessage}
        </div>
      )}

      {activeTab === "appraisal" && (
        <>
          <div className="section-mngapr">
            <h2 className="section-title-mngapr">Select Staff Member</h2>
            
            <div className="form-group-mngapr">
              <label className="form-label-mngapr">Staff Member:</label>
              <select 
                value={selectedStaff} 
                onChange={handleStaffChange} 
                disabled={loading || staff.length === 0}
                className="form-select-mngapr"
              >
                <option value="">-- Select Staff Member --</option>
                {staff.map((staffMember) => (
                  <option key={staffMember._id} value={staffMember._id}>
                    {staffMember.name} (ID: {staffMember.employee_id})
                  </option>
                ))}
              </select>
              {staff.length === 0 && !loading && (
                <p className="no-data-message-mngapr">No staff members found in your branch</p>
              )}
            </div>

            {selectedStaff && !showForm && (
              <button onClick={handleCreateNew} className="btn-primary-mngapr">
                Create New Appraisal
              </button>
            )}
          </div>

          {showForm && (
            <div className="form-container-mngapr">
              <h2 className="section-title-mngapr">
                {editingAppraisal ? "Edit Appraisal" : "Create New Appraisal"}
              </h2>
              <p className="form-context-mngapr">
                <strong>Staff Member:</strong> {getSelectedStaffName()}
              </p>

              <form onSubmit={handleSubmit} className="appraisal-form-mngapr">
                <div className="form-row-mngapr">
                  <div className="form-group-mngapr">
                    <label className="form-label-mngapr">Review Period: *</label>
                    <select
                      name="review_period"
                      value={formData.review_period}
                      onChange={handleInputChange}
                      required
                      className="form-select-mngapr"
                    >
                      <option value="H1">H1 (Jan - Jun)</option>
                      <option value="H2">H2 (Jul - Dec)</option>
                    </select>
                  </div>

                  <div className="form-group-mngapr">
                    <label className="form-label-mngapr">Review Year: *</label>
                    <input
                      type="number"
                      name="review_year"
                      value={formData.review_year}
                      onChange={handleInputChange}
                      required
                      min="2020"
                      max="2100"
                      className="form-input-mngapr"
                    />
                  </div>
                </div>

                <div className="form-group-mngapr">
                  <label className="form-label-mngapr">Strengths: *</label>
                  <textarea
                    name="strengths"
                    value={formData.strengths}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    placeholder="Describe the staff member's key strengths..."
                    className="form-textarea-mngapr"
                  />
                </div>

                <div className="form-group-mngapr">
                  <label className="form-label-mngapr">Areas of Improvement: *</label>
                  <textarea
                    name="areas_of_improvement"
                    value={formData.areas_of_improvement}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    placeholder="Describe areas where improvement is needed..."
                    className="form-textarea-mngapr"
                  />
                </div>

                <div className="form-group-mngapr">
                  <label className="form-label-mngapr">Key Achievements:</label>
                  <textarea
                    name="achievements"
                    value={formData.achievements}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Notable achievements during this period..."
                    className="form-textarea-mngapr"
                  />
                </div>

                <div className="form-group-mngapr">
                  <label className="form-label-mngapr">Goals for Next Period:</label>
                  <textarea
                    name="goals_for_next_period"
                    value={formData.goals_for_next_period}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Goals and objectives for the next review period..."
                    className="form-textarea-mngapr"
                  />
                </div>

                <div className="form-group-mngapr">
                  <label className="form-label-mngapr">Overall Rating:</label>
                  <select
                    name="overall_rating"
                    value={formData.overall_rating}
                    onChange={handleInputChange}
                    className="form-select-mngapr"
                  >
                    <option value="">-- Select Rating --</option>
                    <option value="Outstanding">Outstanding</option>
                    <option value="Exceeds Expectations">Exceeds Expectations</option>
                    <option value="Meets Expectations">Meets Expectations</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                    <option value="Unsatisfactory">Unsatisfactory</option>
                  </select>
                </div>

                <div className="form-group-mngapr">
                  <label className="form-label-mngapr">Additional Comments:</label>
                  <textarea
                    name="additional_comments"
                    value={formData.additional_comments}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Any additional notes or comments..."
                    className="form-textarea-mngapr"
                  />
                </div>

                <div className="form-actions-mngapr">
                  <button type="submit" disabled={loading} className="btn-submit-mngapr">
                    {loading ? "Saving..." : editingAppraisal ? "Update Appraisal" : "Create Appraisal"}
                  </button>
                  <button type="button" onClick={handleCancel} className="btn-cancel-mngapr">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {appraisals.length > 0 && (
            <div className="section-mngapr">
              <h2 className="section-title-mngapr">Staff Appraisals</h2>
              <div className="appraisals-grid-mngapr">
                {appraisals.map((appraisal) => (
                  <div key={appraisal._id} className="appraisal-card-mngapr">
                    <div className="appraisal-header-mngapr">
                      <div className="appraisal-info-mngapr">
                        <h3 className="appraisal-title-mngapr">
                          {appraisal.staff_name} - {appraisal.review_period} {appraisal.review_year}
                        </h3>
                        <p className="appraisal-meta-mngapr">
                          Employee ID: {appraisal.staff_employee_id} | Created: {formatDate(appraisal.createdAt)}
                        </p>
                      </div>
                      <div className="appraisal-actions-mngapr">
                        <button onClick={() => handleEdit(appraisal)} className="btn-edit-mngapr">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(appraisal._id)} className="btn-delete-mngapr">
                          Delete
                        </button>
                      </div>
                    </div>

                    {appraisal.overall_rating && (
                      <div className="rating-section-mngapr">
                        <strong>Overall Rating:</strong> {appraisal.overall_rating}
                      </div>
                    )}

                    <div className="appraisal-field-mngapr">
                      <strong>Strengths:</strong>
                      <p className="appraisal-content-mngapr">{appraisal.strengths}</p>
                    </div>

                    <div className="appraisal-field-mngapr">
                      <strong>Areas of Improvement:</strong>
                      <p className="appraisal-content-mngapr">{appraisal.areas_of_improvement}</p>
                    </div>

                    {appraisal.achievements && (
                      <div className="appraisal-field-mngapr">
                        <strong>Achievements:</strong>
                        <p className="appraisal-content-mngapr">{appraisal.achievements}</p>
                      </div>
                    )}

                    {appraisal.goals_for_next_period && (
                      <div className="appraisal-field-mngapr">
                        <strong>Goals for Next Period:</strong>
                        <p className="appraisal-content-mngapr">{appraisal.goals_for_next_period}</p>
                      </div>
                    )}

                    {appraisal.additional_comments && (
                      <div className="appraisal-field-mngapr">
                        <strong>Additional Comments:</strong>
                        <p className="appraisal-content-mngapr">{appraisal.additional_comments}</p>
                      </div>
                    )}

                    <div className="appraisal-footer-mngapr">
                      Last modified: {new Date(appraisal.updatedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {appraisals.length === 0 && !showForm && !loading && (
            <div className="empty-state-mngapr">
              <p>No appraisals found. Select a staff member and create the first appraisal.</p>
            </div>
          )}
        </>
      )}

      {activeTab === "salary" && (
        <>
          {salaryStats && (
            <div className="stats-container-mngapr">
              <h2 className="section-title-mngapr">Salary Statistics</h2>
              <div className="stats-grid-mngapr">
                <div className="stat-card-mngapr">
                  <div className="stat-label-mngapr">Total Staff</div>
                  <div className="stat-value-mngapr stat-value-primary-mngapr">{salaryStats.total_employees}</div>
                </div>
                <div className="stat-card-mngapr">
                  <div className="stat-label-mngapr">Total Gross Salary</div>
                  <div className="stat-value-mngapr stat-value-success-mngapr">{formatCurrency(salaryStats.total_gross_salary)}</div>
                </div>
                <div className="stat-card-mngapr">
                  <div className="stat-label-mngapr">Average Salary</div>
                  <div className="stat-value-mngapr stat-value-warning-mngapr">{formatCurrency(salaryStats.average_salary)}</div>
                </div>
                <div className="stat-card-mngapr">
                  <div className="stat-label-mngapr">Staff Count</div>
                  <div className="stat-value-mngapr stat-value-secondary-mngapr">{salaryStats.staff_count}</div>
                </div>
              </div>
            </div>
          )}

          {staffWithoutSalary.length > 0 && (
            <div className="section-mngapr">
              <h2 className="section-title-mngapr">Add Salary for Staff Member</h2>
              
              <div className="form-group-mngapr">
                <label className="form-label-mngapr">Select Staff Member:</label>
                <select 
                  value={selectedEmployee} 
                  onChange={handleEmployeeChange} 
                  disabled={loading}
                  className="form-select-mngapr"
                >
                  <option value="">-- Select Staff Member --</option>
                  {staffWithoutSalary.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} (ID: {emp.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              {selectedEmployee && !showSalaryForm && (
                <button onClick={handleCreateNewSalary} className="btn-primary-mngapr">
                  Add Salary Record
                </button>
              )}
            </div>
          )}

          {showSalaryForm && (
            <div className="form-container-mngapr">
              <h2 className="section-title-mngapr">
                {editingSalary ? "Update Salary Record" : "Create Salary Record"}
              </h2>
              <p className="form-context-mngapr">
                <strong>Staff Member:</strong> {editingSalary ? editingSalary.employee_name : getSelectedEmployeeName()}
              </p>

              <form onSubmit={handleSalarySubmit} className="salary-form-mngapr">
                {!editingSalary && (
                  <>
                    <div className="form-row-mngapr">
                      <div className="form-group-mngapr">
                        <label className="form-label-mngapr">Initial Salary: *</label>
                        <input
                          type="number"
                          name="initial_salary"
                          value={salaryFormData.initial_salary}
                          onChange={handleSalaryInputChange}
                          required
                          min="0"
                          step="0.01"
                          className="form-input-mngapr"
                          placeholder="Enter initial salary"
                        />
                      </div>

                      <div className="form-group-mngapr">
                        <label className="form-label-mngapr">Joining Date: *</label>
                        <input
                          type="date"
                          name="joining_date"
                          value={salaryFormData.joining_date}
                          onChange={handleSalaryInputChange}
                          required
                          className="form-input-mngapr"
                        />
                      </div>
                    </div>
                  </>
                )}

                {editingSalary && (
                  <>
                    <div className="current-salary-info-mngapr">
                      <h3 className="info-title-mngapr">Current Salary Information</h3>
                      <p className="info-item-mngapr"><strong>Current Salary:</strong> {formatCurrency(editingSalary.current_salary)}</p>
                      <p className="info-item-mngapr"><strong>Last Increment:</strong> {editingSalary.last_increment_percentage}% on {formatDate(editingSalary.last_increment_date)}</p>
                    </div>

                    <div className="form-row-mngapr">
                      <div className="form-group-mngapr">
                        <label className="form-label-mngapr">New Salary (for increment):</label>
                        <input
                          type="number"
                          name="new_salary"
                          value={salaryFormData.new_salary}
                          onChange={handleSalaryInputChange}
                          min="0"
                          step="0.01"
                          className="form-input-mngapr"
                          placeholder="Leave empty if no increment"
                        />
                      </div>

                      <div className="form-group-mngapr">
                        <label className="form-label-mngapr">Effective Date:</label>
                        <input
                          type="date"
                          name="effective_date"
                          value={salaryFormData.effective_date}
                          onChange={handleSalaryInputChange}
                          className="form-input-mngapr"
                        />
                      </div>
                    </div>

                    <div className="form-group-mngapr">
                      <label className="form-label-mngapr">Reason for Increment:</label>
                      <input
                        type="text"
                        name="reason"
                        value={salaryFormData.reason}
                        onChange={handleSalaryInputChange}
                        className="form-input-mngapr"
                        placeholder="e.g., Annual increment, Performance bonus"
                      />
                    </div>
                  </>
                )}

                <h3 className="subsection-title-mngapr">Allowances</h3>
                <div className="form-row-mngapr">
                  <div className="form-group-mngapr">
                    <label className="form-label-mngapr">HRA:</label>
                    <input
                      type="number"
                      name="allowances.hra"
                      value={salaryFormData.allowances.hra}
                      onChange={handleSalaryInputChange}
                      min="0"
                      step="0.01"
                      className="form-input-mngapr"
                    />
                  </div>

                  <div className="form-group-mngapr">
                    <label className="form-label-mngapr">DA:</label>
                    <input
                      type="number"
                      name="allowances.da"
                      value={salaryFormData.allowances.da}
                      onChange={handleSalaryInputChange}
                      min="0"
                      step="0.01"
                      className="form-input-mngapr"
                    />
                  </div>
                </div>

                <div className="form-row-mngapr">
                  <div className="form-group-mngapr">
                    <label className="form-label-mngapr">Transport:</label>
                    <input
                      type="number"
                      name="allowances.transport"
                      value={salaryFormData.allowances.transport}
                      onChange={handleSalaryInputChange}
                      min="0"
                      step="0.01"
                      className="form-input-mngapr"
                    />
                  </div>

                  <div className="form-group-mngapr">
                    <label className="form-label-mngapr">Medical:</label>
                    <input
                      type="number"
                      name="allowances.medical"
                      value={salaryFormData.allowances.medical}
                      onChange={handleSalaryInputChange}
                      min="0"
                      step="0.01"
                      className="form-input-mngapr"
                    />
                  </div>
                </div>

                <div className="form-group-mngapr">
                  <label className="form-label-mngapr">Other Allowances:</label>
                  <input
                    type="number"
                    name="allowances.other"
                    value={salaryFormData.allowances.other}
                    onChange={handleSalaryInputChange}
                    min="0"
                    step="0.01"
                    className="form-input-mngapr"
                  />
                </div>

                <h3 className="subsection-title-mngapr">Deductions</h3>
                <div className="form-row-mngapr">
                  <div className="form-group-mngapr">
                    <label className="form-label-mngapr">Tax Deduction:</label>
                    <input
                      type="number"
                      name="tax_deduction"
                      value={salaryFormData.tax_deduction}
                      onChange={handleSalaryInputChange}
                      min="0"
                      step="0.01"
                      className="form-input-mngapr"
                    />
                  </div>

                  <div className="form-group-mngapr">
                    <label className="form-label-mngapr">Other Deductions:</label>
                    <input
                      type="number"
                      name="other_deductions"
                      value={salaryFormData.other_deductions}
                      onChange={handleSalaryInputChange}
                      min="0"
                      step="0.01"
                      className="form-input-mngapr"
                    />
                  </div>
                </div>

                <h3 className="subsection-title-mngapr">Payment Details</h3>
                <div className="form-row-mngapr">
                  <div className="form-group-mngapr">
                    <label className="form-label-mngapr">Salary Frequency:</label>
                    <select
                      name="salary_frequency"
                      value={salaryFormData.salary_frequency}
                      onChange={handleSalaryInputChange}
                      className="form-select-mngapr"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Bi-Weekly">Bi-Weekly</option>
                      <option value="Weekly">Weekly</option>
                    </select>
                  </div>

                  <div className="form-group-mngapr">
                    <label className="form-label-mngapr">Payment Method:</label>
                    <select
                      name="payment_method"
                      value={salaryFormData.payment_method}
                      onChange={handleSalaryInputChange}
                      className="form-select-mngapr"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <h3 className="subsection-title-mngapr">Bank Details</h3>
                <div className="form-row-mngapr">
                  <div className="form-group-mngapr">
                    <label className="form-label-mngapr">Account Number:</label>
                    <input
                      type="text"
                      name="bank_details.account_number"
                      value={salaryFormData.bank_details.account_number}
                      onChange={handleSalaryInputChange}
                      className="form-input-mngapr"
                    />
                  </div>

                  <div className="form-group-mngapr">
                    <label className="form-label-mngapr">IFSC Code:</label>
                    <input
                      type="text"
                      name="bank_details.ifsc_code"
                      value={salaryFormData.bank_details.ifsc_code}
                      onChange={handleSalaryInputChange}
                      className="form-input-mngapr"
                    />
                  </div>
                </div>

                <div className="form-row-mngapr">
                  <div className="form-group-mngapr">
                    <label className="form-label-mngapr">Bank Name:</label>
                    <input
                      type="text"
                      name="bank_details.bank_name"
                      value={salaryFormData.bank_details.bank_name}
                      onChange={handleSalaryInputChange}
                      className="form-input-mngapr"
                    />
                  </div>

                  <div className="form-group-mngapr">
                    <label className="form-label-mngapr">Account Holder Name:</label>
                    <input
                      type="text"
                      name="bank_details.account_holder_name"
                      value={salaryFormData.bank_details.account_holder_name}
                      onChange={handleSalaryInputChange}
                      className="form-input-mngapr"
                    />
                  </div>
                </div>

                <div className="form-group-mngapr">
                  <label className="form-label-mngapr">Notes:</label>
                  <textarea
                    name="notes"
                    value={salaryFormData.notes}
                    onChange={handleSalaryInputChange}
                    rows="3"
                    placeholder="Any additional notes..."
                    className="form-textarea-mngapr"
                  />
                </div>

                <div className="form-actions-mngapr">
                  <button type="submit" disabled={loading} className="btn-submit-mngapr">
                    {loading ? "Saving..." : editingSalary ? "Update Salary" : "Create Salary Record"}
                  </button>
                  <button type="button" onClick={handleCancelSalary} className="btn-cancel-mngapr">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {salaries.length > 0 && (
            <div className="section-mngapr">
              <h2 className="section-title-mngapr">Staff Salary Records</h2>
              <div className="salaries-grid-mngapr">
                {salaries.map((salary) => (
                  <div key={salary._id} className="salary-card-mngapr">
                    <div className="salary-header-mngapr">
                      <div className="salary-info-mngapr">
                        <h3 className="salary-title-mngapr">
                          {salary.employee_name}
                        </h3>
                        <p className="salary-meta-mngapr">
                          Employee ID: {salary.employee_staff_id} | Joined: {formatDate(salary.joining_date)}
                        </p>
                      </div>
                      <div className="salary-actions-mngapr">
                        <button onClick={() => handleEditSalary(salary)} className="btn-edit-mngapr">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteSalary(salary._id)} className="btn-delete-mngapr">
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="salary-summary-mngapr">
                      <div className="salary-summary-grid-mngapr">
                        <div className="salary-summary-item-mngapr">
                          <strong>Current Salary:</strong> {formatCurrency(salary.current_salary)}
                        </div>
                        <div className="salary-summary-item-mngapr">
                          <strong>Gross Salary:</strong> {formatCurrency(salary.gross_salary)}
                        </div>
                        <div className="salary-summary-item-mngapr">
                          <strong>Net Salary:</strong> {formatCurrency(salary.net_salary)}
                        </div>
                        <div className="salary-summary-item-mngapr">
                          <strong>Initial Salary:</strong> {formatCurrency(salary.initial_salary)}
                        </div>
                      </div>
                    </div>

                    {salary.last_increment_date && (
                      <div className="increment-info-mngapr">
                        <strong>Last Increment:</strong> {salary.last_increment_percentage}% 
                        ({formatCurrency(salary.last_increment_amount)}) on {formatDate(salary.last_increment_date)}
                      </div>
                    )}

                    <div className="salary-field-mngapr">
                      <strong>Allowances:</strong>
                      <p className="salary-content-mngapr">
                        HRA: {formatCurrency(salary.allowances?.hra || 0)}, 
                        DA: {formatCurrency(salary.allowances?.da || 0)}, 
                        Transport: {formatCurrency(salary.allowances?.transport || 0)}, 
                        Medical: {formatCurrency(salary.allowances?.medical || 0)}
                      </p>
                    </div>

                    <div className="salary-field-mngapr">
                      <strong>Deductions:</strong>
                      <p className="salary-content-mngapr">
                        Tax: {formatCurrency(salary.tax_deduction || 0)}, 
                        Other: {formatCurrency(salary.other_deductions || 0)}
                      </p>
                    </div>

                    <div className="salary-field-mngapr">
                      <strong>Payment:</strong>
                      <p className="salary-content-mngapr">
                        {salary.salary_frequency} via {salary.payment_method}
                      </p>
                    </div>

                    {salary.salary_history && salary.salary_history.length > 0 && (
                      <div className="salary-field-mngapr">
                        <strong>Salary History ({salary.salary_history.length} increments):</strong>
                        <div className="salary-history-mngapr">
                          {salary.salary_history.map((history, index) => (
                            <div key={index} className="salary-history-item-mngapr">
                              {formatDate(history.effective_date)}: {formatCurrency(history.previous_salary)} → {formatCurrency(history.new_salary)} 
                              ({history.increment_percentage}%) - {history.reason}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {salary.notes && (
                      <div className="salary-field-mngapr">
                        <strong>Notes:</strong>
                        <p className="salary-content-mngapr">{salary.notes}</p>
                      </div>
                    )}

                    <div className="salary-footer-mngapr">
                      Last updated: {new Date(salary.updatedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {salaries.length === 0 && !showSalaryForm && !loading && (
            <div className="empty-state-mngapr">
              <p>No salary records found for your branch staff.</p>
            </div>
          )}
        </>
      )}

      {loading && (
        <div className="loading-container-mngapr">
          <p>Loading...</p>
        </div>
      )}
    </div>
  );
};

export default ManagerAppraisal;