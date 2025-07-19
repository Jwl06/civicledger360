const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory storage (replace with database in production)
let violations = [];
let vehicles = [];

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Get all violations
app.get('/api/violations', (req, res) => {
  try {
    res.json({
      success: true,
      data: violations,
      total: violations.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch violations',
      error: error.message
    });
  }
});

// Submit new violation
app.post('/api/violations', (req, res) => {
  try {
    const {
      vehicleNumber,
      violationType,
      location,
      description,
      evidenceUrl,
      reporterAddress
    } = req.body;

    // Validate required fields
    if (!vehicleNumber || !violationType || !location || !evidenceUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Generate AI analysis (mock)
    const aiAnalysis = {
      confidence: Math.floor(Math.random() * 30) + 70, // 70-99%
      detectedViolation: violationType,
      vehicleDetected: true,
      plateNumber: vehicleNumber,
      analysis: `AI detected ${violationType.toLowerCase()} violation with high confidence. Vehicle plate ${vehicleNumber} clearly visible.`
    };

    const newViolation = {
      id: uuidv4(),
      vehicleNumber,
      violationType,
      location,
      description,
      evidenceUrl,
      reporterAddress,
      aiAnalysis,
      status: 'pending',
      timestamp: new Date().toISOString(),
      fine: 0,
      officerNotes: ''
    };

    violations.push(newViolation);

    res.status(201).json({
      success: true,
      message: 'Violation submitted successfully',
      data: newViolation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit violation',
      error: error.message
    });
  }
});

// Update violation status
app.put('/api/violations/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, fine, officerNotes } = req.body;

    const violationIndex = violations.findIndex(v => v.id === id);
    
    if (violationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Violation not found'
      });
    }

    violations[violationIndex] = {
      ...violations[violationIndex],
      status,
      fine: fine || violations[violationIndex].fine,
      officerNotes: officerNotes || violations[violationIndex].officerNotes,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Violation updated successfully',
      data: violations[violationIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update violation',
      error: error.message
    });
  }
});

// Get violation statistics
app.get('/api/violations/stats', (req, res) => {
  try {
    const stats = {
      total: violations.length,
      pending: violations.filter(v => v.status === 'pending').length,
      approved: violations.filter(v => v.status === 'approved').length,
      rejected: violations.filter(v => v.status === 'rejected').length,
      totalFines: violations.reduce((sum, v) => sum + (v.fine || 0), 0)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// Vehicle registration endpoints
app.get('/api/vehicles', (req, res) => {
  try {
    res.json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles',
      error: error.message
    });
  }
});

app.post('/api/vehicles', (req, res) => {
  try {
    const {
      plateNumber,
      ownerName,
      vehicleType,
      model,
      year,
      ownerAddress
    } = req.body;

    if (!plateNumber || !ownerName || !vehicleType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const newVehicle = {
      id: uuidv4(),
      plateNumber,
      ownerName,
      vehicleType,
      model,
      year,
      ownerAddress,
      registeredAt: new Date().toISOString()
    };

    vehicles.push(newVehicle);

    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully',
      data: newVehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to register vehicle',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;