import React from 'react';
import { FileText, CheckCircle, XCircle, Clock, DollarSign, Camera } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ViolationStatus, ViolationType } from '../types';

const UserViolations: React.FC = () => {
  const { userViolations } = useData();

  const violationTypeLabels = {
    [ViolationType.HELMET_VIOLATION]: 'Helmet Violation',
    [ViolationType.PLATE_TAMPERING]: 'Plate Tampering',
    [ViolationType.SPEEDING]: 'Speeding',
    [ViolationType.WRONG_PARKING]: 'Wrong Parking',
    [ViolationType.OTHER]: 'Other'
  };

  const getStatusIcon = (status: ViolationStatus) => {
    switch (status) {
      case ViolationStatus.APPROVED:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case ViolationStatus.REJECTED:
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: ViolationStatus) => {
    switch (status) {
      case ViolationStatus.APPROVED:
        return 'Approved';
      case ViolationStatus.REJECTED:
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = (status: ViolationStatus) => {
    switch (status) {
      case ViolationStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case ViolationStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const approvedViolations = userViolations.filter(v => v.status === ViolationStatus.APPROVED);
  const pendingViolations = userViolations.filter(v => v.status === ViolationStatus.PENDING);
  const rejectedViolations = userViolations.filter(v => v.status === ViolationStatus.REJECTED);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Violation Reports</h1>
        <p className="mt-2 text-gray-600">
          Track your submitted violation reports and rewards
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Reports
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {userViolations.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Approved
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {approvedViolations.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tokens Earned
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {approvedViolations.length * 10}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {userViolations.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No reports yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start reporting violations to earn CIVIC tokens.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {userViolations.map((violation) => (
              <li key={violation.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getStatusIcon(violation.status)}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            Report #{violation.id} - {violationTypeLabels[violation.violationType]}
                          </p>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(violation.status)}`}>
                            {getStatusText(violation.status)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span>Vehicle ID: {violation.vehicleId}</span>
                          <span className="mx-2">•</span>
                          <span>{formatDate(violation.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {violation.status === ViolationStatus.APPROVED && violation.fineAmount > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            Fine: ₹{violation.fineAmount}
                          </p>
                          <p className="text-sm text-gray-500">
                            {violation.isPaid ? 'Paid' : 'Pending'}
                          </p>
                        </div>
                      )}
                      {violation.status === ViolationStatus.APPROVED && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            +10 CIVIC
                          </p>
                          <p className="text-sm text-gray-500">
                            Reward earned
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-700">
                      {violation.description}
                    </p>
                    {violation.ipfsHash && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <Camera className="h-4 w-4 mr-1" />
                        <span>Evidence: {violation.ipfsHash}</span>
                      </div>
                    )}
                  </div>

                  {violation.status !== ViolationStatus.PENDING && violation.reviewTimestamp > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Reviewed on {formatDate(violation.reviewTimestamp)}
                      </p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserViolations;