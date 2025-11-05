import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ import navigation
import "../styles/Signup.css";

function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    employee_id: "",
    branch_id: "",
    role: "Staff",
    password: "",
  });

  const navigate = useNavigate(); // ✅ initialize navigate

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || "Signup successful!");
        navigate("/login"); // ✅ redirect to login page
      } else {
        alert(data.message || "Signup failed. Try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <form className="signup-form" onSubmit={handleSignup}>
      <input
        name="name"
        placeholder="Full Name"
        value={form.name}
        onChange={handleChange}
        required
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
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
      <input
        name="branch_id"
        placeholder="Branch ID"
        value={form.branch_id}
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
      <button type="submit">Sign Up</button>
    </form>
  );
}

export default Signup;
