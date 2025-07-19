import React from 'react';
import { Car, FileText, Coins, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { useData } from '../contexts/DataContext';
import { ViolationStatus } from '../types';

const Dashboard: React.FC = () => {
  const { account, isOfficer, tokenBalance } = useWeb3();
  const { userVehicles, userViolations, pendingViolations } = useData();
  const [networkWarning, setNetworkWarning] = React.useState(false);

  // Check if user is on correct network
  React.useEffect(() => {
    const checkNetwork = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          setNetworkWarning(chainId !== '0x61'); // 0x61 = 97 (BSC Testnet)
        } catch (error) {
          setNetworkWarning(true);
        }
      }
    };

    checkNetwork();
  }, []);

  const approvedViolations = userViolations.filter(v => v.status === ViolationStatus.APPROVED);
  const rejectedViolations = userViolations.filter(v => v.status === ViolationStatus.REJECTED);
  const pendingUserViolations = userViolations.filter(v => v.status === ViolationStatus.PENDING);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getViolationStatusIcon = (status: ViolationStatus) => {
    switch (status) {
      case ViolationStatus.APPROVED:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case ViolationStatus.REJECTED:
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getViolationStatusText = (status: ViolationStatus) => {
    switch (status) {
      case ViolationStatus.APPROVED:
        return 'Approved';
      case ViolationStatus.REJECTED:
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  if (isOfficer) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Officer Dashboard</h1>
          <p className="mt-2 text-gray-600">Review and manage violation reports</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Reviews
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {pendingViolations.length}
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
                      Total Approved Today
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {Math.floor(Math.random() * 20) + 5}
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
                  <Coins className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Fines Collected
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ₹{(Math.floor(Math.random() * 50000) + 10000).toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Pending Violations
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Latest violation reports requiring review
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {pendingViolations.slice(0, 5).map((violation) => (
              <li key={violation.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        Violation #{violation.id}
                      </div>
                      <div className="text-sm text-gray-500">
                        Vehicle ID: {violation.vehicleId} • {formatDate(violation.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getViolationStatusIcon(violation.status)}
                    <span className="text-sm text-gray-500">
                      {getViolationStatusText(violation.status)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to CivicLedger 360</p>
      </div>

      {networkWarning && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Network Configuration Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Please switch to BNB Smart Chain Testnet to perform transactions. 
                  Click "Connect Wallet" to automatically switch networks.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Car className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Registered Vehicles
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {userVehicles.length}
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
                <FileText className="h-6 w-6 text-green-400" />
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
                <Coins className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    CIVIC Tokens
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {tokenBalance}
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
                    Approved Reports
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {approvedViolations.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              My Vehicles
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your registered vehicles
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {userVehicles.length > 0 ? (
              userVehicles.map((vehicle) => (
                <li key={vehicle.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Car className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {vehicle.vehicleType}
                        </div>
                        <div className="text-sm text-gray-500">
                          Owner: {vehicle.ownerName}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Registered {formatDate(vehicle.registrationDate)}
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-4 text-center text-gray-500">
                No vehicles registered yet
              </li>
            )}
          </ul>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Reports
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your latest violation reports
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {userViolations.length > 0 ? (
              userViolations.slice(0, 5).map((violation) => (
                <li key={violation.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          Report #{violation.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(violation.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getViolationStatusIcon(violation.status)}
                      <span className="text-sm text-gray-500">
                        {getViolationStatusText(violation.status)}
                      </span>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-4 text-center text-gray-500">
                No reports submitted yet
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;