import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers, BrowserProvider } from 'ethers';

// Contract addresses - UPDATE THESE AFTER DEPLOYMENT
const CONTRACT_ADDRESSES = {
  CIVIC_TOKEN: '0x0000000000000000000000000000000000000000', // Update with deployed address
  VEHICLE_LEDGER: '0x0000000000000000000000000000000000000000', // Update with deployed address
  VIOLATION_CHAIN: '0x0000000000000000000000000000000000000000' // Update with deployed address
};

const CIVIC_TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

const VIOLATION_CHAIN_ABI = [
  "function isOfficer(address) external view returns (bool)"
];

interface Web3ContextType {
  account: string | null;
  provider: BrowserProvider | null;
  signer: ethers.Signer | null;
  isConnected: boolean;
  isOfficer: boolean;
  tokenBalance: number;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isOfficer, setIsOfficer] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);

  const loadTokenBalance = async (userAddress: string, provider: BrowserProvider) => {
    try {
      if (CONTRACT_ADDRESSES.CIVIC_TOKEN === '0x0000000000000000000000000000000000000000') {
        // Mock data if contracts not deployed
        setTokenBalance(Math.floor(Math.random() * 1000));
        return;
      }

      const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES.CIVIC_TOKEN, CIVIC_TOKEN_ABI, provider);
      const balance = await tokenContract.balanceOf(userAddress);
      const decimals = await tokenContract.decimals();
      setTokenBalance(Number(ethers.formatUnits(balance, decimals)));
    } catch (error) {
      console.error('Error loading token balance:', error);
      setTokenBalance(0);
    }
  };

  const checkOfficerStatus = async (userAddress: string, provider: BrowserProvider) => {
    try {
      if (CONTRACT_ADDRESSES.VIOLATION_CHAIN === '0x0000000000000000000000000000000000000000') {
        // Mock data if contracts not deployed
        setIsOfficer(userAddress.toLowerCase().includes('officer') || Math.random() > 0.8);
        return;
      }

      const violationContract = new ethers.Contract(CONTRACT_ADDRESSES.VIOLATION_CHAIN, VIOLATION_CHAIN_ABI, provider);
      const officerStatus = await violationContract.isOfficer(userAddress);
      setIsOfficer(officerStatus);
    } catch (error) {
      console.error('Error checking officer status:', error);
      setIsOfficer(false);
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        // Request account access
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length === 0) {
          throw new Error('No accounts found');
        }

        const signer = await provider.getSigner();
        setProvider(provider);
        setSigner(signer);
        setAccount(accounts[0]);
        setIsConnected(true);
        
        // Load real blockchain data
        await Promise.all([
          loadTokenBalance(accounts[0], provider),
          checkOfficerStatus(accounts[0], provider)
        ]);

        console.log('Wallet connected successfully:', accounts[0]);
      } else {
        alert('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setIsOfficer(false);
    setTokenBalance(0);
  };

  useEffect(() => {
    // Check if already connected
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          connectWallet();
        }
      });

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    // Cleanup listeners
    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  const value = {
    account,
    provider,
    signer,
    isConnected,
    isOfficer,
    tokenBalance,
    connectWallet,
    disconnectWallet
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};