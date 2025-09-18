const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// Connect MongoDB Atlas
connectDB();

// Routes
const authRoutes = require("./routes/authRoutes");
const staffRoutes = require("./routes/staffRoutes");
const branchRoutes = require("./routes/branchRoutes");
const mapsRoutes = require('./routes/mapRoutes');

app.use("/api/auth", authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/branches', branchRoutes); 
app.use('/api', mapsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));