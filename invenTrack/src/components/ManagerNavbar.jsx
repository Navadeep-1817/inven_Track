import React from "react";
import { useNavigate } from "react-router-dom";
import "./../styles/Navbar.css";

function ManagerNavbar() {
  const navigate = useNavigate();

  return (
    <nav className="main-navbar">
      <div className="navbar-left">
        <div className="logo">InvenTrack</div>
        <button onClick={() => navigate("/managerDashboard")}>Home</button>
        <button onClick={() => navigate("/managerDashboard/attendance")}>Attendance</button>
      </div>
      <div className="navbar-right">
        <button onClick={() => navigate("/logout")}>Logout</button>
      </div>
    </nav>
  );
}

export default ManagerNavbar;
