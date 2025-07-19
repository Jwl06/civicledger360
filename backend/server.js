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

// Mock AI analysis function
function generateAIAnalysis(violationType, description, evidenceUrl) {
  const analyses = {
    'illegal-parking': {
      analysis: 'Vehicle appears to be parked in a no-parking zone. Clear violation of parking regulations.',
      confidence: 0.92,
      details: ['No parking sign visible', 'Vehicle blocking traffic flow', 'Clear license plate visible']
    },
    'speeding': {
      analysis: 'Speed camera detected vehicle exceeding speed limit by significant margin.',
      confidence: 0.88,
      details: ['Speed: 65 mph in 35 mph zone', 'Clear weather conditions', 'No emergency situation evident']
    },
    'traffic-light': {
      analysis: 'Vehicle crossed intersection during red light phase.',
      confidence: 0.95,
      details: ['Red light clearly visible', 'Vehicle in intersection', 'No pedestrians in crosswalk']
    },
    'other': {
      analysis: 'Manual review required for this violation type.',
      confidence: 0.75,
      details: ['Custom violation reported', 'Evidence requires human assessment']
    }
  };

  return analyses[violationType] || analyses['other'];
}

// Routes

// Get all violations
app.get('/api/violations', (req, res) => {
  try {
    const { status, type, limit } = req.query;
    let filteredViolations = [...violations];

    if (status) {
      filteredViolations = filteredViolations.filter(v => v.status === status);
    }

    if (type) {
      filteredViolations = filteredViolations.filter(v => v.type === type);
    }

    if (limit) {
      filteredViolations = filteredViolations.slice(0, parseInt(limit));
    }

    // Sort by creation date (newest first)
    filteredViolations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: filteredViolations,
      total: filteredViolations.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch violations'
    });
  }
});

// Submit new violation
app.post('/api/violations', (req, res) => {
  try {
    const {
      type,
      description,
      location,
      vehicleNumber,
      evidenceUrl,
      reporterAddress,
      timestamp
    } = req.body;

    // Validation
    if (!type || !description || !location || !vehicleNumber || !evidenceUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Generate AI analysis
    const aiAnalysis = generateAIAnalysis(type, description, evidenceUrl);

    // Create new violation
    const violation = {
      id: uuidv4(),
      type,
      description,
      location,
      vehicleNumber,
      evidenceUrl,
      reporterAddress,
      timestamp: timestamp || new Date().toISOString(),
      status: 'pending',
      aiAnalysis,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    violations.push(violation);

    res.status(201).json({
      success: true,
      data: violation,
      message: 'Violation submitted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to submit violation'
    });
  }
});

// Update violation status (for officers)
app.put('/api/violations/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, fine, notes, officerAddress } = req.body;

    const violationIndex = violations.findIndex(v => v.id === id);
    
    if (violationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Violation not found'
      });
    }

    // Update violation
    violations[violationIndex] = {
      ...violations[violationIndex],
      status,
      fine,
      notes,
      officerAddress,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: violations[violationIndex],
      message: 'Violation updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update violation'
    });
  }
});

// Get violation statistics
app.get('/api/statistics', (req, res) => {
  try {
    const stats = {
      total: violations.length,
      pending: violations.filter(v => v.status === 'pending').length,
      approved: violations.filter(v => v.status === 'approved').length,
      rejected: violations.filter(v => v.status === 'rejected').length,
      totalFines: violations
        .filter(v => v.status === 'approved' && v.fine)
        .reduce((sum, v) => sum + parseFloat(v.fine || 0), 0)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Register vehicle
app.post('/api/vehicles', (req, res) => {
  try {
    const { vehicleNumber, ownerAddress, vehicleType, model } = req.body;

    if (!vehicleNumber || !ownerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle number and owner address are required'
      });
    }

    const vehicle = {
      id: uuidv4(),
      vehicleNumber,
      ownerAddress,
      vehicleType,
      model,
      registeredAt: new Date().toISOString()
    };

    vehicles.push(vehicle);

    res.status(201).json({
      success: true,
      data: vehicle,
      message: 'Vehicle registered successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to register vehicle'
    });
  }
});

// Get vehicles
app.get('/api/vehicles', (req, res) => {
  try {
    res.json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicles'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Civic Violation Backend running on port ${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});

module.exports = app;