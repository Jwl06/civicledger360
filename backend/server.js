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

// Helper function to generate AI analysis
const generateAIAnalysis = (violationType, description) => {
  const confidenceBase = Math.random() * 0.4 + 0.6; // 60-100% confidence
  const detectionTypes = {
    0: 'Helmet not detected on rider',
    1: 'License plate tampering detected',
    2: 'Speed limit violation detected',
    3: 'Illegal parking detected',
    4: 'Traffic rule violation detected'
  };

  return {
    confidence: confidenceBase,
    detectedViolation: detectionTypes[violationType] || 'Violation detected',
    vehicleDetected: true,
    locationVerified: true,
    riskLevel: confidenceBase > 0.8 ? 'High' : confidenceBase > 0.6 ? 'Medium' : 'Low',
    timestamp: new Date().toISOString(),
    description: `AI detected ${detectionTypes[violationType]} with ${(confidenceBase * 100).toFixed(1)}% confidence`
  };
};

// Routes

// Get all violations with optional filters
app.get('/api/violations', (req, res) => {
  try {
    const { status, reporter } = req.query;
    let filteredViolations = violations;

    if (status) {
      filteredViolations = filteredViolations.filter(v => v.status === status);
    }

    if (reporter) {
      filteredViolations = filteredViolations.filter(v => 
        v.reporterAddress && v.reporterAddress.toLowerCase() === reporter.toLowerCase()
      );
    }

    res.json({
      success: true,
      data: filteredViolations,
      total: filteredViolations.length
    });
  } catch (error) {
    console.error('Error fetching violations:', error);
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
      reporter,
      vehicleId,
      violationType,
      description,
      location,
      greenfieldUrl,
      blockchainTxHash
    } = req.body;

    // Validate required fields
    if (!reporter || !vehicleId || violationType === undefined || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reporter, vehicleId, violationType, description'
      });
    }

    // Generate AI analysis
    const aiAnalysis = generateAIAnalysis(parseInt(violationType), description);

    const newViolation = {
      id: violationIdCounter++,
      reporterAddress: reporter,
      vehicleId: parseInt(vehicleId),
      violationType: parseInt(violationType),
      description,
      location: location || '',
      greenfieldUrl: greenfieldUrl || '',
      blockchainTxHash: blockchainTxHash || '',
      aiAnalysis,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null,
      fineAmount: 0,
      isPaid: false,
      timestamp: Date.now()
    };

    violations.push(newViolation);

    console.log('New violation submitted:', {
      id: newViolation.id,
      reporter: newViolation.reporterAddress,
      type: newViolation.violationType,
      hasEvidence: !!newViolation.greenfieldUrl
    });

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
    const { status, reviewNotes, reviewer, fineAmount } = req.body;
    const violationIndex = violations.findIndex(v => v.id === parseInt(req.params.id));

    if (violationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Violation not found'
      });
    }

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be either "approved" or "rejected"'
      });
    }

    violations[violationIndex] = {
      ...violations[violationIndex],
      status,
      reviewNotes: reviewNotes || '',
      reviewedBy: reviewer,
      reviewedAt: new Date().toISOString(),
      fineAmount: status === 'approved' ? (fineAmount || 0) : 0
    };

    console.log('Violation reviewed:', {
      id: violations[violationIndex].id,
      status,
      reviewer,
      fineAmount: violations[violationIndex].fineAmount
    });

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
        ? violations.reduce((sum, v) => sum + (v.aiAnalysis?.confidence || 0), 0) / violations.length 
        : 0,
      totalFines: violations
        .filter(v => v.status === 'approved')
        .reduce((sum, v) => sum + (v.fineAmount || 0), 0),
      recentSubmissions: violations
        .filter(v => {
          const submittedAt = new Date(v.submittedAt);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return submittedAt > oneDayAgo;
        }).length
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

// Upload evidence file (for direct file uploads)
app.post('/api/upload', upload.single('evidence'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // In production, upload to actual storage service
    const fileUrl = `http://localhost:${PORT}/uploads/${req.file.originalname}`;
    
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    violations: violations.length
  });
});

// Get violations by reporter
app.get('/api/violations/reporter/:address', (req, res) => {
  try {
    const reporterAddress = req.params.address.toLowerCase();
    const userViolations = violations.filter(v => 
      v.reporterAddress && v.reporterAddress.toLowerCase() === reporterAddress
    );

    res.json({
      success: true,
      data: userViolations,
      total: userViolations.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user violations'
    });
  }
});

// Get pending violations
app.get('/api/violations/status/pending', (req, res) => {
  try {
    const pendingViolations = violations.filter(v => v.status === 'pending');
    
    res.json({
      success: true,
      data: pendingViolations,
      total: pendingViolations.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending violations'
    });
  }
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
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 Total violations in memory: ${violations.length}`);
});