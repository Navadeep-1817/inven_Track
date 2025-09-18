import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ Clear any stored authentication info
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // ✅ Redirect to login page
    navigate("/");
  }, [navigate]);

  return null; // nothing to render, just handles logout
}

export default Logout;
