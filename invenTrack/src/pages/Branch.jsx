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
    const [showBranches, setShowBranches] = useState(false); // NEW: toggle visibility

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

    const filteredBranches = branches.filter(branch =>
        branch.branch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.branch_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.branch_location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="branch-container">
            
            {loading && <p className="branch-loading">Loading...</p>}
            {error && <p className="branch-error">{error}</p>}

            {/* Left Section: Create Branch */}
            <div className="branch-create-section">
                <h3>Create New Branch</h3>
                <form onSubmit={handleCreateBranch} className="branch-form">
                    <input
                        type="text"
                        placeholder="Branch Name"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        required
                        className="branch-input"
                    />
                    <input
                        type="text"
                        placeholder="Branch ID"
                        value={newBranchId}
                        onChange={(e) => setNewBranchId(e.target.value)}
                        required
                        className="branch-input"
                    />
                    <input
                        type="text"
                        placeholder="Branch Location"
                        value={newBranchLocation}
                        onChange={(e) => setNewBranchLocation(e.target.value)}
                        required
                        className="branch-input"
                    />
                    <button type="submit" className="branch-button">Create Branch</button>
                </form>
            </div>

            {/* Right Section: Explore Branches */}
            <div className="branch-list-section">
                <h3>Explore Branches</h3>
                <button
                    onClick={() => setShowBranches(!showBranches)}
                    className="branch-button"
                >
                    {showBranches ? 'Hide Branches' : 'Show All Branches'}
                </button>

                {showBranches && (
                    <>
                        <input
                            type="text"
                            placeholder="Search by name, ID, or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="branch-search-input"
                        />

                        {filteredBranches.length > 0 ? (
                            <ul className="branch-list">
                                {filteredBranches.map(branch => (
                                    <li key={branch.branch_id} className="branch-item">
                                        <span className="branch-info">
                                            {branch.branch_name} (ID: {branch.branch_id}) - {branch.branch_location}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteBranch(branch.branch_id)}
                                            className="branch-delete-button"
                                        >
                                            Delete Branch
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="branch-no-results">No branches found.</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Branch;
