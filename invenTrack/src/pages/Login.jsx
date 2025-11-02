import { useState } from "react";
import "../styles/Login.css";

function Login() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSecurityKey, setShowSecurityKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTesterManual, setShowTesterManual] = useState(false);
  const [form, setForm] = useState({
    name: "",
    branch_id: "",
    employee_id: "",
    role: "Manager",
    password: "",
    securityKey: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSuperAdmin) {
        // 🔐 Super Admin Login
        const res = await fetch("http://localhost:5000/api/auth/login-superadmin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ securityKey: form.securityKey }),
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Superadmin login failed");
          setIsLoading(false);
          return;
        }

        // ✅ Store token if provided
        if (data.token) {
          localStorage.setItem("token", data.token);
        }

        window.location.href = "/home";
      } else {
        // 👨‍💼 Manager / Staff Login
        const res = await fetch("http://localhost:5000/api/auth/login-employee", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            branch_id: form.branch_id,
            employee_id: form.employee_id,
            role: form.role,
            password: form.password,
          }),
        }); 

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Login failed");
          setIsLoading(false);
          return;
        }

        // ✅ Store JWT token in localStorage
        if (data.token) {
          localStorage.setItem("token", data.token);
        }

        // ✅ Redirect based on role/dashboard info
        if (data.dashboard === "managerDashboard") {
          window.location.href = "/managerDashboard";
        } else if (data.dashboard === "staffDashboard") {
          window.location.href = "/staffDashboard";
        } else {
          alert("Unknown dashboard type.");
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Server error. Please try again later.");
      setIsLoading(false);
    }
  };

  const fillManagerCredentials = () => {
    setIsSuperAdmin(false);
    setForm({
      name: "manager1",
      branch_id: "D-Mart-Vja-01",
      employee_id: "1",
      role: "Manager",
      password: "manager1",
      securityKey: "",
    });
  };

  const fillStaffCredentials = () => {
    setIsSuperAdmin(false);
    setForm({
      name: "staffvja1",
      branch_id: "D-Mart-Vja-01",
      employee_id: "2",
      role: "Staff",
      password: "staffvja1",
      securityKey: "",
    });
  };

  const fillSuperAdminCredentials = () => {
    setIsSuperAdmin(true);
    setForm({
      name: "",
      branch_id: "",
      employee_id: "",
      role: "Manager",
      password: "",
      securityKey: "gojo",
    });
  };

  return (
    <div>
      {/* Tester Manual Button - Now at the top */}
      <button 
        onClick={() => setShowTesterManual(!showTesterManual)}
        className="tester-manual-btn-lgn"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        {showTesterManual ? "Hide Tester Manual" : "Show Tester Manual"}
      </button>

      <form className="login-form-lgn" onSubmit={handleLogin}>
        <label className="admin-check-lgn">
          <input
            type="checkbox"
            checked={isSuperAdmin}
            onChange={() => setIsSuperAdmin(!isSuperAdmin)}
            disabled={isLoading}
          />
          Are you an Admin?
        </label>

        {isSuperAdmin ? (
          <div className="password-input-wrapper-lgn">
            <input
              type={showSecurityKey ? "text" : "password"}
              name="securityKey"
              placeholder="Enter Superadmin Security Key"
              value={form.securityKey}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
            <button
              type="button"
              className="toggle-password-lgn"
              onClick={() => setShowSecurityKey(!showSecurityKey)}
              aria-label={showSecurityKey ? "Hide security key" : "Show security key"}
              disabled={isLoading}
            >
              {showSecurityKey ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        ) : (
          <>
            <input
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              disabled={isLoading}
              required
            />

            <input
              name="branch_id"
              placeholder="Branch ID"
              value={form.branch_id}
              onChange={handleChange}
              disabled={isLoading}
              required
            />

            <input
              name="employee_id"
              placeholder="Employee ID"
              value={form.employee_id}
              onChange={handleChange}
              disabled={isLoading}
              required
            />

            <select 
              name="role" 
              value={form.role} 
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
            </select>

            <div className="password-input-wrapper-lgn">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="toggle-password-lgn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </>
        )}

        <button type="submit" disabled={isLoading} className="login-button-lgn">
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* Tester Manual Modal */}
      {showTesterManual && (
        <>
          <div className="modal-overlay-lgn" onClick={() => setShowTesterManual(false)}></div>
          <div className="tester-manual-modal-lgn">
            <div className="tester-manual-header-lgn">
              <h2>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                 Tester Manual - Demo Credentials
              </h2>
              <button 
                className="close-btn-lgn"
                onClick={() => setShowTesterManual(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="tester-manual-body-lgn">
              <div className="warning-banner-lgn">
                <p>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  ⚠️ IMPORTANT: Please DO NOT delete any branches! This is a shared demo environment.
                </p>
              </div>

              <div>
                <h3 style={{ color: "#1f2937", fontSize: "16px", marginBottom: "10px" }}>
                   Branch Ready to Test:
                </h3>
                <p style={{ fontWeight: "600", color: "#059669", margin: "0" }}>
                  Dmart Vijayawada (D-Mart-Vja-01)
                </p>
              </div>

              <div className="divider-lgn"></div>

              <div className="credential-section-lgn">
                <h3>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  🔐 Super Admin Credentials
                </h3>
                <div className="credential-details-lgn">
                  <p><strong>Security Key:</strong> gojo</p>
                </div>
                <button 
                  onClick={fillSuperAdminCredentials}
                  className="auto-fill-btn-lgn auto-fill-btn-superadmin-lgn"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <polyline points="17 11 19 13 23 9"/>
                  </svg>
                  Auto-fill Super Admin
                </button>
              </div>

              <div className="divider-lgn"></div>

              <div className="credential-section-lgn">
                <h3>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  👨‍💼 Manager Credentials
                </h3>
                <div className="credential-details-lgn">
                  <p><strong>Name:</strong> manager1</p>
                  <p><strong>Branch ID:</strong> D-Mart-Vja-01</p>
                  <p><strong>Employee ID:</strong> 1</p>
                  <p><strong>Role:</strong> Manager</p>
                  <p><strong>Password:</strong> manager1</p>
                </div>
                <button 
                  onClick={fillManagerCredentials}
                  className="auto-fill-btn-lgn auto-fill-btn-manager-lgn"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <polyline points="17 11 19 13 23 9"/>
                  </svg>
                  Auto-fill Manager
                </button>
              </div>

              <div className="divider-lgn"></div>

              <div className="credential-section-lgn">
                <h3>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  👨‍💻 Staff Credentials
                </h3>
                <div className="credential-details-lgn">
                  <p><strong>Name:</strong> staffvja1</p>
                  <p><strong>Branch ID:</strong> D-Mart-Vja-01</p>
                  <p><strong>Employee ID:</strong> 2</p>
                  <p><strong>Role:</strong> Staff</p>
                  <p><strong>Password:</strong> staffvja1</p>
                </div>
                <button 
                  onClick={fillStaffCredentials}
                  className="auto-fill-btn-lgn auto-fill-btn-staff-lgn"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <polyline points="17 11 19 13 23 9"/>
                  </svg>
                  Auto-fill Staff
                </button>
              </div>

              <div className="tip-banner-lgn">
                <p>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                  </svg>
                  💡 <strong>Tip:</strong> Click the "Auto-fill" buttons to quickly populate the login form with demo credentials.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Login;