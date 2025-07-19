const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (replace with database in production)
let violations = [];
let violationCounter = 1;

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

// Routes

// Get all violations
app.get('/api/violations', (req, res) => {
  res.json(violations);
});

// Get violations by status
app.get('/api/violations/status/:status', (req, res) => {
  const { status } = req.params;
  const filteredViolations = violations.filter(v => v.status === status);
  res.json(filteredViolations);
});

// Get violations by reporter
app.get('/api/violations/reporter/:address', (req, res) => {
  const { address } = req.params;
  const userViolations = violations.filter(v => 
    v.reporter.toLowerCase() === address.toLowerCase()
  );
  res.json(userViolations);
});

// Submit new violation
app.post('/api/violations', upload.single('evidence'), async (req, res) => {
  try {
    const {
      reporter,
      vehicleId,
      violationType,
      description,
      location,
      greenfieldUrl,
      blockchainTxHash
    } = req.body;

    const violation = {
      id: violationCounter++,
      reporter,
      vehicleId: parseInt(vehicleId),
      violationType: parseInt(violationType),
      description,
      location,
      evidenceUrl: greenfieldUrl,
      blockchainTxHash,
      timestamp: Date.now(),
      status: 'pending',
      reviewer: null,
      reviewTimestamp: null,
      fineAmount: 0,
      isPaid: false,
      aiAnalysis: null
    };

    // Simulate AI analysis
    if (greenfieldUrl) {
      violation.aiAnalysis = await simulateAIAnalysis(violationType);
    }

    violations.push(violation);

    res.status(201).json({
      success: true,
      violation,
      message: 'Violation submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting violation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit violation',
      error: error.message
    });
  }
});

// Update violation status (for officers)
app.put('/api/violations/:id/review', (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewer, fineAmount, reviewNotes } = req.body;

    const violationIndex = violations.findIndex(v => v.id === parseInt(id));
    
    if (violationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Violation not found'
      });
    }

    violations[violationIndex] = {
      ...violations[violationIndex],
      status,
      reviewer,
      reviewTimestamp: Date.now(),
      fineAmount: fineAmount || 0,
      reviewNotes
    };

    res.json({
      success: true,
      violation: violations[violationIndex],
      message: 'Violation reviewed successfully'
    });
  } catch (error) {
    console.error('Error reviewing violation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review violation',
      error: error.message
    });
  }
});

// Get violation statistics
app.get('/api/statistics', (req, res) => {
  const stats = {
    total: violations.length,
    pending: violations.filter(v => v.status === 'pending').length,
    approved: violations.filter(v => v.status === 'approved').length,
    rejected: violations.filter(v => v.status === 'rejected').length,
    totalFines: violations
      .filter(v => v.status === 'approved')
      .reduce((sum, v) => sum + v.fineAmount, 0),
    recentViolations: violations
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
  };

  res.json(stats);
});

// Simulate AI analysis
async function simulateAIAnalysis(violationType) {
  const analyses = {
    0: { // HELMET_VIOLATION
      confidence: 0.85 + Math.random() * 0.15,
      detectedObjects: ['motorcycle', 'rider', 'no_helmet'],
      riskLevel: 'high',
      description: 'AI detected motorcycle rider without helmet'
    },
    1: { // PLATE_TAMPERING
      confidence: 0.75 + Math.random() * 0.20,
      detectedObjects: ['vehicle', 'license_plate', 'tampering'],
      riskLevel: 'medium',
      description: 'AI detected potential license plate tampering'
    },
    2: { // SPEEDING
      confidence: 0.90 + Math.random() * 0.10,
      detectedObjects: ['vehicle', 'speed_indicator'],
      riskLevel: 'high',
      description: 'AI detected vehicle exceeding speed limit'
    },
    3: { // WRONG_PARKING
      confidence: 0.80 + Math.random() * 0.15,
      detectedObjects: ['vehicle', 'parking_zone', 'violation'],
      riskLevel: 'low',
      description: 'AI detected improper parking violation'
    },
    4: { // OTHER
      confidence: 0.70 + Math.random() * 0.20,
      detectedObjects: ['vehicle', 'traffic_violation'],
      riskLevel: 'medium',
      description: 'AI detected general traffic violation'
    }
  };

  return analyses[violationType] || analyses[4];
}

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});