import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './../styles/Staff.css';

const Staff = () => {
    const [branches, setBranches] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all branches and their staff
    useEffect(() => {
        const fetchBranchesAndStaff = async () => {
            setLoading(true);
            try {
                // Fetch all branches
                const branchesResponse = await axios.get('http://localhost:5000/api/branches');
                const branchesData = branchesResponse.data;
                setBranches(branchesData);

                // Fetch staff for each branch
                const staffPromises = branchesData.map(branch =>
                    axios.get(`http://localhost:5000/api/staff/branches/${branch.branch_id}/staff`)
                );
                
                const staffResponses = await Promise.all(staffPromises);
                const staffByBranch = staffResponses.map(response => response.data);
                
                // Combine branches with their staff
                const staffListWithBranches = branchesData.map((branch, index) => ({
                    ...branch,
                    staff: staffByBranch[index]
                }));
                
                setStaffList(staffListWithBranches);
                setError(null);
            } catch (err) {
                setError('Failed to fetch data.');
            } finally {
                setLoading(false);
            }
        };
        fetchBranchesAndStaff();
    }, []);

    // Handle staff removal
    const handleRemoveStaff = async (staffId, staffName) => {
        if (window.confirm(`Are you sure you want to remove ${staffName}?`)) {
            try {
                await axios.delete(`http://localhost:5000/api/staff/staff/${staffId}`);
                // Refresh the data to reflect the change
                const updatedList = staffList.map(branch => ({
                    ...branch,
                    staff: branch.staff.filter(staff => staff._id !== staffId)
                }));
                setStaffList(updatedList);
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
                const response = await axios.patch(`http://localhost:5000/api/staff/staff/${staffId}`, { role: newRole });
                // Refresh the data to reflect the change
                const updatedList = staffList.map(branch => ({
                    ...branch,
                    staff: branch.staff.map(staff => staff._id === staffId ? response.data : staff)
                }));
                setStaffList(updatedList);
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

            {staffList.map(branch => (
                <div key={branch.branch_id} className="branch-staff-section">
                    <h3>{branch.branch_name} (ID: {branch.branch_id})</h3>
                    {branch.staff.length > 0 ? (
                        <ul className="staff-list">
                            {branch.staff.map(staff => (
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
            ))}
        </div>
    );
};

export default Staff;