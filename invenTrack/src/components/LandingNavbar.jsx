// src/components/LandingNavbar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./../styles/Landingnavbar.css";

function LandingNavbar() {
  const navigate = useNavigate();

  return (
    <nav className="landing-navbar">
      <div className="logo">InvenTrack</div>
      <div className="landing-nav-links">
        <button onClick={() => navigate("/")}>Home</button>
        <button onClick={() => navigate("/login")}>Login</button>
        <button onClick={() => navigate("/signup")}>Sign Up</button>
      </div>
    </nav>
  );
}

export default LandingNavbar;
