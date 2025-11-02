import { useState } from "react";
import "../styles/Login.css";

function Login() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSecurityKey, setShowSecurityKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  return (
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
  );
}

export default Login;