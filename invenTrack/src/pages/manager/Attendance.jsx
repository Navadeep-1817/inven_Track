import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './../../styles/Attendance.css';

function Attendance() {
    const [staffList, setStaffList] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Hardcoded for demonstration; in a real app, get this from user context
    const managerBranchId = 'BRANCH001';

    useEffect(() => {
        const fetchStaff = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`http://localhost:5000/api/attendance/staff/${managerBranchId}`);
                setStaffList(response.data);
                // Initialize attendance state
                const initialAttendance = response.data.reduce((acc, staff) => {
                    acc[staff._id] = 'Present'; // Default to 'Present'
                    return acc;
                }, {});
                setAttendance(initialAttendance);
            } catch (err) {
                setError('Failed to fetch staff.');
            } finally {
                setLoading(false);
            }
        };

        if (managerBranchId) {
            fetchStaff();
        }
    }, [managerBranchId]);

    const handleStatusChange = (staffId, status) => {
        setAttendance(prev => ({
            ...prev,
            [staffId]: status
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const attendanceData = {
            branch_id: managerBranchId,
            date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
            staff: Object.keys(attendance).map(staffId => {
                const staffMember = staffList.find(s => s._id === staffId);
                return {
                    staff_id: staffId,
                    name: staffMember ? staffMember.name : 'Unknown',
                    status: attendance[staffId],
                };
            }),
        };

        try {
            await axios.post('http://localhost:5000/api/attendance/mark', attendanceData);
            setSuccess('Attendance marked successfully for today!');
        } catch (err) {
            if (err.response && err.response.status === 409) {
                setError('Attendance has already been marked for today.');
            } else {
                setError('Failed to mark attendance.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p className="loading">Loading...</p>;

    return (
        <div className="attendance-container">
            <h2>Mark Attendance</h2>
            <p className="attendance-date">Date: {new Date().toLocaleDateString()}</p>

            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            <form onSubmit={handleSubmit}>
                <table className="attendance-table">
                    <thead>
                        <tr>
                            <th>Staff Name</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staffList.map(staff => (
                            <tr key={staff._id}>
                                <td>{staff.name}</td>
                                <td>
                                    <select
                                        value={attendance[staff._id] || ''}
                                        onChange={(e) => handleStatusChange(staff._id, e.target.value)}
                                    >
                                        <option value="Present">Present</option>
                                        <option value="Absent">Absent</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button type="submit" className="submit-attendance-btn" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Attendance'}
                </button>
            </form>
        </div>
    );
}

export default Attendance;
