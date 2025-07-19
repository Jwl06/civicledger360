import React from 'react';
import { Shield, Wallet, LogOut, Menu, X } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';

interface NavigationProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setCurrentView }) => {
  const { account, isConnected, isOfficer, tokenBalance, connectWallet, disconnectWallet } = useWeb3();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [networkStatus, setNetworkStatus] = React.useState<'correct' | 'wrong' | 'checking'>('checking');

  // Check network status
  React.useEffect(() => {
    const checkNetwork = async () => {
      if (typeof window.ethereum !== 'undefined' && isConnected) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          setNetworkStatus(chainId === '0x61' ? 'correct' : 'wrong'); // 0x61 = 97 (BSC Testnet)
        } catch (error) {
          console.error('Error checking network:', error);
          setNetworkStatus('wrong');
        }
      }
    };

    checkNetwork();

    // Listen for network changes
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('chainChanged', checkNetwork);
      return () => window.ethereum.removeListener('chainChanged', checkNetwork);
    }
  }, [isConnected]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const navItems = isOfficer ? [
    { id: 'dashboard', label: 'Officer Dashboard' },
    { id: 'review', label: 'Review Violations' },
    { id: 'reports', label: 'All Reports' }
  ] : [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'register', label: 'Register Vehicle' },
    { id: 'report', label: 'Report Violation' },
    { id: 'violations', label: 'My Reports' }
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">CivicLedger 360</span>
            </div>
            
            {isConnected && (
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`${
                      currentView === item.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center">
            {isConnected ? (
              <>
                {networkStatus === 'wrong' && (
                  <div className="hidden md:flex items-center bg-red-50 px-3 py-1 rounded-full mr-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-red-800">Wrong Network</span>
                  </div>
                )}
                {networkStatus === 'correct' && (
                  <div className="hidden md:flex items-center bg-green-50 px-3 py-1 rounded-full mr-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-green-800">BSC Testnet</span>
                  </div>
                )}
                <div className="hidden md:flex items-center space-x-4">
                  <div className="flex items-center bg-green-50 px-3 py-1 rounded-full">
                    <Wallet className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm font-medium text-green-800">{tokenBalance} CIVIC</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    {formatAddress(account!)}
                    {isOfficer && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Officer
                      </span>
                    )}
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
                
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 text-gray-500 hover:text-gray-700"
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isConnected && isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsMenuOpen(false);
                }}
                className={`${
                  currentView === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                } block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200`}
              >
                {item.label}
              </button>
            ))}
            
            <div className="border-t border-gray-200 pt-4 pb-2">
              {networkStatus === 'wrong' && (
                <div className="flex items-center bg-red-50 px-3 py-1 rounded-full mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-red-800">Please switch to BSC Testnet</span>
                </div>
              )}
              {networkStatus === 'correct' && (
                <div className="flex items-center bg-green-50 px-3 py-1 rounded-full mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-green-800">BSC Testnet Connected</span>
                </div>
              )}
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center bg-green-50 px-3 py-1 rounded-full">
                  <Wallet className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm font-medium text-green-800">{tokenBalance} CIVIC</span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
              <div className="px-3 py-1 text-sm text-gray-700">
                {formatAddress(account!)}
                {isOfficer && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Officer
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;