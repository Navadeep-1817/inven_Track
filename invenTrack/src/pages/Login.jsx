// import { useState } from "react";
// import "../styles/Login.css";

// function Login() {
//   const [isSuperAdmin, setIsSuperAdmin] = useState(false);
//   const [form, setForm] = useState({
//     name: "",
//     branch_id: "",
//     employee_id: "",
//     role: "Staff",
//     password: "",
//     securityKey: "",
//   });

//   const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

//   const handleLogin = async (e) => {
//     e.preventDefault();

//     if (isSuperAdmin) {
//       // Superadmin login
//       const res = await fetch("http://localhost:5000/api/auth/login-superadmin", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ securityKey: form.securityKey }),
//       });
//       const data = await res.json();

//       if (res.ok) {
//         window.location.href = "/superAdminDashboard";
//       } // else {
//       //   alert(data.message);
//       // }
//     } else {
//       // Manager/Staff login
//       const res = await fetch("http://localhost:5000/api/auth/login-employee", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           name: form.name,
//           branch_id: form.branch_id,
//           employee_id: form.employee_id,
//           role: form.role,
//           password: form.password,
//         }),
//       });
//       const data = await res.json();

//       if (res.ok) { 
//         if (data.dashboard === "managerDashboard") {
//           window.location.href = "/managerDashboard";
//         } else if (data.dashboard === "staffDashboard") {
//           window.location.href = "/staffDashboard";
//         }
//       } else {
//         alert(data.message);
//       }
//     }
//   };

//   return (
//     <form className="login-form" onSubmit={handleLogin}>
//       <label className="admin-check">
//         <input
//           type="checkbox"
//           checked={isSuperAdmin}
//           onChange={() => setIsSuperAdmin(!isSuperAdmin)}
//         />
//         Are you an Admin?
//       </label>

//       {isSuperAdmin ? (
//         <>
//           <input
//             type="password"
//             name="securityKey"
//             placeholder="Enter Superadmin Security Key"
//             value={form.securityKey}
//             onChange={handleChange}
//             required
//           />
//         </>
//       ) : (
//         <>
//           {/* ✅ Added Name Field */}
//           <input
//             name="name"
//             placeholder="Full Name"
//             value={form.name}
//             onChange={handleChange}
//             required
//           />

//           <input
//             name="branch_id"
//             placeholder="Branch ID"
//             value={form.branch_id}
//             onChange={handleChange}
//             required
//           />
//           <input
//             name="employee_id"
//             placeholder="Employee ID"
//             value={form.employee_id}
//             onChange={handleChange}
//             required
//           />
//           <select name="role" value={form.role} onChange={handleChange}>
//             <option value="Manager">Manager</option>
//             <option value="Staff">Staff</option>
//           </select>
//           <input
//             name="password"
//             type="password"
//             placeholder="Password"
//             value={form.password}
//             onChange={handleChange}
//             required
//           />
//         </>
//       )}

//       <button type="submit">Login</button>
//     </form>
//   );
// }

// export default Login;



import { useState } from "react";
import "../styles/Login.css";

function Login() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
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
          return;
        }

        // ✅ Store token if provided
        if (data.token) {
          localStorage.setItem("token", data.token);
        }

        window.location.href = "/superAdminDashboard";
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
        }
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Server error. Please try again later.");
    }
  };

  return (
    <form className="login-form" onSubmit={handleLogin}>
      <label className="admin-check">
        <input
          type="checkbox"
          checked={isSuperAdmin}
          onChange={() => setIsSuperAdmin(!isSuperAdmin)}
        />
        Are you an Admin?
      </label>

      {isSuperAdmin ? (
        <>
          <input
            type="password"
            name="securityKey"
            placeholder="Enter Superadmin Security Key"
            value={form.securityKey}
            onChange={handleChange}
            required
          />
        </>
      ) : (
        <>
          <input
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            name="branch_id"
            placeholder="Branch ID"
            value={form.branch_id}
            onChange={handleChange}
            required
          />

          <input
            name="employee_id"
            placeholder="Employee ID"
            value={form.employee_id}
            onChange={handleChange}
            required
          />

          <select name="role" value={form.role} onChange={handleChange}>
            <option value="Manager">Manager</option>
            <option value="Staff">Staff</option>
          </select>

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </>
      )}

      <button type="submit">Login</button>
    </form>
  );
}

export default Login;
