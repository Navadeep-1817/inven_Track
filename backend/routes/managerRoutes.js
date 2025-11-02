const express = require('express');
const router = express.Router();
const { protect, managerOnly } = require('../middleware/authMiddleware');

// Import controllers
const managerAppraisalController = require('../controllers/managerAppraisalController');
const managerSalaryController = require('../controllers/managerSalaryController');

// All routes require authentication and manager role
router.use(protect);
router.use(managerOnly);

// Manager Staff Routes
router.get('/branch/:branchId/staff', managerAppraisalController.getStaffByBranch);

// Manager Appraisal Routes
router.post('/appraisals', managerAppraisalController.createStaffAppraisal);
router.get('/appraisals/branch/:branchId', managerAppraisalController.getAppraisalsByBranch);
router.get('/appraisals/:appraisalId', managerAppraisalController.getAppraisalById);
router.put('/appraisals/:appraisalId', managerAppraisalController.updateStaffAppraisal);
router.delete('/appraisals/:appraisalId', managerAppraisalController.deleteAppraisal);

// Manager Salary Routes
router.post('/salaries', managerSalaryController.createSalary);
router.get('/salaries/branch/:branchId', managerSalaryController.getSalariesByBranch);
router.get('/salaries/branch/:branchId/without-salary', managerSalaryController.getStaffWithoutSalary);
router.get('/salaries/branch/:branchId/stats', managerSalaryController.getSalaryStats);
router.get('/salaries/:salaryId', managerSalaryController.getSalaryById);
router.put('/salaries/:salaryId', managerSalaryController.updateSalary);
router.delete('/salaries/:salaryId', managerSalaryController.deleteSalary);

module.exports = router;