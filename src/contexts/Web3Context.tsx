import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

interface Web3ContextType {
  account: string | null;
  provider: ethers.providers.Web3Provider | null;
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

// Mock contract addresses for demo - replace with actual deployed addresses
const CONTRACT_ADDRESSES = {
  CIVIC_TOKEN: '0x742d35Cc7Ac9E1234567890123456789012345',
  VEHICLE_LEDGER: '0x742d35Cc7Ac9E1234567890123456789012346',
  VIOLATION_CHAIN: '0x742d35Cc7Ac9E1234567890123456789012347'
};

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isOfficer, setIsOfficer] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const signer = provider.getSigner();
        setProvider(provider);
        setSigner(signer);
        setAccount(accounts[0]);
        setIsConnected(true);
        
        // Mock data for demo
        setIsOfficer(accounts[0].toLowerCase().includes('officer') || Math.random() > 0.8);
        setTokenBalance(Math.floor(Math.random() * 1000));
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
    }
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