// // routes/branchRoutes.js

// const express = require('express');
// const router = express.Router();

// const { getAllBranches, createBranch, deleteBranch } = require('../controllers/branchController');

// router.get('/branches', getAllBranches);
// router.post('/branches', createBranch);
// router.delete('/branches/:branchId', deleteBranch);

// module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const { getAllBranches, createBranch, deleteBranch } = require('../controllers/branchController');

router.get('/', getAllBranches); // handles GET /api/branches
router.post('/', createBranch); // handles POST /api/branchesx  
router.delete('/:branchId',protect, deleteBranch); // handles DELETE /api/branches/:branchId


module.exports = router;