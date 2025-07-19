const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for violations (replace with database in production)
let violations = [];
let violationIdCounter = 1;

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Routes

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
      error: 'Failed to fetch violations'
    });
  }
});

// Get violation by ID
app.get('/api/violations/:id', (req, res) => {
  try {
    const violation = violations.find(v => v.id === parseInt(req.params.id));
    if (!violation) {
      return res.status(404).json({
        success: false,
        error: 'Violation not found'
      });
    }
    res.json({
      success: true,
      data: violation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch violation'
    });
  }
});

// Submit new violation
app.post('/api/violations', upload.single('evidence'), (req, res) => {
  try {
    const {
      vehicleNumber,
      violationType,
      location,
      description,
      reporterAddress,
      greenfieldUrl,
      blockchainTxHash
    } = req.body;

    // Simulate AI analysis
    const aiAnalysis = {
      confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
      detectedViolation: violationType,
      vehicleDetected: true,
      locationVerified: true,
      timestamp: new Date().toISOString()
    };

    const newViolation = {
      id: violationIdCounter++,
      vehicleNumber,
      violationType,
      location,
      description,
      reporterAddress,
      greenfieldUrl,
      blockchainTxHash,
      aiAnalysis,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null
    };

    violations.push(newViolation);

    res.status(201).json({
      success: true,
      data: newViolation,
      message: 'Violation submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting violation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit violation'
    });
  }
});

// Update violation status (for officer review)
app.put('/api/violations/:id/review', (req, res) => {
  try {
    const { status, reviewNotes, reviewerAddress } = req.body;
    const violationIndex = violations.findIndex(v => v.id === parseInt(req.params.id));

    if (violationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Violation not found'
      });
    }

    violations[violationIndex] = {
      ...violations[violationIndex],
      status,
      reviewNotes,
      reviewedBy: reviewerAddress,
      reviewedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: violations[violationIndex],
      message: 'Violation reviewed successfully'
    });
  } catch (error) {
    console.error('Error reviewing violation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to review violation'
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
      avgConfidence: violations.length > 0 
        ? violations.reduce((sum, v) => sum + v.aiAnalysis.confidence, 0) / violations.length 
        : 0
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

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});