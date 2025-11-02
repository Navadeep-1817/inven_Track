import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./../styles/Appraisal.css";

const Appraisal = () => {
  const [activeTab, setActiveTab] = useState("appraisal");
  
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState("");
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  const [salaries, setSalaries] = useState([]);
  const [employeesWithoutSalary, setEmployeesWithoutSalary] = useState([]);
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

  const fetchManagers = useCallback(async () => {
    if (!selectedBranch) return;
    
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/appraisals/branch/${selectedBranch}/managers`,
        {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        }
      );
      setManagers(response.data.managers || []);
      setError("");
    } catch (err) {
      console.error("Error fetching managers:", err);
      setError(err.response?.data?.message || "Failed to fetch managers");
      setManagers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, API_BASE_URL]);

  const fetchAppraisalsByBranch = useCallback(async () => {
    if (!selectedBranch) return;
    
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/appraisals/branch/${selectedBranch}`,
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
  }, [selectedBranch, API_BASE_URL]);

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/branches`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setBranches(response.data || []);
      setError("");
    } catch (err) {
      console.error("Error fetching branches:", err);
      setError(err.response?.data?.message || "Failed to fetch branches");
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  const fetchSalariesByBranch = useCallback(async () => {
    if (!selectedBranch) return;
    
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/salaries/branch/${selectedBranch}`,
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
  }, [selectedBranch, API_BASE_URL]);

  const fetchEmployeesWithoutSalary = useCallback(async () => {
    if (!selectedBranch) return;
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/salaries/branch/${selectedBranch}/without-salary`,
        {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        }
      );
      setEmployeesWithoutSalary(response.data.employees || []);
    } catch (err) {
      console.error("Error fetching employees without salary:", err);
      setEmployeesWithoutSalary([]);
    }
  }, [selectedBranch, API_BASE_URL]);

  const fetchSalaryStats = useCallback(async () => {
    if (!selectedBranch) return;
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/salaries/branch/${selectedBranch}/stats`,
        {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        }
      );
      setSalaryStats(response.data.stats || null);
    } catch (err) {
      console.error("Error fetching salary stats:", err);
      setSalaryStats(null);
    }
  }, [selectedBranch, API_BASE_URL]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    if (selectedBranch) {
      if (activeTab === "appraisal") {
        fetchManagers();
        fetchAppraisalsByBranch();
      } else if (activeTab === "salary") {
        fetchSalariesByBranch();
        fetchEmployeesWithoutSalary();
        fetchSalaryStats();
      }
    } else {
      setManagers([]);
      setAppraisals([]);
      setSalaries([]);
      setEmployeesWithoutSalary([]);
      setSalaryStats(null);
    }
  }, [selectedBranch, activeTab, fetchManagers, fetchAppraisalsByBranch, fetchSalariesByBranch, fetchEmployeesWithoutSalary, fetchSalaryStats]);

  const handleBranchChange = (e) => {
    setSelectedBranch(e.target.value);
    setSelectedManager("");
    setSelectedEmployee("");
    setShowForm(false);
    setShowSalaryForm(false);
    setEditingAppraisal(null);
    setEditingSalary(null);
    resetForm();
    resetSalaryForm();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError("");
    setSuccessMessage("");
    setShowForm(false);
    setShowSalaryForm(false);
  };

  const handleManagerChange = (e) => {
    setSelectedManager(e.target.value);
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
    if (!selectedManager) {
      setError("Please select a manager first");
      return;
    }
    resetForm();
    setShowForm(true);
    setError("");
    setSuccessMessage("");
  };

  const handleEdit = (appraisal) => {
    setEditingAppraisal(appraisal);
    setSelectedManager(appraisal.manager_id?._id || appraisal.manager_id);
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
    
    if (!selectedBranch || !selectedManager) {
      setError("Please select both branch and manager");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const payload = {
        branch_id: selectedBranch,
        manager_id: selectedManager,
        ...formData,
      };

      let response;
      if (editingAppraisal) {
        response = await axios.put(
          `${API_BASE_URL}/appraisals/${editingAppraisal._id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
          }
        );
      } else {
        response = await axios.post(`${API_BASE_URL}/appraisals`, payload, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
      }

      setSuccessMessage(response.data.message || "Appraisal saved successfully");
      setShowForm(false);
      resetForm();
      await fetchAppraisalsByBranch();
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
      
      await axios.delete(`${API_BASE_URL}/appraisals/${appraisalId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      
      setSuccessMessage("Appraisal deleted successfully");
      await fetchAppraisalsByBranch();
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
      setError("Please select an employee first");
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
          `${API_BASE_URL}/salaries/${editingSalary._id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
          }
        );

        setSuccessMessage(response.data.message || "Salary updated successfully");
      } else {
        if (!selectedEmployee) {
          setError("Please select an employee");
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

        const response = await axios.post(`${API_BASE_URL}/salaries`, payload, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });

        setSuccessMessage(response.data.message || "Salary created successfully");
      }

      setShowSalaryForm(false);
      resetSalaryForm();
      await fetchSalariesByBranch();
      await fetchEmployeesWithoutSalary();
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
      
      await axios.delete(`${API_BASE_URL}/salaries/${salaryId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      
      setSuccessMessage("Salary record deleted successfully");
      await fetchSalariesByBranch();
      await fetchEmployeesWithoutSalary();
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

  const getSelectedBranchName = () => {
    const branch = branches.find((b) => b.branch_id === selectedBranch);
    return branch ? branch.branch_name : "";
  };

  const getSelectedManagerName = () => {
    const manager = managers.find((m) => m._id === selectedManager);
    return manager ? manager.name : "";
  };

  const getSelectedEmployeeName = () => {
    const employee = employeesWithoutSalary.find((e) => e._id === selectedEmployee);
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

  return (
    <div className="appraisal-container-appr">
      <h1 className="appraisal-title-appr">Appraisal & Salary</h1>
      <div className="tab-navigation-appr" style={{ marginBottom: "20px", borderBottom: "2px solid #ddd" }}>
        <button
          onClick={() => handleTabChange("appraisal")}
          style={{
            padding: "10px 30px",
            backgroundColor: activeTab === "appraisal" ? "#1976d2" : "transparent",
            color: activeTab === "appraisal" ? "white" : "#333",
            border: "none",
            borderBottom: activeTab === "appraisal" ? "3px solid #1976d2" : "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Appraisals
        </button>
        <button
          onClick={() => handleTabChange("salary")}
          style={{
            padding: "10px 30px",
            backgroundColor: activeTab === "salary" ? "#2e7d32" : "transparent",
            color: activeTab === "salary" ? "white" : "#333",
            border: "none",
            borderBottom: activeTab === "salary" ? "3px solid #2e7d32" : "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Salaries
        </button>
      </div>

      {error && (
        <div className="error-message-appr" style={{ 
          padding: "15px", 
          backgroundColor: "#f44336", 
          color: "white", 
          borderRadius: "5px", 
          marginBottom: "20px" 
        }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="success-message-appr" style={{ 
          padding: "15px", 
          backgroundColor: "#4caf50", 
          color: "white", 
          borderRadius: "5px", 
          marginBottom: "20px" 
        }}>
          {successMessage}
        </div>
      )}

      <div className="selection-section-appr">
        <h2 className="section-title-appr">Select Branch</h2>
        
        <div className="form-group-appr">
          <label className="form-label-appr">Branch:</label>
          <select
            value={selectedBranch}
            onChange={handleBranchChange}
            className="form-select-appr"
            disabled={loading}
          >
            <option value="">-- Select Branch --</option>
            {branches.map((branch) => (
              <option key={branch.branch_id} value={branch.branch_id}>
                {branch.branch_name} ({branch.branch_location})
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeTab === "appraisal" && selectedBranch && (
        <>
          <div className="selection-section-appr">
            <h2 className="section-title-appr">Select Manager</h2>
            
            <div className="form-group-appr">
              <label className="form-label-appr">Manager:</label>
              <select
                value={selectedManager}
                onChange={handleManagerChange}
                className="form-select-appr"
                disabled={loading || managers.length === 0}
              >
                <option value="">-- Select Manager --</option>
                {managers.map((manager) => (
                  <option key={manager._id} value={manager._id}>
                    {manager.name} (ID: {manager.employee_id})
                  </option>
                ))}
              </select>
              {managers.length === 0 && !loading && (
                <p className="no-data-message-appr">No managers found for this branch</p>
              )}
            </div>

            {selectedManager && !showForm && (
              <button onClick={handleCreateNew} className="btn-primary-appr">
                Create New Appraisal
              </button>
            )}
          </div>

          {showForm && (
            <div className="appraisal-form-container-appr">
              <h2 className="section-title-appr">
                {editingAppraisal ? "Edit Appraisal" : "Create New Appraisal"}
              </h2>
              <p className="form-context-appr">
                <strong>Branch:</strong> {getSelectedBranchName()} | <strong>Manager:</strong> {getSelectedManagerName()}
              </p>

              <form onSubmit={handleSubmit} className="appraisal-form-appr">
                <div className="form-row-appr">
                  <div className="form-group-appr">
                    <label className="form-label-appr">Review Period: *</label>
                    <select
                      name="review_period"
                      value={formData.review_period}
                      onChange={handleInputChange}
                      required
                      className="form-select-appr"
                    >
                      <option value="H1">H1 (Jan - Jun)</option>
                      <option value="H2">H2 (Jul - Dec)</option>
                    </select>
                  </div>

                  <div className="form-group-appr">
                    <label className="form-label-appr">Review Year: *</label>
                    <input
                      type="number"
                      name="review_year"
                      value={formData.review_year}
                      onChange={handleInputChange}
                      required
                      min="2020"
                      max="2100"
                      className="form-input-appr"
                    />
                  </div>
                </div>

                <div className="form-group-appr">
                  <label className="form-label-appr">Strengths: *</label>
                  <textarea
                    name="strengths"
                    value={formData.strengths}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    placeholder="Describe the manager's key strengths..."
                    className="form-textarea-appr"
                  />
                </div>

                <div className="form-group-appr">
                  <label className="form-label-appr">Areas of Improvement: *</label>
                  <textarea
                    name="areas_of_improvement"
                    value={formData.areas_of_improvement}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    placeholder="Describe areas where the manager can improve..."
                    className="form-textarea-appr"
                  />
                </div>

                <div className="form-group-appr">
                  <label className="form-label-appr">Key Achievements:</label>
                  <textarea
                    name="achievements"
                    value={formData.achievements}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Notable achievements during this period..."
                    className="form-textarea-appr"
                  />
                </div>

                <div className="form-group-appr">
                  <label className="form-label-appr">Goals for Next Period:</label>
                  <textarea
                    name="goals_for_next_period"
                    value={formData.goals_for_next_period}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Goals and objectives for the next review period..."
                    className="form-textarea-appr"
                  />
                </div>

                <div className="form-group-appr">
                  <label className="form-label-appr">Overall Rating:</label>
                  <select
                    name="overall_rating"
                    value={formData.overall_rating}
                    onChange={handleInputChange}
                    className="form-select-appr"
                  >
                    <option value="">-- Select Rating --</option>
                    <option value="Outstanding">Outstanding</option>
                    <option value="Exceeds Expectations">Exceeds Expectations</option>
                    <option value="Meets Expectations">Meets Expectations</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                    <option value="Unsatisfactory">Unsatisfactory</option>
                  </select>
                </div>

                <div className="form-group-appr">
                  <label className="form-label-appr">Additional Comments:</label>
                  <textarea
                    name="additional_comments"
                    value={formData.additional_comments}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Any additional notes or comments..."
                    className="form-textarea-appr"
                  />
                </div>

                <div className="form-actions-appr">
                  <button type="submit" disabled={loading} className="btn-submit-appr">
                    {loading ? "Saving..." : editingAppraisal ? "Update Appraisal" : "Create Appraisal"}
                  </button>
                  <button type="button" onClick={handleCancel} className="btn-cancel-appr">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {appraisals.length > 0 && (
            <div className="appraisals-list-container-appr">
              <h2 className="section-title-appr">Existing Appraisals for {getSelectedBranchName()}</h2>
              <div className="appraisals-grid-appr">
                {appraisals.map((appraisal) => (
                  <div key={appraisal._id} className="appraisal-card-appr">
                    <div className="appraisal-header-appr">
                      <div className="appraisal-info-appr">
                        <h3 className="appraisal-title-card-appr">
                          {appraisal.manager_name} - {appraisal.review_period} {appraisal.review_year}
                        </h3>
                        <p className="appraisal-meta-appr">
                          Employee ID: {appraisal.manager_employee_id} | Created: {formatDate(appraisal.createdAt)}
                        </p>
                      </div>
                      <div className="appraisal-actions-appr">
                        <button onClick={() => handleEdit(appraisal)} className="btn-edit-appr">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(appraisal._id)} className="btn-delete-appr">
                          Delete
                        </button>
                      </div>
                    </div>

                    {appraisal.overall_rating && (
                      <div className="rating-section-appr">
                        <strong>Overall Rating:</strong> {appraisal.overall_rating}
                      </div>
                    )}

                    <div className="appraisal-field-appr">
                      <strong>Strengths:</strong>
                      <p className="appraisal-content-appr">{appraisal.strengths}</p>
                    </div>

                    <div className="appraisal-field-appr">
                      <strong>Areas of Improvement:</strong>
                      <p className="appraisal-content-appr">{appraisal.areas_of_improvement}</p>
                    </div>

                    {appraisal.achievements && (
                      <div className="appraisal-field-appr">
                        <strong>Achievements:</strong>
                        <p className="appraisal-content-appr">{appraisal.achievements}</p>
                      </div>
                    )}

                    {appraisal.goals_for_next_period && (
                      <div className="appraisal-field-appr">
                        <strong>Goals for Next Period:</strong>
                        <p className="appraisal-content-appr">{appraisal.goals_for_next_period}</p>
                      </div>
                    )}

                    {appraisal.additional_comments && (
                      <div className="appraisal-field-appr">
                        <strong>Additional Comments:</strong>
                        <p className="appraisal-content-appr">{appraisal.additional_comments}</p>
                      </div>
                    )}

                    <div className="appraisal-footer-appr">
                      Last modified: {new Date(appraisal.updatedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {appraisals.length === 0 && !showForm && !loading && (
            <div className="empty-state-appr">
              <p>No appraisals found for this branch. Select a manager and create the first appraisal.</p>
            </div>
          )}
        </>
      )}

      {activeTab === "salary" && selectedBranch && (
        <>
          {salaryStats && (
            <div className="salary-stats-container-appr" style={{ marginBottom: "30px", padding: "20px", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
              <h2 className="section-title-appr">Salary Statistics</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
                <div style={{ padding: "15px", backgroundColor: "white", borderRadius: "5px", border: "1px solid #ddd" }}>
                  <div style={{ fontSize: "12px", color: "#666" }}>Total Employees</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1976d2" }}>{salaryStats.total_employees}</div>
                </div>
                <div style={{ padding: "15px", backgroundColor: "white", borderRadius: "5px", border: "1px solid #ddd" }}>
                  <div style={{ fontSize: "12px", color: "#666" }}>Total Gross Salary</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2e7d32" }}>{formatCurrency(salaryStats.total_gross_salary)}</div>
                </div>
                <div style={{ padding: "15px", backgroundColor: "white", borderRadius: "5px", border: "1px solid #ddd" }}>
                  <div style={{ fontSize: "12px", color: "#666" }}>Average Salary</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f57c00" }}>{formatCurrency(salaryStats.average_salary)}</div>
                </div>
                <div style={{ padding: "15px", backgroundColor: "white", borderRadius: "5px", border: "1px solid #ddd" }}>
                  <div style={{ fontSize: "12px", color: "#666" }}>Managers / Staff</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#7b1fa2" }}>{salaryStats.managers_count} / {salaryStats.staff_count}</div>
                </div>
              </div>
            </div>
          )}

          {employeesWithoutSalary.length > 0 && (
            <div className="selection-section-appr">
              <h2 className="section-title-appr">Add Salary for Employee</h2>
              
              <div className="form-group-appr">
                <label className="form-label-appr">Select Employee:</label>
                <select
                  value={selectedEmployee}
                  onChange={handleEmployeeChange}
                  className="form-select-appr"
                  disabled={loading}
                >
                  <option value="">-- Select Employee --</option>
                  {employeesWithoutSalary.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} (ID: {emp.employee_id}) - {emp.role}
                    </option>
                  ))}
                </select>
              </div>

              {selectedEmployee && !showSalaryForm && (
                <button onClick={handleCreateNewSalary} className="btn-primary-appr">
                  Add Salary Record
                </button>
              )}
            </div>
          )}

          {showSalaryForm && (
            <div className="appraisal-form-container-appr">
              <h2 className="section-title-appr">
                {editingSalary ? "Update Salary Record" : "Create Salary Record"}
              </h2>
              <p className="form-context-appr">
                <strong>Branch:</strong> {getSelectedBranchName()} | 
                <strong> Employee:</strong> {editingSalary ? editingSalary.employee_name : getSelectedEmployeeName()}
              </p>

              <form onSubmit={handleSalarySubmit} className="appraisal-form-appr">
                {!editingSalary && (
                  <>
                    <div className="form-row-appr">
                      <div className="form-group-appr">
                        <label className="form-label-appr">Initial Salary: *</label>
                        <input
                          type="number"
                          name="initial_salary"
                          value={salaryFormData.initial_salary}
                          onChange={handleSalaryInputChange}
                          required
                          min="0"
                          step="0.01"
                          className="form-input-appr"
                          placeholder="Enter initial salary"
                        />
                      </div>

                      <div className="form-group-appr">
                        <label className="form-label-appr">Joining Date: *</label>
                        <input
                          type="date"
                          name="joining_date"
                          value={salaryFormData.joining_date}
                          onChange={handleSalaryInputChange}
                          required
                          className="form-input-appr"
                        />
                      </div>
                    </div>
                  </>
                )}

                {editingSalary && (
                  <>
                    <div style={{ padding: "15px", backgroundColor: "#e3f2fd", borderRadius: "5px", marginBottom: "15px" }}>
                      <h3 style={{ margin: "0 0 10px 0" }}>Current Salary Information</h3>
                      <p style={{ margin: "5px 0" }}><strong>Current Salary:</strong> {formatCurrency(editingSalary.current_salary)}</p>
                      <p style={{ margin: "5px 0" }}><strong>Last Increment:</strong> {editingSalary.last_increment_percentage}% on {formatDate(editingSalary.last_increment_date)}</p>
                    </div>

                    <div className="form-row-appr">
                      <div className="form-group-appr">
                        <label className="form-label-appr">New Salary (for increment):</label>
                        <input
                          type="number"
                          name="new_salary"
                          value={salaryFormData.new_salary}
                          onChange={handleSalaryInputChange}
                          min="0"
                          step="0.01"
                          className="form-input-appr"
                          placeholder="Leave empty if no increment"
                        />
                      </div>

                      <div className="form-group-appr">
                        <label className="form-label-appr">Effective Date:</label>
                        <input
                          type="date"
                          name="effective_date"
                          value={salaryFormData.effective_date}
                          onChange={handleSalaryInputChange}
                          className="form-input-appr"
                        />
                      </div>
                    </div>

                    <div className="form-group-appr">
                      <label className="form-label-appr">Reason for Increment:</label>
                      <input
                        type="text"
                        name="reason"
                        value={salaryFormData.reason}
                        onChange={handleSalaryInputChange}
                        className="form-input-appr"
                        placeholder="e.g., Annual increment, Promotion"
                      />
                    </div>
                  </>
                )}

                <h3 style={{ marginTop: "20px", marginBottom: "10px" }}>Allowances</h3>
                <div className="form-row-appr">
                  <div className="form-group-appr">
                    <label className="form-label-appr">HRA:</label>
                    <input
                      type="number"
                      name="allowances.hra"
                      value={salaryFormData.allowances.hra}
                      onChange={handleSalaryInputChange}
                      min="0"
                      step="0.01"
                      className="form-input-appr"
                    />
                  </div>

                  <div className="form-group-appr">
                    <label className="form-label-appr">DA:</label>
                    <input
                      type="number"
                      name="allowances.da"
                      value={salaryFormData.allowances.da}
                      onChange={handleSalaryInputChange}
                      min="0"
                      step="0.01"
                      className="form-input-appr"
                    />
                  </div>
                </div>

                <div className="form-row-appr">
                  <div className="form-group-appr">
                    <label className="form-label-appr">Transport:</label>
                    <input
                      type="number"
                      name="allowances.transport"
                      value={salaryFormData.allowances.transport}
                      onChange={handleSalaryInputChange}
                      min="0"
                      step="0.01"
                      className="form-input-appr"
                    />
                  </div>

                  <div className="form-group-appr">
                    <label className="form-label-appr">Medical:</label>
                    <input
                      type="number"
                      name="allowances.medical"
                      value={salaryFormData.allowances.medical}
                      onChange={handleSalaryInputChange}
                      min="0"
                      step="0.01"
                      className="form-input-appr"
                    />
                  </div>
                </div>

                <div className="form-group-appr">
                  <label className="form-label-appr">Other Allowances:</label>
                  <input
                    type="number"
                    name="allowances.other"
                    value={salaryFormData.allowances.other}
                    onChange={handleSalaryInputChange}
                    min="0"
                    step="0.01"
                    className="form-input-appr"
                  />
                </div>

                <h3 style={{ marginTop: "20px", marginBottom: "10px" }}>Deductions</h3>
                <div className="form-row-appr">
                  <div className="form-group-appr">
                    <label className="form-label-appr">Tax Deduction:</label>
                    <input
                      type="number"
                      name="tax_deduction"
                      value={salaryFormData.tax_deduction}
                      onChange={handleSalaryInputChange}
                      min="0"
                      step="0.01"
                      className="form-input-appr"
                    />
                  </div>

                  <div className="form-group-appr">
                    <label className="form-label-appr">Other Deductions:</label>
                    <input
                      type="number"
                      name="other_deductions"
                      value={salaryFormData.other_deductions}
                      onChange={handleSalaryInputChange}
                      min="0"
                      step="0.01"
                      className="form-input-appr"
                    />
                  </div>
                </div>

                <h3 style={{ marginTop: "20px", marginBottom: "10px" }}>Payment Details</h3>
                <div className="form-row-appr">
                  <div className="form-group-appr">
                    <label className="form-label-appr">Salary Frequency:</label>
                    <select
                      name="salary_frequency"
                      value={salaryFormData.salary_frequency}
                      onChange={handleSalaryInputChange}
                      className="form-select-appr"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Bi-Weekly">Bi-Weekly</option>
                      <option value="Weekly">Weekly</option>
                    </select>
                  </div>

                  <div className="form-group-appr">
                    <label className="form-label-appr">Payment Method:</label>
                    <select
                      name="payment_method"
                      value={salaryFormData.payment_method}
                      onChange={handleSalaryInputChange}
                      className="form-select-appr"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <h3 style={{ marginTop: "20px", marginBottom: "10px" }}>Bank Details</h3>
                <div className="form-row-appr">
                  <div className="form-group-appr">
                    <label className="form-label-appr">Account Number:</label>
                    <input
                      type="text"
                      name="bank_details.account_number"
                      value={salaryFormData.bank_details.account_number}
                      onChange={handleSalaryInputChange}
                      className="form-input-appr"
                    />
                  </div>

                  <div className="form-group-appr">
                    <label className="form-label-appr">IFSC Code:</label>
                    <input
                      type="text"
                      name="bank_details.ifsc_code"
                      value={salaryFormData.bank_details.ifsc_code}
                      onChange={handleSalaryInputChange}
                      className="form-input-appr"
                    />
                  </div>
                </div>

                <div className="form-row-appr">
                  <div className="form-group-appr">
                    <label className="form-label-appr">Bank Name:</label>
                    <input
                      type="text"
                      name="bank_details.bank_name"
                      value={salaryFormData.bank_details.bank_name}
                      onChange={handleSalaryInputChange}
                      className="form-input-appr"
                    />
                  </div>

                  <div className="form-group-appr">
                    <label className="form-label-appr">Account Holder Name:</label>
                    <input
                      type="text"
                      name="bank_details.account_holder_name"
                      value={salaryFormData.bank_details.account_holder_name}
                      onChange={handleSalaryInputChange}
                      className="form-input-appr"
                    />
                  </div>
                </div>

                <div className="form-group-appr">
                  <label className="form-label-appr">Notes:</label>
                  <textarea
                    name="notes"
                    value={salaryFormData.notes}
                    onChange={handleSalaryInputChange}
                    rows="3"
                    placeholder="Any additional notes..."
                    className="form-textarea-appr"
                  />
                </div>

                <div className="form-actions-appr">
                  <button type="submit" disabled={loading} className="btn-submit-appr">
                    {loading ? "Saving..." : editingSalary ? "Update Salary" : "Create Salary Record"}
                  </button>
                  <button type="button" onClick={handleCancelSalary} className="btn-cancel-appr">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {salaries.length > 0 && (
            <div className="appraisals-list-container-appr">
              <h2 className="section-title-appr">Salary Records for {getSelectedBranchName()}</h2>
              <div className="appraisals-grid-appr">
                {salaries.map((salary) => (
                  <div key={salary._id} className="appraisal-card-appr">
                    <div className="appraisal-header-appr">
                      <div className="appraisal-info-appr">
                        <h3 className="appraisal-title-card-appr">
                          {salary.employee_name} ({salary.role})
                        </h3>
                        <p className="appraisal-meta-appr">
                          Employee ID: {salary.employee_staff_id} | Joined: {formatDate(salary.joining_date)}
                        </p>
                      </div>
                      <div className="appraisal-actions-appr">
                        <button onClick={() => handleEditSalary(salary)} className="btn-edit-appr">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteSalary(salary._id)} className="btn-delete-appr">
                          Delete
                        </button>
                      </div>
                    </div>

                    <div style={{ padding: "15px", backgroundColor: "#f5f5f5", borderRadius: "5px", marginBottom: "10px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <strong>Current Salary:</strong> {formatCurrency(salary.current_salary)}
                        </div>
                        <div>
                          <strong>Gross Salary:</strong> {formatCurrency(salary.gross_salary)}
                        </div>
                        <div>
                          <strong>Net Salary:</strong> {formatCurrency(salary.net_salary)}
                        </div>
                        <div>
                          <strong>Initial Salary:</strong> {formatCurrency(salary.initial_salary)}
                        </div>
                      </div>
                    </div>

                    {salary.last_increment_date && (
                      <div className="rating-section-appr">
                        <strong>Last Increment:</strong> {salary.last_increment_percentage}% 
                        ({formatCurrency(salary.last_increment_amount)}) on {formatDate(salary.last_increment_date)}
                      </div>
                    )}

                    <div className="appraisal-field-appr">
                      <strong>Allowances:</strong>
                      <p className="appraisal-content-appr">
                        HRA: {formatCurrency(salary.allowances?.hra || 0)}, 
                        DA: {formatCurrency(salary.allowances?.da || 0)}, 
                        Transport: {formatCurrency(salary.allowances?.transport || 0)}, 
                        Medical: {formatCurrency(salary.allowances?.medical || 0)}
                      </p>
                    </div>

                    <div className="appraisal-field-appr">
                      <strong>Deductions:</strong>
                      <p className="appraisal-content-appr">
                        Tax: {formatCurrency(salary.tax_deduction || 0)}, 
                        Other: {formatCurrency(salary.other_deductions || 0)}
                      </p>
                    </div>

                    <div className="appraisal-field-appr">
                      <strong>Payment:</strong>
                      <p className="appraisal-content-appr">
                        {salary.salary_frequency} via {salary.payment_method}
                      </p>
                    </div>

                    {salary.salary_history && salary.salary_history.length > 0 && (
                      <div className="appraisal-field-appr">
                        <strong>Salary History ({salary.salary_history.length} increments):</strong>
                        <div style={{ maxHeight: "150px", overflowY: "auto", marginTop: "5px" }}>
                          {salary.salary_history.map((history, index) => (
                            <div key={index} style={{ padding: "8px", backgroundColor: "#f9f9f9", marginBottom: "5px", borderRadius: "3px", fontSize: "13px" }}>
                              {formatDate(history.effective_date)}: {formatCurrency(history.previous_salary)} → {formatCurrency(history.new_salary)} 
                              ({history.increment_percentage}%) - {history.reason}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {salary.notes && (
                      <div className="appraisal-field-appr">
                        <strong>Notes:</strong>
                        <p className="appraisal-content-appr">{salary.notes}</p>
                      </div>
                    )}

                    <div className="appraisal-footer-appr">
                      Last updated: {new Date(salary.updatedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {salaries.length === 0 && !showSalaryForm && !loading && (
            <div className="empty-state-appr">
              <p>No salary records found for this branch.</p>
            </div>
          )}
        </>
      )}

      {!selectedBranch && (
        <div className="empty-state-appr">
          <p>Please select a branch to view {activeTab === "appraisal" ? "appraisals" : "salaries"}.</p>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <p>Loading...</p>
        </div>
      )}
    </div>
  );
};

export default Appraisal;