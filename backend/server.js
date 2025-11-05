const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
dotenv.config();
const app = express();
app.use(express.json());

// CORS Configuration
const allowedOrigins = [
  "https://inven-track-4895.vercel.app", // Your Vercel frontend
  "http://localhost:3000", // Local development
  "http://127.0.0.1:3000", // Alternative local
  "http://localhost:5173", // Vite dev server
  "http://127.0.0.1:5173", // Vite alternative
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) === -1) {
      console.error(`❌ CORS blocked origin: ${origin}`);
      console.log('Allowed origins:', allowedOrigins);
      // Return false instead of Error object
      return callback(null, false);
    }
    
    console.log(`✅ CORS allowed origin: ${origin}`);
    return callback(null, true);
  },
  credentials: true, // Allow cookies/auth headers
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

connectDB();

// Routes
const authRoutes = require("./routes/authRoutes");
const staffRoutes = require("./routes/staffRoutes");
const branchRoutes = require("./routes/branchRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const billRoutes = require('./routes/billRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const appraisalRoutes = require("./routes/appraisalRoutes");
const salaryRoutes = require("./routes/salaryRoutes");
const managerRoutes = require("./routes/managerRoutes");

app.use("/api/auth", authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/branches', branchRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/complaints', complaintRoutes);
app.use("/api/appraisals", appraisalRoutes);
app.use("/api/salaries", salaryRoutes);
app.use('/api/manager', managerRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));