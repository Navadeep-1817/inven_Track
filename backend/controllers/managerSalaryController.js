const User = require("../models/User");
const Salary = require("../models/Salary");

// Create salary record
exports.createSalary = async (req, res) => {
  try {
    const {
      employee_id,
      initial_salary,
      joining_date,
      salary_frequency,
      payment_method,
      allowances,
      tax_deduction,
      other_deductions,
      bank_details,
      notes,
    } = req.body;

    console.log("🔍 Creating salary for employee:", employee_id);

    // Validate required fields
    if (!employee_id || !initial_salary || !joining_date) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, initial salary, and joining date are required.",
      });
    }

    // Get employee details
    const employee = await User.findById(employee_id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    // Verify employee belongs to manager's branch
    if (employee.branch_id !== req.user.branchId) {
      return res.status(403).json({
        success: false,
        message: "You can only create salary records for staff in your branch.",
      });
    }

    // Check if salary already exists
    const existingSalary = await Salary.findOne({ employee_id });
    if (existingSalary) {
      return res.status(400).json({
        success: false,
        message: "Salary record already exists for this employee.",
      });
    }

    // Create salary record
    const salary = new Salary({
      employee_id,
      employee_name: employee.name,
      employee_staff_id: employee.employee_id,
      branch_id: employee.branch_id,
      role: employee.role,
      initial_salary: parseFloat(initial_salary),
      current_salary: parseFloat(initial_salary),
      joining_date,
      salary_frequency: salary_frequency || "Monthly",
      payment_method: payment_method || "Bank Transfer",
      allowances: allowances || {
        hra: 0,
        da: 0,
        transport: 0,
        medical: 0,
        other: 0,
      },
      tax_deduction: tax_deduction || 0,
      other_deductions: other_deductions || 0,
      bank_details: bank_details || {},
      notes,
      created_by: req.user.name || req.user.id,
      last_updated_by: req.user.name || req.user.id,
    });

    await salary.save();

    console.log("✅ Salary record created successfully");

    res.status(201).json({
      success: true,
      message: "Salary record created successfully.",
      salary,
    });
  } catch (err) {
    console.error("❌ Error in createSalary:", err);
    res.status(500).json({
      success: false,
      message: "Server error while creating salary record.",
      error: err.message,
    });
  }
};

// Get all salaries for a branch
exports.getSalariesByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    console.log("🔍 Fetching salaries for branch:", branchId);

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required.",
      });
    }

    // Verify manager can only access their own branch
    if (req.user.branchId !== branchId) {
      return res.status(403).json({
        success: false,
        message: "You can only view salaries from your branch.",
      });
    }

    const salaries = await Salary.find({ branch_id: branchId })
      .populate("employee_id", "name email employee_id")
      .sort({ employee_name: 1 });

    console.log(`✅ Found ${salaries.length} salary records`);

    res.status(200).json({
      success: true,
      count: salaries.length,
      salaries,
    });
  } catch (err) {
    console.error("❌ Error in getSalariesByBranch:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching salaries.",
      error: err.message,
    });
  }
};

// Get staff without salary records
exports.getStaffWithoutSalary = async (req, res) => {
  try {
    const { branchId } = req.params;

    console.log("🔍 Fetching staff without salary for branch:", branchId);

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required.",
      });
    }

    // Verify manager can only access their own branch
    if (req.user.branchId !== branchId) {
      return res.status(403).json({
        success: false,
        message: "You can only view staff from your branch.",
      });
    }

    // Get all staff in branch
    const allStaff = await User.find({
      branch_id: branchId,
      role: { $in: ["Staff", "Manager"] },
    }).select("_id name email employee_id");

    // Get all staff with salary records
    const staffWithSalary = await Salary.find({ branch_id: branchId }).distinct("employee_id");

    // Filter out staff who already have salary records
    const staffWithoutSalary = allStaff.filter(
      (staff) => !staffWithSalary.some((id) => id.toString() === staff._id.toString())
    );

    console.log(`✅ Found ${staffWithoutSalary.length} staff without salary`);

    res.status(200).json({
      success: true,
      count: staffWithoutSalary.length,
      employees: staffWithoutSalary,
    });
  } catch (err) {
    console.error("❌ Error in getStaffWithoutSalary:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching staff without salary.",
      error: err.message,
    });
  }
};

// Get salary statistics for a branch
exports.getSalaryStats = async (req, res) => {
  try {
    const { branchId } = req.params;

    console.log("🔍 Fetching salary stats for branch:", branchId);

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required.",
      });
    }

    // Verify manager can only access their own branch
    if (req.user.branchId !== branchId) {
      return res.status(403).json({
        success: false,
        message: "You can only view statistics from your branch.",
      });
    }

    const salaries = await Salary.find({ branch_id: branchId });

    const stats = {
      total_employees: salaries.length,
      staff_count: salaries.length,
      total_gross_salary: salaries.reduce((sum, s) => sum + (s.gross_salary || 0), 0),
      total_net_salary: salaries.reduce((sum, s) => sum + (s.net_salary || 0), 0),
      average_salary: salaries.length > 0 
        ? salaries.reduce((sum, s) => sum + (s.current_salary || 0), 0) / salaries.length 
        : 0,
    };

    console.log("✅ Salary stats calculated:", stats);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error("❌ Error in getSalaryStats:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching salary statistics.",
      error: err.message,
    });
  }
};

// Get salary by ID
exports.getSalaryById = async (req, res) => {
  try {
    const { salaryId } = req.params;

    const salary = await Salary.findById(salaryId).populate(
      "employee_id",
      "name email employee_id branch_id"
    );

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary record not found.",
      });
    }

    // Verify manager can only access salaries from their branch
    if (salary.branch_id !== req.user.branchId) {
      return res.status(403).json({
        success: false,
        message: "You can only view salaries from your branch.",
      });
    }

    res.status(200).json({
      success: true,
      salary,
    });
  } catch (err) {
    console.error("❌ Error in getSalaryById:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching salary.",
      error: err.message,
    });
  }
};

// Update salary record
exports.updateSalary = async (req, res) => {
  try {
    const { salaryId } = req.params;
    const {
      new_salary,
      effective_date,
      reason,
      allowances,
      tax_deduction,
      other_deductions,
      bank_details,
      payment_method,
      notes,
    } = req.body;

    console.log("🔍 Updating salary:", salaryId);

    const salary = await Salary.findById(salaryId);

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary record not found.",
      });
    }

    // Verify manager can only update salaries from their branch
    if (salary.branch_id !== req.user.branchId) {
      return res.status(403).json({
        success: false,
        message: "You can only update salary records from your branch.",
      });
    }

    // If new salary is provided, add to history
    if (new_salary && parseFloat(new_salary) !== salary.current_salary) {
      const increment_amount = parseFloat(new_salary) - salary.current_salary;
      const increment_percentage = ((increment_amount / salary.current_salary) * 100).toFixed(2);

      salary.salary_history.push({
        previous_salary: salary.current_salary,
        new_salary: parseFloat(new_salary),
        effective_date: effective_date || new Date(),
        increment_amount,
        increment_percentage: parseFloat(increment_percentage),
        reason: reason || "Salary revision",
        updated_by: req.user.name || req.user.id,
        updated_at: new Date(),
      });

      salary.current_salary = parseFloat(new_salary);
      salary.last_increment_date = effective_date || new Date();
      salary.last_increment_amount = increment_amount;
      salary.last_increment_percentage = parseFloat(increment_percentage);
    }

    // Update other fields
    if (allowances) salary.allowances = allowances;
    if (tax_deduction !== undefined) salary.tax_deduction = tax_deduction;
    if (other_deductions !== undefined) salary.other_deductions = other_deductions;
    if (bank_details) salary.bank_details = bank_details;
    if (payment_method) salary.payment_method = payment_method;
    if (notes !== undefined) salary.notes = notes;

    salary.last_updated_by = req.user.name || req.user.id;

    await salary.save();

    console.log("✅ Salary updated successfully");

    res.status(200).json({
      success: true,
      message: "Salary record updated successfully.",
      salary,
    });
  } catch (err) {
    console.error("❌ Error in updateSalary:", err);
    res.status(500).json({
      success: false,
      message: "Server error while updating salary.",
      error: err.message,
    });
  }
};

// Delete salary record
exports.deleteSalary = async (req, res) => {
  try {
    const { salaryId } = req.params;

    console.log("🔍 Deleting salary:", salaryId);

    const salary = await Salary.findById(salaryId);

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary record not found.",
      });
    }

    // Verify manager can only delete salaries from their branch
    if (salary.branch_id !== req.user.branchId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete salary records from your branch.",
      });
    }

    await Salary.findByIdAndDelete(salaryId);

    console.log("✅ Salary deleted successfully");

    res.status(200).json({
      success: true,
      message: "Salary record deleted successfully.",
    });
  } catch (err) {
    console.error("❌ Error in deleteSalary:", err);
    res.status(500).json({
      success: false,
      message: "Server error while deleting salary.",
      error: err.message,
    });
  }
};