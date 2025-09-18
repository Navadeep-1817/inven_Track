import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './../styles/Staff.css';
const Staff = () => {
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all branches
    useEffect(() => {
        const fetchBranches = async () => {
            setLoading(true);
            try {   
                const response = await axios.get('http://localhost:5000/api/branches');
                setBranches(response.data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch branches.');
            } finally {
                setLoading(false);
            }
        };
        fetchBranches();
    }, []);

    // Fetch staff for the selected branch
    useEffect(() => {
        if (selectedBranchId) {
            const fetchStaff = async () => {
                setLoading(true);
                try {
                    const response = await axios.get(`http://localhost:5000/api/branches/${selectedBranchId}/staff`);
                    setStaffList(response.data);
                    setError(null);
                } catch (err) {
                    setError('Failed to fetch staff.');
                    setStaffList([]);
                } finally {
                    setLoading(false);
                }
            };
            fetchStaff();
        } else {
            setStaffList([]);
        }
    }, [selectedBranchId]);

    // Handle staff removal
    const handleRemoveStaff = async (staffId, staffName) => {
        if (window.confirm(`Are you sure you want to remove ${staffName}?`)) {
            try {
                await axios.delete(`http://localhost:5000/api/staff/${staffId}`);
                setStaffList(staffList.filter(staff => staff._id !== staffId));
                alert(`${staffName} has been removed.`);
            } catch (err) {
                setError('Failed to remove staff.');
            }
        }
    };

    // Handle staff role change (manager/staff)
    const handleChangeRole = async (staffId, currentRole) => {
        const newRole = currentRole === 'Manager' ? 'Staff' : 'Manager';
        if (window.confirm(`Are you sure you want to change this person's role to ${newRole}?`)) {
            try {
                const response = await axios.patch(`http://localhost:5000/api/staff/${staffId}`, { role: newRole });
                setStaffList(staffList.map(staff => staff._id === staffId ? response.data : staff));
            } catch (err) {
                setError('Failed to change role.');
            }
        }
    };

    return (
        <div className="staff-management-container">
            <h2>Staff Management</h2>
            {loading && <p>Loading...</p>}
            {error && <p className="error">{error}</p>}

            <div className="branch-selector">
                <label htmlFor="branch-select">Select a Branch:</label>
                <select id="branch-select" onChange={(e) => setSelectedBranchId(e.target.value)} value={selectedBranchId}>
                    <option value="">-- Select a branch --</option>
                    {branches.map(branch => (
                        <option key={branch.branch_id} value={branch.branch_id}>
                            {branch.name} (ID: {branch.branch_id})
                        </option>
                    ))}
                </select>
            </div>

            {selectedBranchId && (
                <div className="staff-list-section">
                    <h3>Staff at Branch ID: {selectedBranchId}</h3>
                    {staffList.length > 0 ? (
                        <ul className="staff-list">
                            {staffList.map(staff => (
                                <li key={staff._id} className="staff-item">
                                    <span>{staff.name} ({staff.role})</span>
                                    <div className="staff-actions">
                                        <button onClick={() => handleChangeRole(staff._id, staff.role)}>
                                            {staff.role === 'Manager' ? 'Demote to Staff' : 'Promote to Manager'}
                                        </button>
                                        <button onClick={() => handleRemoveStaff(staff._id, staff.name)} className="remove-button">
                                            Remove
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No staff found for this branch.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Staff;