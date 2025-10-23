import React, { useState, useEffect } from "react";
import axios from "axios";
import "./../../styles/Attendance.css";

function Attendance() {
  const [staffList, setStaffList] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/attendance/staff", {
          headers: { Authorization: `Bearer ${token}` },  
        }); 

        const staffData = response.data.staff || [];
        setStaffList(staffData);

        const initialAttendance = staffData.reduce((acc, staff) => {
          acc[staff._id] = "Present";
          return acc;
        }, {});
        setAttendance(initialAttendance);
      } catch (err) {
        setError("Failed to fetch staff.");
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

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
        "http://localhost:5000/api/attendance/mark",
        attendanceData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSuccess("Attendance marked successfully for today!");
      }
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setError("Attendance already marked for today.");
      } else {
        setError("Failed to mark attendance.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-att">Loading...</div>;

  return (
    <div className="attendance-container-att">
      <div className="attendance-header-att">
        <h2 className="attendance-title-att">Mark Attendance</h2>
        <div className="attendance-date-att">
          <span className="date-icon-att"></span>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
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
            <span className="alert-icon-att">✅</span>
            {success}
          </div>
        )}
      </div>

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
                    <span className="staff-avatar-att">👤</span>
                    {staff.name}
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
    </div>
  );
}

export default Attendance;