import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './../styles/Branch.css';

const Branch = () => {
    const [branches, setBranches] = useState([]);
    const [newBranchName, setNewBranchName] = useState('');
    const [newBranchId, setNewBranchId] = useState('');
    const [newBranchLocation, setNewBranchLocation] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [currentStaff, setCurrentStaff] = useState([]);

    // Fetch branches
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

    // Create Branch
    const handleCreateBranch = async (e) => {
        e.preventDefault();
        if (!newBranchName || !newBranchId || !newBranchLocation) {
            setError('Branch name, ID, and location are required.');
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/branches', {
                branch_name: newBranchName,
                branch_id: newBranchId,
                branch_location: newBranchLocation,
            });
            setBranches([...branches, response.data]);
            setNewBranchName('');
            setNewBranchId('');
            setNewBranchLocation('');
            setError(null);
        } catch (err) {
            setError('Failed to create branch. Check if ID already exists.');
        }
    };

    // Delete Branch
    const handleDeleteBranch = async (branchId) => {
        if (window.confirm('Are you sure you want to delete this branch and all its staff?')) {
            try {
                await axios.delete(`http://localhost:5000/api/branches/${branchId}`);
                setBranches(branches.filter(branch => branch.branch_id !== branchId));
                setError(null);
            } catch (err) {
                setError('Failed to delete branch.');
            }
        }
    };

    // View Branch (fetch staff)
    const handleViewBranch = async (branch) => {
        setSelectedBranch(branch);
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/staff/branches/${branch.branch_id}/staff`);
            setCurrentStaff(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch staff for this branch.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToBranches = () => {
        setSelectedBranch(null);
        setCurrentStaff([]);
    };

    // Remove Staff
    const handleRemoveStaff = async (staffId, staffName) => {
        if (window.confirm(`Are you sure you want to remove ${staffName}?`)) {
            try {
                await axios.delete(`http://localhost:5000/api/staff/staff/${staffId}`);
                setCurrentStaff(prevStaff => prevStaff.filter(s => s._id !== staffId));
                alert(`${staffName} has been removed.`);
            } catch (err) {
                setError('Failed to remove staff.');
            }
        }
    };

    // Change Role
    const handleChangeRole = async (staffId, currentRole) => {
        const newRole = currentRole === 'Manager' ? 'Staff' : 'Manager';
        if (newRole === 'Manager' && currentStaff.some(s => s.role === 'Manager')) {
            alert('A manager already exists for this branch. Please demote the current manager first.');
            return;
        }
        if (window.confirm(`Are you sure you want to change this person's role to ${newRole}?`)) {
            try {
                const response = await axios.patch(`http://localhost:5000/api/staff/staff/${staffId}`, { role: newRole });
                setCurrentStaff(prevStaff => prevStaff.map(s => (s._id === staffId ? response.data : s)));
            } catch (err) {
                setError('Failed to change role.');
            }
        }
    };

    const filteredBranches = branches.filter(branch =>
        branch.branch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.branch_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.branch_location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const hasManager = currentStaff.some(staff => staff.role === 'Manager');

    return (
        <div className="branch-container-abc">
            <h2 className="title-abc">Branch Management</h2>
            {error && <p className="error-abc">{error}</p>}
            {loading && <p className="loading-abc">Loading...</p>}

            <div className="cards-wrapper-abc">
                {/* Create Branch Card */}
                <div className="create-branch-card-abc">
                    <h3>Create New Branch</h3>
                    <form onSubmit={handleCreateBranch} className="form-abc">
                        <input
                            type="text"
                            placeholder="Branch Name"
                            value={newBranchName}
                            onChange={(e) => setNewBranchName(e.target.value)}
                            className="input-abc"
                        />
                        <input
                            type="text"
                            placeholder="Branch ID"
                            value={newBranchId}
                            onChange={(e) => setNewBranchId(e.target.value)}
                            className="input-abc"
                        />
                        <input
                            type="text"
                            placeholder="Branch Location"
                            value={newBranchLocation}
                            onChange={(e) => setNewBranchLocation(e.target.value)}
                            className="input-abc"
                        />
                        <button type="submit" className="button-abc">Create Branch</button>
                    </form>
                </div>

                {/* Operate Branches Card */}
                <div className="operate-branch-card-abc">
                    {!selectedBranch ? (
                        <>
                            <h3>Operate on Branches</h3>
                            <input
                                type="text"
                                placeholder="Search by name, ID, or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-abc"
                            />
                            <ul className="branch-list-abc">
                                {filteredBranches.map(branch => (
                                    <li key={branch.branch_id} className="branch-item-abc">
                                        <span>{branch.branch_name} (ID: {branch.branch_id}) - {branch.branch_location}</span>
                                        <div className="branch-actions-abc">
                                            <button onClick={() => handleViewBranch(branch)} className="button-abc">View</button>
                                            <button onClick={() => handleDeleteBranch(branch.branch_id)} className="delete-abc">Delete</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <>
                            <button onClick={handleBackToBranches} className="back-abc">Back to Branches</button>
                            <h3>Staff for {selectedBranch.branch_name}</h3>
                            <ul className="staff-list-abc">
                                {currentStaff.length > 0 ? currentStaff.map(staff => (
                                    <li key={staff._id} className="staff-item-abc">
                                        <span>{staff.name} <strong className={`role-abc ${staff.role.toLowerCase()}-abc`}>({staff.role})</strong></span>
                                        <div className="staff-actions-abc">
                                            {staff.role === 'Manager' ? (
                                                <button onClick={() => handleChangeRole(staff._id, staff.role)} className="demote-abc">Demote</button>
                                            ) : (
                                                <button
                                                    onClick={() => handleChangeRole(staff._id, staff.role)}
                                                    className="promote-abc"
                                                    title={hasManager ? "A manager already exists for this branch." : "Promote to Manager"}
                                                >
                                                    Promote
                                                </button>
                                            )}
                                            <button onClick={() => handleRemoveStaff(staff._id, staff.name)} className="remove-abc">Remove</button>
                                        </div>
                                    </li>
                                )) : <p>No staff found for this branch.</p>}
                            </ul>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Branch;
