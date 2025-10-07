import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './../styles/Staff.css';

const Staff = () => {
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null); // To hold the selected branch object
    const [currentStaff, setCurrentStaff] = useState([]); // To hold staff of the selected branch
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all branches on initial component mount
    useEffect(() => {
        const fetchBranches = async () => {
            setLoading(true);
            try {
                const response = await axios.get('http://localhost:5000/api/branches');
                setBranches(response.data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch branches.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBranches();
    }, []);

    // Function to handle selecting a branch and fetching its staff
    const handleSelectBranch = async (branch) => {
        setSelectedBranch(branch);
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/staff/branches/${branch.branch_id}/staff`);
            setCurrentStaff(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch staff for this branch.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Function to go back to the branch list view
    const handleBackToBranches = () => {
        setSelectedBranch(null);
        setCurrentStaff([]);
    };
    
    // Handle staff removal
    const handleRemoveStaff = async (staffId, staffName) => {
        if (window.confirm(`Are you sure you want to remove ${staffName}?`)) {
            try {
                await axios.delete(`http://localhost:5000/api/staff/staff/${staffId}`);
                // Update state locally without re-fetching
                setCurrentStaff(prevStaff => prevStaff.filter(s => s._id !== staffId));
                alert(`${staffName} has been removed.`);
            } catch (err) {
                setError('Failed to remove staff.');
                console.error(err);
            }
        }
    };

    // Handle staff role change (manager/staff)
    const handleChangeRole = async (staffId, currentRole) => {
        const newRole = currentRole === 'Manager' ? 'Staff' : 'Manager';

        // Check if promoting to manager while one already exists
        if (newRole === 'Manager' && currentStaff.some(s => s.role === 'Manager')) {
            alert('A manager already exists for this branch. Please demote the current manager first.');
            return; // Stop the function
        }

        if (window.confirm(`Are you sure you want to change this person's role to ${newRole}?`)) {
            try {
                const response = await axios.patch(`http://localhost:5000/api/staff/staff/${staffId}`, { role: newRole });
                // Update state locally for an instant UI update
                setCurrentStaff(prevStaff => 
                    prevStaff.map(s => (s._id === staffId ? response.data : s))
                );
            } catch (err) {
                setError('Failed to change role.');
                console.error(err);
            }
        }
    };

    // Determine if a manager exists for the current branch
    const hasManager = currentStaff.some(staff => staff.role === 'Manager');

    return (
        <div className="staff-management-container">
            <h2>Staff Management</h2>
            {error && <p className="error">{error}</p>}

            {/* Conditional Rendering: Show branch list or staff list */}
            {!selectedBranch ? (
                // VIEW 1: Branch List
                <div className="branch-view">
                    <h3>All Branches</h3>
                    {loading ? <p className="loading">Loading Branches...</p> : (
                        <ul className="branch-list">
                            {branches.map(branch => (
                                <li key={branch.branch_id} className="branch-item">
                                    <span>{branch.branch_name} (ID: {branch.branch_id})</span>
                                    <button onClick={() => handleSelectBranch(branch)} className="operate-button">
                                        Operate
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : (
                // VIEW 2: Staff List for a Selected Branch
                <div className="staff-view">
                    <button onClick={handleBackToBranches} className="back-button"> Back to Branches</button>
                    <h3>Staff for {selectedBranch.branch_name}</h3>
                    {loading ? <p className="loading">Loading Staff...</p> : (
                        <ul className="staff-list">
                            {currentStaff.length > 0 ? currentStaff.map(staff => (
                                <li key={staff._id} className="staff-item">
                                    <span>{staff.name} <strong className={`role-${staff.role.toLowerCase()}`}>({staff.role})</strong></span>
                                    <div className="staff-actions">
                                        {staff.role === 'Manager' ? (
                                            <button onClick={() => handleChangeRole(staff._id, staff.role)} className="demote-button">
                                                Demote
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleChangeRole(staff._id, staff.role)} 
                                                className="promote-button"
                                                
                                                title={hasManager ? "A manager already exists for this branch." : "Promote to Manager"}
                                            >
                                                Promote
                                            </button>
                                        )}
                                        <button onClick={() => handleRemoveStaff(staff._id, staff.name)} className="remove-button">
                                            Remove
                                        </button>
                                    </div>
                                </li>
                            )) : <p>No staff found for this branch.</p>}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default Staff;