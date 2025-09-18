// In your routes/api.js or a new file like routes/mapsRoutes.js

const express = require('express');
const router = express.Router();

// Load environment variables from .env
require('dotenv').config();

// A route to provide the API key
router.get('/google-maps-key', (req, res) => {
  // You can add authentication middleware here to protect the endpoint
  res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY });
});

module.exports = router;