// src/utils/axiosInstance.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`, // ✅ Uses environment variable
});

// 🔐 Automatically attach token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ⚠️ Optional: global error logger
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ API Error:", error.response?.data || error.message);
    // You can also redirect to login on 401 errors:
    // if (error.response?.status === 401) window.location.href = "/login";
    return Promise.reject(error);
  }
);

export default axiosInstance;
