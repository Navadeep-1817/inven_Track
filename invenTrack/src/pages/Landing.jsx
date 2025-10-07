import React, { useEffect } from "react";
import "../styles/Landing.css";
import { useNavigate } from "react-router-dom"; 

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    // Animate category cards on scroll
    const observerOptions = { root: null, rootMargin: "0px", threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = 1;
          entry.target.style.transform = "translateY(0)";
        }
      });
    }, observerOptions);

    const cards = document.querySelectorAll(".category-card");
    cards.forEach((card) => {
      card.style.opacity = 0;
      card.style.transform = "translateY(20px)";
      card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      observer.observe(card);
    });
  }, []);


  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">InvenTrack</div>
        <div className="nav-links">
          <a href="#">Inventory</a>
          <a href="#">Staff</a>
          <a href="#">Profit</a>
          <a href="#">Reports</a>
          <a href="#">Tax</a>
          <a href="#">Invoice</a>
        </div>
        <div className="auth-buttons">
          <button className="login-btn" onClick={() => navigate("/login")}>Login</button>
          <button className="signup-btn" onClick={() => navigate("/signup")}>
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Smart Inventory Management</h1>
          <p>Trusted by Thousands of Businesses</p>
          <button className="get-started-btn" onClick={() => navigate("/login")}>
            Get Started
          </button>
        </div>
      </div>

      {/* Categories Section */}
      <section className="categories">
        <h2 className="section-title">Management Categories</h2>
        <div className="category-grid">
          <div className="category-card">
            <div className="category-icon">
              <i className="fas fa-boxes"></i>
            </div>
            <div className="category-name">Inventory</div>
          </div>
          <div className="category-card">
            <div className="category-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="category-name">Staff</div>
          </div>
          <div className="category-card">
            <div className="category-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="category-name">Profit</div>
          </div>
          <div className="category-card">
            <div className="category-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <div className="category-name">Reports</div>
          </div>
          <div className="category-card">
            <div className="category-icon">
              <i className="fas fa-calculator"></i>
            </div>
            <div className="category-name">Tax</div>
          </div>
          <div className="category-card">
            <div className="category-icon">
              <i className="fas fa-receipt"></i>
            </div>
            <div className="category-name">Invoice</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2 className="section-title">Why Choose InvenTrack?</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Real-time Tracking</h3>
            <p>
              Monitor your inventory levels in real-time across all your
              business locations with our advanced tracking system.
            </p>
          </div>
          <div className="feature-card">
            <h3>Automated Reports</h3>
            <p>
              Generate detailed sales, profit, and inventory reports
              automatically with customizable scheduling options.
            </p>
          </div>
          <div className="feature-card">
            <h3>Multi-branch Support</h3>
            <p>
              Manage inventory across multiple branches from a single
              dashboard with role-based access control.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;
