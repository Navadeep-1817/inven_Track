
  import React from "react";
  import { useNavigate } from "react-router-dom";
  import "./../styles/Navbar.css";

  function StaffNavbar() {
    const navigate = useNavigate();

    return (
      <nav className="main-navbar">
        <div className="navbar-left">
          <div className="logo">InvenTrack</div>    
          <button onClick={() => navigate("/home")}>Home</button>
          <button onClick={() => navigate("/dashboard")}>Dashboard</button>
          <button onClick={() => navigate("/inventory")}>Inventory</button>
          <button onClick={() => navigate("/invoice")}>Invoice</button>
          <button onClick={() => navigate("/reports")}>Reports</button>
          <button onClick={() => navigate("/staff")}>Staff</button>
        </div>
        <div className="navbar-right">
          <button onClick={() => navigate("/aboutus")}>About Us</button>
          <button onClick={() => navigate("/logout")}>Logout</button>
        </div>
      </nav>
    );
  }

  export default StaffNavbar;
