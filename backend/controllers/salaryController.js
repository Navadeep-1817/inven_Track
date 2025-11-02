const Salary = require("../models/Salary");
const User = require("../models/User");
const Branch = require("../models/Branch");

// Get all salaries for a specific branch
exports.getSalariesByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    console.log("📊 Fetching salaries for branch:", branchId);

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required.",
      });
    }

    // First check if Salary model exists
    const salaries = await Salary.find({ branch_id: branchId })
      .lean() // Use lean() for better performance and to avoid population issues
      .sort({ role: -1, employee_name: 1 }); // Managers first, then alphabetically

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

// Get salary details for a specific employee
exports.getSalaryByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required.",
      });
    }

    const salary = await Salary.findOne({ employee_id: employeeId }).populate(
      "employee_id",
      "name email employee_id role branch_id"
    );

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary record not found for this employee.",
      });
    }

    res.status(200).json({
      success: true,
      salary,
    });
  } catch (err) {
    console.error("Error in getSalaryByEmployee:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching salary.",
      error: err.message,
    });
  }
};

// Create or initialize salary record for an employee
exports.createSalary = async (req, res) => {
  try {
    const {
      employee_id,
      initial_salary,
      joining_date,
      salary_frequency,
      payment_method,
      bank_details,
      allowances,
      tax_deduction,
      other_deductions,
      notes,
    } = req.body;

    if (!employee_id || !initial_salary || !joining_date) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, initial salary, and joining date are required.",
      });
    }

    // Check if employee exists
    const employee = await User.findById(employee_id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    // Check if salary record already exists
    const existingSalary = await Salary.findOne({ employee_id });
    if (existingSalary) {
      return res.status(400).json({
        success: false,
        message: "Salary record already exists for this employee.",
      });
    }

    // Create new salary record
    const newSalary = new Salary({
      employee_id,
      employee_name: employee.name,
      employee_staff_id: employee.employee_id,
      branch_id: employee.branch_id,
      role: employee.role,
      current_salary: initial_salary,
      initial_salary,
      joining_date,
      salary_frequency: salary_frequency || "Monthly",
      payment_method: payment_method || "Bank Transfer",
      bank_details: bank_details || {},
      allowances: allowances || {},
      tax_deduction: tax_deduction || 0,
      other_deductions: other_deductions || 0,
      notes: notes || "",
      created_by: req.user?.id || "superadmin",
      last_updated_by: req.user?.id || "superadmin",
    });

    await newSalary.save();

    res.status(201).json({
      success: true,
      message: "Salary record created successfully.",
      salary: newSalary,
    });
  } catch (err) {
    console.error("Error in createSalary:", err);
    res.status(500).json({
      success: false,
      message: "Server error while creating salary record.",
      error: err.message,
    });
  }
};

// Update salary (for increments)
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

    if (!salaryId) {
      return res.status(400).json({
        success: false,
        message: "Salary ID is required.",
      });
    }

    const salary = await Salary.findById(salaryId);
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary record not found.",
      });
    }

    // If new salary is provided, it's an increment
    if (new_salary && new_salary !== salary.current_salary) {
      const incrementAmount = new_salary - salary.current_salary;
      const incrementPercentage = ((incrementAmount / salary.current_salary) * 100).toFixed(2);

      // Add to salary history
      salary.salary_history.push({
        previous_salary: salary.current_salary,
        new_salary: new_salary,
        increment_percentage: parseFloat(incrementPercentage),
        increment_amount: incrementAmount,
        effective_date: effective_date || new Date(),
        reason: reason || "Salary increment",
        updated_by: req.user?.id || "superadmin",
      });

      // Update current salary details
      salary.current_salary = new_salary;
      salary.last_increment_date = effective_date || new Date();
      salary.last_increment_percentage = parseFloat(incrementPercentage);
      salary.last_increment_amount = incrementAmount;
    }

    // Update other fields if provided
    if (allowances) salary.allowances = { ...salary.allowances, ...allowances };
    if (tax_deduction !== undefined) salary.tax_deduction = tax_deduction;
    if (other_deductions !== undefined) salary.other_deductions = other_deductions;
    if (bank_details) salary.bank_details = { ...salary.bank_details, ...bank_details };
    if (payment_method) salary.payment_method = payment_method;
    if (notes !== undefined) salary.notes = notes;

    salary.last_updated_by = req.user?.id || "superadmin";

    await salary.save();

    res.status(200).json({
      success: true,
      message: "Salary updated successfully.",
      salary,
    });
  } catch (err) {
    console.error("Error in updateSalary:", err);
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

    if (!salaryId) {
      return res.status(400).json({
        success: false,
        message: "Salary ID is required.",
      });
    }

    const salary = await Salary.findByIdAndDelete(salaryId);

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary record not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Salary record deleted successfully.",
    });
  } catch (err) {
    console.error("Error in deleteSalary:", err);
    res.status(500).json({
      success: false,
      message: "Server error while deleting salary record.",
      error: err.message,
    });
  }
};

// Get employees without salary records for a branch
exports.getEmployeesWithoutSalary = async (req, res) => {
  try {
    const { branchId } = req.params;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required.",
      });
    }

    // Get all employees in the branch
    const employees = await User.find({ branch_id: branchId }).select("_id name employee_id role");

    // Get all employee IDs that have salary records
    const employeesWithSalary = await Salary.find({ branch_id: branchId }).select("employee_id");
    const employeeIdsWithSalary = employeesWithSalary.map((s) => s.employee_id.toString());

    // Filter out employees who already have salary records
    const employeesWithoutSalary = employees.filter(
      (emp) => !employeeIdsWithSalary.includes(emp._id.toString())
    );

    res.status(200).json({
      success: true,
      count: employeesWithoutSalary.length,
      employees: employeesWithoutSalary,
    });
  } catch (err) {
    console.error("Error in getEmployeesWithoutSalary:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching employees.",
      error: err.message,
    });
  }
};

// Get salary statistics for a branch
exports.getSalaryStatsByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required.",
      });
    }

    const salaries = await Salary.find({ branch_id: branchId });

    if (salaries.length === 0) {
      return res.status(200).json({
        success: true,
        stats: {
          total_employees: 0,
          total_gross_salary: 0,
          total_net_salary: 0,
          average_salary: 0,
          managers_count: 0,
          staff_count: 0,
        },
      });
    }

    const stats = {
      total_employees: salaries.length,
      total_gross_salary: salaries.reduce((sum, s) => sum + (s.gross_salary || 0), 0),
      total_net_salary: salaries.reduce((sum, s) => sum + (s.net_salary || 0), 0),
      average_salary: 0,
      managers_count: salaries.filter((s) => s.role === "Manager").length,
      staff_count: salaries.filter((s) => s.role === "Staff").length,
      highest_salary: Math.max(...salaries.map((s) => s.current_salary)),
      lowest_salary: Math.min(...salaries.map((s) => s.current_salary)),
    };

    stats.average_salary = (stats.total_gross_salary / stats.total_employees).toFixed(2);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error("Error in getSalaryStatsByBranch:", err);
    res.status(500).json({
      success: false,
      message: "Server error while calculating salary statistics.",
      error: err.message,
    });
  }
};