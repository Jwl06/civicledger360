const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(uploadsDir));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'violation-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

// In-memory storage (replace with database in production)
let violations = [];
let vehicles = [];

// Generate mock AI analysis
function generateAIAnalysis(violationType, description) {
  const confidenceBase = Math.floor(Math.random() * 20) + 75; // 75-95%
  const detections = {
    0: 'No helmet detected on motorcycle rider',
    1: 'License plate tampering detected',
    2: 'Vehicle speed exceeding limit detected',
    3: 'Illegal parking violation detected',
    4: 'Traffic rule violation detected'
  };
  
  return {
    confidence: confidenceBase / 100,
    detectedViolation: detections[violationType] || 'Traffic violation detected',
    vehicleDetected: true,
    analysisTimestamp: new Date().toISOString(),
    riskLevel: confidenceBase > 85 ? 'HIGH' : confidenceBase > 70 ? 'MEDIUM' : 'LOW',
    additionalNotes: `AI analysis completed with ${confidenceBase}% confidence. ${description ? 'Description matches detected violation pattern.' : ''}`
  };
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Civic Violation Backend Server is running',
    timestamp: new Date().toISOString(),
    totalViolations: violations.length
  });
});

// Get all violations with filtering
app.get('/api/violations', (req, res) => {
  try {
    const { status, reporter, limit } = req.query;
    let filteredViolations = [...violations];
    
    // Filter by status
    if (status) {
      filteredViolations = filteredViolations.filter(v => v.status === status);
    }
    
    // Filter by reporter
    if (reporter) {
      filteredViolations = filteredViolations.filter(v => 
        v.reporter && v.reporter.toLowerCase() === reporter.toLowerCase()
      );
    }
    
    // Limit results
    if (limit) {
      filteredViolations = filteredViolations.slice(0, parseInt(limit));
    }
    
    // Sort by timestamp (newest first)
    filteredViolations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
      success: true,
      data: filteredViolations,
      total: filteredViolations.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching violations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch violations',
      error: error.message
    });
  }
});

// Get pending violations specifically for officers
app.get('/api/violations/pending', (req, res) => {
  try {
    const pendingViolations = violations.filter(v => v.status === 'pending');
    
    res.json({
      success: true,
      data: pendingViolations,
      total: pendingViolations.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching pending violations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending violations',
      error: error.message
    });
  }
});

// Submit new violation with Greenfield integration
app.post('/api/violations', (req, res) => {
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
        message: 'Missing required fields: reporter, vehicleId, violationType, description'
      });
    }

    // Generate AI analysis
    const aiAnalysis = generateAIAnalysis(violationType, description);

    const newViolation = {
      id: violations.length + 1,
      reporter: reporter,
      vehicleId: parseInt(vehicleId),
      violationType: parseInt(violationType),
      description: description,
      location: location || 'Location not specified',
      greenfieldUrl: greenfieldUrl || null,
      evidenceUrl: greenfieldUrl || null,
      blockchainTxHash: blockchainTxHash || null,
      aiAnalysis: aiAnalysis,
      status: 'pending',
      timestamp: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      fineAmount: 0,
      isPaid: false,
      reviewer: null,
      reviewTimestamp: null,
      reviewNotes: ''
    };

    violations.push(newViolation);

    console.log('New violation submitted:', {
      id: newViolation.id,
      reporter: newViolation.reporter,
      violationType: newViolation.violationType,
      hasEvidence: !!newViolation.greenfieldUrl
    });

    res.status(201).json({
      success: true,
      message: 'Violation submitted successfully',
      data: newViolation
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

// Review violation (for officers)
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

    // Update violation
    violations[violationIndex] = {
      ...violations[violationIndex],
      status: status,
      reviewer: reviewer,
      fineAmount: fineAmount || 0,
      reviewNotes: reviewNotes || '',
      reviewTimestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Violation reviewed:', {
      id: violations[violationIndex].id,
      status: violations[violationIndex].status,
      reviewer: violations[violationIndex].reviewer,
      fineAmount: violations[violationIndex].fineAmount
    });

    res.json({
      success: true,
      message: 'Violation reviewed successfully',
      data: violations[violationIndex]
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

// Get violations by reporter address
app.get('/api/violations/reporter/:address', (req, res) => {
  try {
    const { address } = req.params;
    const userViolations = violations.filter(v => 
      v.reporter && v.reporter.toLowerCase() === address.toLowerCase()
    );
    
    res.json({
      success: true,
      data: userViolations,
      total: userViolations.length
    });
  } catch (error) {
    console.error('Error fetching user violations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user violations',
      error: error.message
    });
  }
});

// Upload evidence file (alternative to Greenfield)
app.post('/api/upload', upload.single('evidence'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
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
      totalFines: violations.reduce((sum, v) => sum + (v.fineAmount || 0), 0),
      averageConfidence: violations.length > 0 
        ? violations.reduce((sum, v) => sum + (v.aiAnalysis?.confidence || 0), 0) / violations.length 
        : 0,
      violationTypes: {
        helmet: violations.filter(v => v.violationType === 0).length,
        plateTampering: violations.filter(v => v.violationType === 1).length,
        speeding: violations.filter(v => v.violationType === 2).length,
        wrongParking: violations.filter(v => v.violationType === 3).length,
        other: violations.filter(v => v.violationType === 4).length
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
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
    const { owner } = req.query;
    let filteredVehicles = [...vehicles];
    
    if (owner) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.ownerAddress && v.ownerAddress.toLowerCase() === owner.toLowerCase()
      );
    }
    
    res.json({
      success: true,
      data: filteredVehicles,
      total: filteredVehicles.length
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
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
        message: 'Missing required fields: plateNumber, ownerName, vehicleType'
      });
    }

    const newVehicle = {
      id: vehicles.length + 1,
      plateNumber,
      ownerName,
      vehicleType,
      model: model || '',
      year: year || new Date().getFullYear(),
      ownerAddress: ownerAddress || '',
      registeredAt: new Date().toISOString(),
      isActive: true
    };

    vehicles.push(newVehicle);

    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully',
      data: newVehicle
    });
  } catch (error) {
    console.error('Error registering vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register vehicle',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Civic Violation Backend Server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📁 File uploads: http://localhost:${PORT}/uploads/`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /api/violations - Get all violations`);
  console.log(`   GET  /api/violations/pending - Get pending violations`);
  console.log(`   POST /api/violations - Submit new violation`);
  console.log(`   PUT  /api/violations/:id/review - Review violation`);
  console.log(`   POST /api/upload - Upload evidence file`);
  console.log(`   GET  /api/statistics - Get violation statistics`);
});

module.exports = app;