import React from "react";
import "../styles/AboutUs.css";

function AboutUs() {
  const features = [
    {
      title: "Inventory Management",
      description: "Easily track, add, update, and delete stock items across branches.",
    },
    {
      title: "Billing & Invoices",
      description: "Generate GST-compliant bills and download invoices in PDF format.",
    },
    {
      title: "Staff Management",
      description: "Manage staff attendance, salaries, and role-based access control.",
    },
    {
      title: "Reports & Analytics",
      description: "View stock, sales, and performance reports with insights.",
    },
    {
      title: "Supplier Tracking",
      description: "Track suppliers, purchase history, and manage payments.",
    },
    {
      title: "Low Stock Alerts",
      description: "Get notified when items reach minimum stock levels.",
    },
    {
      title: "Taxing",
      description: "Automated GST calculations and tax reports.",
    },
    {
      title: "profit & Loss",
      description: "Brand wise detailed profit-loss analysis .",
    },
  ];

  return (
    <div className="home-container">
      <h1 className="home-title">Welcome to InvenTrack</h1>
      <p className="home-subtitle">Smart Buisiness Management System</p>

      <div className="card-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AboutUs;
