import React from "react";
import "../styles/Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-left">
        <h3>InvenTrack</h3>
        <p>Smart Inventory Management System</p>
      </div>

      <div className="footer-center">
        <p>&copy; {new Date().getFullYear()} InvenTrack. All Rights Reserved.</p>
      </div>

      <div className="footer-right">
        <a href="https://www.facebook.com" target="_blank" rel="noreferrer">
          Facebook
        </a>
        <a href="https://www.twitter.com" target="_blank" rel="noreferrer">
          Twitter
        </a>
        <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">
          LinkedIn
        </a>
      </div>
    </footer>
  );
}

export default Footer;
