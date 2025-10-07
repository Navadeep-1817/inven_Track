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
// ✅ Import dashboards
import ManagerDashboard from "./pages/managerDashboard";
import SuperAdminDashboard from "./pages/superAdminDashboard";
import StaffDashboard from "./pages/staffDashboard";
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

          {/* Other pages with global Navbar + Footer */}
          <Route
            path="/*"
            element={
              <>
                <Navbar />
                <Routes>
                  <Route path="/home" element={<Home />} />
                  
                  <Route path="/superAdminDashboard" element={<SuperAdminDashboard />} />
                  <Route path="/managerDashboard" element={<ManagerDashboard />} />
                  <Route path="/staffDashboard" element={<StaffDashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/invoice" element={<Invoice />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/staff" element={<Staff />} />
                  <Route path="/branch" element={<Branch />} />
                  <Route path="/aboutus" element={<AboutUs />} />
                  <Route path="/logout" element={<Logout />} />
                  <Route path="/attendance" element={<Attendance />} />
                </Routes>
                <Footer />
              </>
            }
          />
          <Route path="/managerDashboard" element={
            <>
              <ManagerNavbar />
              <ManagerDashboard />
              <Footer />
            </>
          } />
          <Route path="/staffDashboard" element={
            <>
              <StaffNavbar />
              <StaffDashboard />
              <Footer />
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
