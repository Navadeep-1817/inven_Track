import React, { useState, useEffect } from "react";
import axios from "axios";
import "./../../styles/Attendance.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Attendance() {
  const [staffList, setStaffList] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([]);

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        
        const response = await axios.get(`${API_BASE_URL}/api/attendance/staff`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const staffData = response.data.staff || [];
        setStaffList(staffData);

        const initialAttendance = staffData.reduce((acc, staff) => {
          acc[staff._id] = "Present";
          return acc;
        }, {});
        setAttendance(initialAttendance);
        setError(null);
      } catch (err) {
        console.error("Error fetching staff:", err);
        if (err.response?.status === 400) {
          setError("Branch ID is missing. Please contact administrator.");
        } else if (err.response?.status === 401) {
          setError("Unauthorized. Please login again.");
        } else {
          setError("Failed to fetch staff. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

  const fetchAttendanceRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/attendance/records`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const records = response.data.records || [];
      setAttendanceRecords(records);
      calculateAttendanceStats(records);
      setShowReport(true);
      setError(null);
    } catch (err) {
      console.error("Error fetching attendance records:", err);
      setError("Failed to fetch attendance records.");
    } finally {
      setLoading(false);
    }
  };

  const calculateAttendanceStats = (records) => {
    const staffAttendance = {};

    // Initialize all staff
    staffList.forEach(staff => {
      staffAttendance[staff._id] = {
        name: staff.name,
        role: staff.role,
        totalDays: records.length,
        presentDays: 0,
        absentDays: 0,
        percentage: 0
      };
    });

    // Count present/absent days
    records.forEach(record => {
      record.staff.forEach(staffEntry => {
        if (staffAttendance[staffEntry.staff_id]) {
          if (staffEntry.status === "Present") {
            staffAttendance[staffEntry.staff_id].presentDays++;
          } else {
            staffAttendance[staffEntry.staff_id].absentDays++;
          }
        }
      });
    });

    // Calculate percentages
    const stats = Object.values(staffAttendance).map(staff => ({
      ...staff,
      percentage: staff.totalDays > 0 
        ? ((staff.presentDays / staff.totalDays) * 100).toFixed(2)
        : 0
    }));

    setAttendanceStats(stats);
  };

  const downloadCSV = () => {
    const headers = ["Name", "Role", "Total Days", "Present Days", "Absent Days", "Attendance %"];
    const rows = attendanceStats.map(stat => [
      stat.name,
      stat.role,
      stat.totalDays,
      stat.presentDays,
      stat.absentDays,
      stat.percentage
    ]);

    let csvContent = headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleStatusChange = (staffId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [staffId]: status,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem("token");

    const attendanceData = {
      staff: Object.keys(attendance).map((staffId) => {
        const staffMember = staffList.find((s) => s._id === staffId);
        return {
          staff_id: staffId,
          name: staffMember ? staffMember.name : "Unknown",
          status: attendance[staffId],
        };
      }),
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/attendance/mark`,
        attendanceData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSuccess("Attendance marked successfully for today!");
      }
    } catch (err) {
      console.error("Error marking attendance:", err);
      if (err.response && err.response.status === 400) {
        setError("Attendance already marked for today.");
      } else {
        setError("Failed to mark attendance. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 90) return "#10b981";
    if (percentage >= 75) return "#3b82f6";
    if (percentage >= 60) return "#f59e0b";
    return "#ef4444";
  };

  if (loading && staffList.length === 0 && !showReport) {
    return (
      <div className="loading-att">
        <div className="spinner-att"></div>
        Loading staff data...
      </div>
    );
  }

  return (
    <div className="attendance-container-att">
      <div className="attendance-header-att">
        <h2 className="attendance-title-att">
          {showReport ? "Attendance Report" : "Mark Attendance"}
        </h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="attendance-date-att">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <button
            onClick={() => {
              if (showReport) {
                setShowReport(false);
              } else {
                fetchAttendanceRecords();
              }
            }}
            className="submit-attendance-btn-att"
            style={{ 
              fontSize: '0.9rem', 
              padding: '0.5rem 1rem',
              minWidth: '150px'
            }}
          >
            {showReport ? "Mark Attendance" : "Show Attendance"}
          </button>
        </div>
      </div>

      <div className="attendance-alerts-att">
        {error && (
          <div className="error-message-att">
            <span className="alert-icon-att">⚠️</span>
            {error}
          </div>
        )}
        {success && (
          <div className="success-message-att">
            {success}
          </div>
        )}
      </div>

      {showReport ? (
        <div>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#333', fontSize: '1.2rem' }}>
              Attendance Statistics ({attendanceRecords.length} days recorded)
            </h3>
            <button
              onClick={downloadCSV}
              className="submit-attendance-btn-att"
              style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
              disabled={attendanceStats.length === 0}
            >
               Download CSV
            </button>
          </div>

          {attendanceStats.length === 0 ? (
            <div className="no-staff-message-att">
              <p>No attendance records found.</p>
            </div>
          ) : (
            <div className="attendance-table-container-att">
              <table className="attendance-table-att">
                <thead className="attendance-thead-att">
                  <tr className="attendance-tr-att">
                    <th className="attendance-th-att name-header-att">Staff Name</th>
                    <th className="attendance-th-att">Role</th>
                    <th className="attendance-th-att">Total Days</th>
                    <th className="attendance-th-att">Present</th>
                    <th className="attendance-th-att">Absent</th>
                    <th className="attendance-th-att">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="attendance-tbody-att">
                  {attendanceStats.map((stat, index) => (
                    <tr 
                      key={index} 
                      className={`attendance-tr-att ${index % 2 === 0 ? 'row-even-att' : 'row-odd-att'}`}
                    >
                      <td className="attendance-td-att staff-name-att">
                        
                        {stat.name}
                      </td>
                      <td className="attendance-td-att">
                        <span className="staff-role-badge-att">{stat.role}</span>
                      </td>
                      <td className="attendance-td-att" style={{ textAlign: 'center' }}>
                        {stat.totalDays}
                      </td>
                      <td className="attendance-td-att" style={{ textAlign: 'center', color: '#10b981', fontWeight: 'bold' }}>
                        {stat.presentDays}
                      </td>
                      <td className="attendance-td-att" style={{ textAlign: 'center', color: '#ef4444', fontWeight: 'bold' }}>
                        {stat.absentDays}
                      </td>
                      <td className="attendance-td-att" style={{ textAlign: 'center' }}>
                        <div style={{
                          display: 'inline-block',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '8px',
                          backgroundColor: getPercentageColor(stat.percentage) + '20',
                          color: getPercentageColor(stat.percentage),
                          fontWeight: 'bold',
                          fontSize: '1rem'
                        }}>
                          {stat.percentage}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <>
          {staffList.length === 0 && !loading ? (
            <div className="no-staff-message-att">
              <p>No staff members found for your branch.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="attendance-form-att">
              <div className="attendance-table-container-att">
                <table className="attendance-table-att">
                  <thead className="attendance-thead-att">
                    <tr className="attendance-tr-att">
                      <th className="attendance-th-att name-header-att">Staff Name</th>
                      <th className="attendance-th-att status-header-att">Status</th>
                    </tr>
                  </thead>
                  <tbody className="attendance-tbody-att">
                    {staffList.map((staff, index) => (
                      <tr 
                        key={staff._id} 
                        className={`attendance-tr-att ${index % 2 === 0 ? 'row-even-att' : 'row-odd-att'}`}
                      >
                        <td className="attendance-td-att staff-name-att">
                          {staff.name}
                          {staff.role && <span className="staff-role-badge-att"> Role:{staff.role}</span>}
                        </td>
                        <td className="attendance-td-att status-cell-att">
                          <select
                            value={attendance[staff._id] || "Present"}
                            onChange={(e) => handleStatusChange(staff._id, e.target.value)}
                            className={`status-select-att ${
                              attendance[staff._id] === "Present" ? "status-present-att" : "status-absent-att"
                            }`}
                          >
                            <option value="Present" className="option-present-att">Present</option>
                            <option value="Absent" className="option-absent-att">Absent</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="submit-container-att">
                <button
                  type="submit"
                  className="submit-attendance-btn-att"
                  disabled={loading || staffList.length === 0}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner-att"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <span className="submit-icon-att"></span>
                      Submit Attendance
                    </>
                  )}
                </button>
                <div className="staff-count-att">
                  Total Staff: {staffList.length}
                </div>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}

export default Attendance;