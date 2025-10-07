import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import LandingNavbar from "./components/LandingNavbar";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Inventory from "./pages/Inventory";
import Invoice from "./pages/Invoice";
import Reports from "./pages/Reports";
import Staff from "./pages/Staff";
import AboutUs from "./pages/AboutUs";
import Logout from "./pages/Logout";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Branch from "./pages/Branch";
import Attendance from "./pages/manager/Attendance";
import ManagerStaff from "./pages/manager/ManagerStaff";

// ✅ Dashboards
import ManagerDashboard from "./pages/ManagerDashboard";
import SuperAdminDashboard from "./pages/superAdminDashboard";
import StaffDashboard from "./pages/staffDashboard";

// ✅ Navbars
import ManagerNavbar from "./components/ManagerNavbar";
import StaffNavbar from "./components/StaffNavbar";

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

          {/* Global Navbar + Footer */}
          <Route
            path="/*"
            element={
              <>
                <Navbar />
                <Routes>
                  <Route path="/home" element={<Home />} />
                  <Route path="/superAdminDashboard" element={<SuperAdminDashboard />} />
                  <Route path="/staffDashboard" element={<StaffDashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/invoice" element={<Invoice />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/staff" element={<Staff />} />
                  <Route path="/branch" element={<Branch />} />
                  <Route path="/aboutus" element={<AboutUs />} />
                  <Route path="/logout" element={<Logout />} />
                </Routes>
                <Footer />
              </>
            }
          />

          {/* ✅ Manager Routes */}
          <Route
            path="/managerDashboard/*"
            element={
              <>
                <ManagerNavbar />
                <Routes>
                  <Route index element={<ManagerDashboard />} /> {/* default */}
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/managerstaff" element={<ManagerStaff/>}/>
                  <Route path="/aboutUs" element={<AboutUs />} />
                </Routes>
                <Footer />
              </>
            }
          />

          {/* ✅ Staff Routes */}
          <Route
            path="/staffDashboard/*"
            element={
              <>
                <StaffNavbar />
                <Routes>
                  <Route index element={<StaffDashboard />} />
                </Routes>
                <Footer />
              </>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
