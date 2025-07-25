import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Camera, MapPin, User, DollarSign, RefreshCw, Eye } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useWeb3 } from '../contexts/Web3Context';
import { ViolationStatus, ViolationType } from '../types';
import { apiService } from '../services/apiService';

const ViolationReview: React.FC = () => {
  const { pendingViolations, reviewViolation, isLoading } = useData();
  const { account } = useWeb3();
  const [selectedViolation, setSelectedViolation] = useState<number | null>(null);
  const [fineAmount, setFineAmount] = useState<number>(0);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [backendViolations, setBackendViolations] = useState<any[]>([]);
  const [loadingBackend, setLoadingBackend] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const violationTypeLabels = {
    [ViolationType.HELMET_VIOLATION]: 'Helmet Violation',
    [ViolationType.PLATE_TAMPERING]: 'Plate Tampering',
    [ViolationType.SPEEDING]: 'Speeding',
    [ViolationType.WRONG_PARKING]: 'Wrong Parking',
    [ViolationType.OTHER]: 'Other'
  };

  // Load violations from backend
  const loadBackendViolations = async () => {
    setLoadingBackend(true);
    try {
      const violations = await apiService.getPendingViolations();
      console.log('Loaded violations from backend:', violations);
      setBackendViolations(violations);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading backend violations:', error);
      setBackendViolations([]);
    } finally {
      setLoadingBackend(false);
    }
  };

  useEffect(() => {
    loadBackendViolations();
    // Refresh every 30 seconds
    const interval = setInterval(loadBackendViolations, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleReview = async (violationId: number, status: ViolationStatus) => {
    if (!account) {
      alert('Please connect your wallet');
      return;
    }

    try {
      // Update in backend first
      await apiService.reviewViolation(violationId, {
        status: status === ViolationStatus.APPROVED ? 'approved' : 'rejected',
        reviewer: account,
        fineAmount: status === ViolationStatus.APPROVED ? fineAmount : 0,
        reviewNotes
      });

      // Then update blockchain
      await reviewViolation(violationId, status, status === ViolationStatus.APPROVED ? fineAmount : 0);
      
      setSelectedViolation(null);
      setFineAmount(0);
      setReviewNotes('');
      
      // Refresh backend violations
      await loadBackendViolations();
    } catch (error) {
      console.error('Review failed:', error);
      alert('Failed to review violation. Please try again.');
    }
  };

  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openEvidenceInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  // Combine blockchain and backend violations
  const allPendingViolations = [
    ...pendingViolations,
    ...backendViolations.filter(bv => 
      !pendingViolations.some(pv => pv.id === bv.id)
    ).map(bv => ({
      id: bv.id,
      reporter: bv.reporterAddress || bv.reporter,
      vehicleId: bv.vehicleId,
      violationType: bv.violationType,
      description: bv.description,
      ipfsHash: bv.greenfieldUrl || bv.evidenceUrl || '',
      timestamp: typeof bv.submittedAt === 'string' ? new Date(bv.submittedAt).getTime() : bv.timestamp,
      status: ViolationStatus.PENDING,
      reviewer: '',
      reviewTimestamp: 0,
      fineAmount: 0,
      isPaid: false,
      location: bv.location,
      aiAnalysis: bv.aiAnalysis
    }))
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Review Violations</h1>
            <p className="mt-2 text-gray-600">
              Review and approve/reject violation reports from citizens
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <button
              onClick={loadBackendViolations}
              disabled={loadingBackend}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingBackend ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Clock className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Real-time Backend Integration
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Violations are automatically loaded from the backend API. Evidence photos are stored on BNB Greenfield 
                and accessible for review. The system refreshes every 30 seconds to show new submissions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {allPendingViolations.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pending violations</h3>
          <p className="mt-1 text-sm text-gray-500">
            All violation reports have been reviewed.
          </p>
          <button
            onClick={loadBackendViolations}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Check for New Reports
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {allPendingViolations.map((violation) => (
            <div key={violation.id} className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <span className="ml-2 text-sm font-medium text-yellow-800">
                      Pending Review
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    Report #{violation.id}
                  </span>
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {violationTypeLabels[violation.violationType]}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Vehicle ID: {violation.vehicleId}
                    </p>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-1" />
                    <span>Reporter: {formatAddress(violation.reporter)}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Reported: {formatDate(violation.timestamp)}</span>
                  </div>

                  {violation.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>Location: {violation.location}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description:
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                      {violation.description}
                    </p>
                  </div>

                  {violation.aiAnalysis && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">AI Analysis</h4>
                      <div className="text-sm text-blue-700">
                        <p>Confidence: {(violation.aiAnalysis.confidence * 100).toFixed(1)}%</p>
                        <p>Detection: {violation.aiAnalysis.detectedViolation}</p>
                        <p>Vehicle Detected: {violation.aiAnalysis.vehicleDetected ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  )}

                  {violation.ipfsHash && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-green-700">
                          <Camera className="h-4 w-4 mr-1" />
                          <span>Evidence stored on Greenfield</span>
                        </div>
                        <button
                          onClick={() => openEvidenceInNewTab(violation.ipfsHash)}
                          className="inline-flex items-center px-2 py-1 border border-green-300 text-xs font-medium rounded text-green-700 bg-white hover:bg-green-50"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Evidence
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedViolation === violation.id && (
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <div>
                        <label htmlFor={`fine-${violation.id}`} className="block text-sm font-medium text-gray-700">
                          Fine Amount (₹)
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="number"
                            id={`fine-${violation.id}`}
                            value={fineAmount}
                            onChange={(e) => setFineAmount(Number(e.target.value))}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                            placeholder="0"
                            min="0"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor={`notes-${violation.id}`} className="block text-sm font-medium text-gray-700">
                          Review Notes (Optional)
                        </label>
                        <textarea
                          id={`notes-${violation.id}`}
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          rows={3}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          placeholder="Add any notes about your decision..."
                        />
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleReview(violation.id, ViolationStatus.APPROVED)}
                          disabled={isLoading}
                          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview(violation.id, ViolationStatus.REJECTED)}
                          disabled={isLoading}
                          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedViolation(null);
                          setFineAmount(0);
                          setReviewNotes('');
                        }}
                        className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {selectedViolation !== violation.id && (
                <div className="bg-gray-50 px-6 py-3">
                  <button
                    onClick={() => setSelectedViolation(violation.id)}
                    className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Review this violation
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViolationReview;