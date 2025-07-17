import React, { useState } from 'react';
import { Web3Provider } from './contexts/Web3Context';
import { DataProvider } from './contexts/DataContext';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import VehicleRegistration from './components/VehicleRegistration';
import ViolationReport from './components/ViolationReport';
import ViolationReview from './components/ViolationReview';
import UserViolations from './components/UserViolations';
import { useWeb3 } from './contexts/Web3Context';

const AppContent: React.FC = () => {
  const { isConnected } = useWeb3();
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'register':
        return <VehicleRegistration />;
      case 'report':
        return <ViolationReport />;
      case 'review':
        return <ViolationReview />;
      case 'violations':
        return <UserViolations />;
      case 'reports':
        return <UserViolations />; // Same component for officers
      default:
        return <Dashboard />;
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation currentView={currentView} setCurrentView={setCurrentView} />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to CivicLedger 360</h2>
            <p className="text-gray-600 mb-6">
              A decentralized civic enforcement platform using blockchain, AI, and IoT to improve road safety in India.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Connect your wallet to get started with vehicle registration and violation reporting.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">Features:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Register vehicles on blockchain</li>
                <li>• Report traffic violations</li>
                <li>• Earn CIVIC tokens for valid reports</li>
                <li>• AI-powered violation detection</li>
                <li>• Government officer review system</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentView={currentView} setCurrentView={setCurrentView} />
      <main>{renderView()}</main>
    </div>
  );
};

function App() {
  return (
    <Web3Provider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </Web3Provider>
  );
}

export default App;