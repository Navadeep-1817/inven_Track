import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import components
import Navbar from "./components/Navbar.jsx";
import LandingNavbar from "./components/LandingNavbar.jsx";
import Landing from "./pages/Landing.jsx";
import Home from "./pages/Home.jsx";
import Inventory from "./pages/Inventory.jsx";
import Invoice from "./pages/Invoice.jsx";
import Reports from "./pages/Reports.jsx";
import Staff from "./pages/Staff.jsx";
import AboutUs from "./pages/AboutUs.jsx";
import Logout from "./pages/Logout.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/SignUp.jsx";
import Dashboard from "./pages/DashBoard.jsx";
import Branch from "./pages/Branch.jsx";
import LowStockAlerts from "./pages/LowStockAlerts.jsx";

// Import Manager pages
import Attendance from "./pages/manager/Attendance.jsx";
import ManagerStaff from "./pages/manager/ManagerStaff.jsx";
import ManageInventory from "./pages/manager/ManagerInventory.jsx";

// Import Dashboards
import ManagerDashboard from "./pages/ManagerDashboard.jsx";
import SuperAdminDashboard from "./pages/superAdminDashboard.jsx";
import StaffDashboard from "./pages/staffDashboard.jsx";

// Import Role-specific Navbars
import ManagerNavbar from "./components/ManagerNavbar.jsx";
import StaffNavbar from "./components/StaffNavbar.jsx";
import ManagerLowStockAlerts from "./pages/manager/ManagerLowStockAlerts.jsx";

import StaffInventory from "./pages/staff/StaffInventory.jsx";
import StaffAlerts from "./pages/staff/StaffAlerts.jsx";
import StaffBilling from "./pages/staff/StaffBilling.jsx";
import StaffBillsHistory from "./pages/staff/StaffBillsHistory.jsx";

function App() {
  return (
    <Router>
      <div className="content">
        <Routes>
          {/* Landing page */}
          <Route path="/" element={<Landing />} />

          {/* Login & Signup with LandingNavbar */}
          <Route
            path="/login"
            element={
              <>
                <LandingNavbar />
                <Login />
              </>
            }
          />
          <Route
            path="/signup"
            element={
              <>
                <LandingNavbar />
                <Signup />
              </>
            }
          />

          {/* Global Navbar + Footer (SuperAdmin/Default) */}
          <Route
            path="/*"
            element={
              <>
                <Navbar />
                <Routes>
                  <Route path="/home" element={<Home />} />
                  <Route path="/superAdminDashboard" element={<SuperAdminDashboard />} />
                  {/* Note: /staffDashboard is defined below with its own navbar. This route might be redundant or intended as a fallback. */}
                  <Route path="/staffDashboard" element={<StaffDashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/invoice" element={<Invoice />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/lowStockAlerts" element={<LowStockAlerts />} />
                  <Route path="/staff" element={<Staff />} />
                  <Route path="/branch" element={<Branch />} />
                  <Route path="/aboutus" element={<AboutUs />} />
                  <Route path="/logout" element={<Logout />} />
                </Routes>
                {/* Footer might be conditionally rendered based on route */}
              </>
            }
          />

          {/* Manager Routes */}
          <Route
            path="/managerDashboard/*"
            element={
              <>
                <ManagerNavbar />
                <Routes>
                  <Route index element={<ManagerDashboard />} /> {/* Default route for /managerDashboard */}
                  <Route path="attendance" element={<Attendance />} />
                  <Route path="managerstaff" element={<ManagerStaff />} />
                  <Route path="managerInventory" element={<ManageInventory />} />
                  <Route path="managerLowStockAlerts" element={<ManagerLowStockAlerts/>} />
                  <Route path="aboutUs" element={<AboutUs />} />
                </Routes>
                {/* Manager-specific footer? */}
              </>
            }
          />

          {/* Staff Routes */}
          <Route
            path="/staffDashboard/*"
            element={
              <>
                <StaffNavbar />
                <Routes>
                  <Route index element={<StaffDashboard />} /> 
                  <Route path="staffInventory" element={<StaffInventory/>}/>
                  <Route path="staffAlerts" element={<StaffAlerts/>}/>
                  <Route path="staffBilling" element={<StaffBilling/>}/>
                  <Route path="staffBillsHistory" element={<StaffBillsHistory/>}/>
                </Routes>
      
              </>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

