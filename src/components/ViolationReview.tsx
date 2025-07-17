import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Camera, MapPin, User, DollarSign } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ViolationStatus, ViolationType } from '../types';

const ViolationReview: React.FC = () => {
  const { pendingViolations, reviewViolation, isLoading } = useData();
  const [selectedViolation, setSelectedViolation] = useState<number | null>(null);
  const [fineAmount, setFineAmount] = useState<number>(0);

  const violationTypeLabels = {
    [ViolationType.HELMET_VIOLATION]: 'Helmet Violation',
    [ViolationType.PLATE_TAMPERING]: 'Plate Tampering',
    [ViolationType.SPEEDING]: 'Speeding',
    [ViolationType.WRONG_PARKING]: 'Wrong Parking',
    [ViolationType.OTHER]: 'Other'
  };

  const handleReview = async (violationId: number, status: ViolationStatus) => {
    try {
      await reviewViolation(violationId, status, status === ViolationStatus.APPROVED ? fineAmount : 0);
      setSelectedViolation(null);
      setFineAmount(0);
    } catch (error) {
      console.error('Review failed:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Review Violations</h1>
        <p className="mt-2 text-gray-600">
          Review and approve/reject violation reports from citizens
        </p>
      </div>

      {pendingViolations.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pending violations</h3>
          <p className="mt-1 text-sm text-gray-500">
            All violation reports have been reviewed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {pendingViolations.map((violation) => (
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description:
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                      {violation.description}
                    </p>
                  </div>

                  {violation.ipfsHash && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Camera className="h-4 w-4 mr-1" />
                      <span>Evidence: {violation.ipfsHash}</span>
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
                        onClick={() => setSelectedViolation(null)}
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