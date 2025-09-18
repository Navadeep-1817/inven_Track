// import React from "react";
// import { Link } from "react-router-dom";
// import "./../styles/Navbar.css";

// function Navbar() {
//   return (
//     <nav className="navbar">
//       <div className="navbar-left">
//         <Link to="/home">Home</Link>
//         <Link to="/dashboard">Dashboard</Link>
//         <Link to="/inventory">Inventory</Link>
//         <Link to="/invoice">Invoice</Link>
//         <Link to="/reports">Reports</Link>
//         <Link to="/staff">Staff</Link>
//       </div>
//       <div className="navbar-right">
//         <Link to="/aboutus">About Us</Link>
//         <Link to="/logout">Logout</Link>
//       </div>
//     </nav>
//   );
// }

// export default Navbar;
  // src/components/Navbar.jsx
  import React from "react";
  import { useNavigate } from "react-router-dom";
  import "./../styles/Navbar.css";

  function Navbar() {
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
          <button onClick={() => navigate("/branch")}>Branch</button>
        </div>
        <div className="navbar-right">
          <button onClick={() => navigate("/aboutus")}>About Us</button>
          <button onClick={() => navigate("/logout")}>Logout</button>
        </div>
      </nav>
    );
  }

  export default Navbar;
