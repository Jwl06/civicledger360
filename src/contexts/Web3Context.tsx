import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers, BrowserProvider } from 'ethers';

// Contract addresses - UPDATE THESE AFTER DEPLOYMENT
const CONTRACT_ADDRESSES = {
  CIVIC_TOKEN: '0x34683DAC607aF1e60f019552A672c33337133F64', // Update with deployed address
  VEHICLE_LEDGER: '0x3274EB89645e982366fd0CBD4DA94EB45D59fc77', // Update with deployed address
  VIOLATION_CHAIN: '0xf33bc070DC136064A2d438a5322a59EFfa5B88a4' // Update with deployed address
};

const CIVIC_TOKEN_ABI = [
  {
				"inputs": [],
				"stateMutability": "nonpayable",
				"type": "constructor"
			},
			{
				"anonymous": false,
				"inputs": [
					{
						"indexed": true,
						"internalType": "address",
						"name": "owner",
						"type": "address"
					},
					{
						"indexed": true,
						"internalType": "address",
						"name": "spender",
						"type": "address"
					},
					{
						"indexed": false,
						"internalType": "uint256",
						"name": "value",
						"type": "uint256"
					}
				],
				"name": "Approval",
				"type": "event"
			},
			{
				"anonymous": false,
				"inputs": [
					{
						"indexed": true,
						"internalType": "address",
						"name": "from",
						"type": "address"
					},
					{
						"indexed": true,
						"internalType": "address",
						"name": "to",
						"type": "address"
					},
					{
						"indexed": false,
						"internalType": "uint256",
						"name": "value",
						"type": "uint256"
					}
				],
				"name": "Transfer",
				"type": "event"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "tokenOwner",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "spender",
						"type": "address"
					}
				],
				"name": "allowance",
				"outputs": [
					{
						"internalType": "uint256",
						"name": "",
						"type": "uint256"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "spender",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "amount",
						"type": "uint256"
					}
				],
				"name": "approve",
				"outputs": [
					{
						"internalType": "bool",
						"name": "",
						"type": "bool"
					}
				],
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "account",
						"type": "address"
					}
				],
				"name": "balanceOf",
				"outputs": [
					{
						"internalType": "uint256",
						"name": "",
						"type": "uint256"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [],
				"name": "decimals",
				"outputs": [
					{
						"internalType": "uint8",
						"name": "",
						"type": "uint8"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "to",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "amount",
						"type": "uint256"
					}
				],
				"name": "mint",
				"outputs": [],
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"inputs": [],
				"name": "name",
				"outputs": [
					{
						"internalType": "string",
						"name": "",
						"type": "string"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [],
				"name": "owner",
				"outputs": [
					{
						"internalType": "address",
						"name": "",
						"type": "address"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "_violationChain",
						"type": "address"
					}
				],
				"name": "setViolationChain",
				"outputs": [],
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"inputs": [],
				"name": "symbol",
				"outputs": [
					{
						"internalType": "string",
						"name": "",
						"type": "string"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [],
				"name": "totalSupply",
				"outputs": [
					{
						"internalType": "uint256",
						"name": "",
						"type": "uint256"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "recipient",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "amount",
						"type": "uint256"
					}
				],
				"name": "transfer",
				"outputs": [
					{
						"internalType": "bool",
						"name": "",
						"type": "bool"
					}
				],
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "sender",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "recipient",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "amount",
						"type": "uint256"
					}
				],
				"name": "transferFrom",
				"outputs": [
					{
						"internalType": "bool",
						"name": "",
						"type": "bool"
					}
				],
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"inputs": [],
				"name": "violationChain",
				"outputs": [
					{
						"internalType": "address",
						"name": "",
						"type": "address"
					}
				],
				"stateMutability": "view",
				"type": "function"
			}
];

const VIOLATION_CHAIN_ABI = [
  {
				"inputs": [
					{
						"internalType": "address",
						"name": "_civicToken",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "_vehicleLedger",
						"type": "address"
					}
				],
				"stateMutability": "nonpayable",
				"type": "constructor"
			},
			{
				"anonymous": false,
				"inputs": [
					{
						"indexed": true,
						"internalType": "uint256",
						"name": "violationId",
						"type": "uint256"
					},
					{
						"indexed": true,
						"internalType": "uint256",
						"name": "vehicleId",
						"type": "uint256"
					},
					{
						"indexed": false,
						"internalType": "uint256",
						"name": "amount",
						"type": "uint256"
					}
				],
				"name": "FineIssued",
				"type": "event"
			},
			{
				"anonymous": false,
				"inputs": [
					{
						"indexed": true,
						"internalType": "address",
						"name": "reporter",
						"type": "address"
					},
					{
						"indexed": false,
						"internalType": "uint256",
						"name": "amount",
						"type": "uint256"
					}
				],
				"name": "RewardIssued",
				"type": "event"
			},
			{
				"anonymous": false,
				"inputs": [
					{
						"indexed": true,
						"internalType": "uint256",
						"name": "violationId",
						"type": "uint256"
					},
					{
						"indexed": true,
						"internalType": "address",
						"name": "reporter",
						"type": "address"
					},
					{
						"indexed": true,
						"internalType": "uint256",
						"name": "vehicleId",
						"type": "uint256"
					},
					{
						"indexed": false,
						"internalType": "enum ViolationChain.ViolationType",
						"name": "violationType",
						"type": "uint8"
					}
				],
				"name": "ViolationReported",
				"type": "event"
			},
			{
				"anonymous": false,
				"inputs": [
					{
						"indexed": true,
						"internalType": "uint256",
						"name": "violationId",
						"type": "uint256"
					},
					{
						"indexed": true,
						"internalType": "address",
						"name": "reviewer",
						"type": "address"
					},
					{
						"indexed": false,
						"internalType": "enum ViolationChain.ViolationStatus",
						"name": "status",
						"type": "uint8"
					}
				],
				"name": "ViolationReviewed",
				"type": "event"
			},
			{
				"inputs": [],
				"name": "REWARD_AMOUNT",
				"outputs": [
					{
						"internalType": "uint256",
						"name": "",
						"type": "uint256"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "_officer",
						"type": "address"
					}
				],
				"name": "addOfficer",
				"outputs": [],
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"inputs": [],
				"name": "civicToken",
				"outputs": [
					{
						"internalType": "contract CivicToken",
						"name": "",
						"type": "address"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "uint256",
						"name": "",
						"type": "uint256"
					}
				],
				"name": "fines",
				"outputs": [
					{
						"internalType": "uint256",
						"name": "violationId",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "amount",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "dueDate",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "isPaid",
						"type": "bool"
					},
					{
						"internalType": "uint256",
						"name": "paidDate",
						"type": "uint256"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [],
				"name": "getPendingViolations",
				"outputs": [
					{
						"internalType": "uint256[]",
						"name": "",
						"type": "uint256[]"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "_user",
						"type": "address"
					}
				],
				"name": "getUserReports",
				"outputs": [
					{
						"internalType": "uint256[]",
						"name": "",
						"type": "uint256[]"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "uint256",
						"name": "_vehicleId",
						"type": "uint256"
					}
				],
				"name": "getVehicleViolations",
				"outputs": [
					{
						"internalType": "uint256[]",
						"name": "",
						"type": "uint256[]"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "uint256",
						"name": "_violationId",
						"type": "uint256"
					}
				],
				"name": "getViolation",
				"outputs": [
					{
						"components": [
							{
								"internalType": "uint256",
								"name": "id",
								"type": "uint256"
							},
							{
								"internalType": "address",
								"name": "reporter",
								"type": "address"
							},
							{
								"internalType": "uint256",
								"name": "vehicleId",
								"type": "uint256"
							},
							{
								"internalType": "enum ViolationChain.ViolationType",
								"name": "violationType",
								"type": "uint8"
							},
							{
								"internalType": "string",
								"name": "description",
								"type": "string"
							},
							{
								"internalType": "string",
								"name": "ipfsHash",
								"type": "string"
							},
							{
								"internalType": "uint256",
								"name": "timestamp",
								"type": "uint256"
							},
							{
								"internalType": "enum ViolationChain.ViolationStatus",
								"name": "status",
								"type": "uint8"
							},
							{
								"internalType": "address",
								"name": "reviewer",
								"type": "address"
							},
							{
								"internalType": "uint256",
								"name": "reviewTimestamp",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "fineAmount",
								"type": "uint256"
							},
							{
								"internalType": "bool",
								"name": "isPaid",
								"type": "bool"
							}
						],
						"internalType": "struct ViolationChain.Violation",
						"name": "",
						"type": "tuple"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "",
						"type": "address"
					}
				],
				"name": "isOfficer",
				"outputs": [
					{
						"internalType": "bool",
						"name": "",
						"type": "bool"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [],
				"name": "owner",
				"outputs": [
					{
						"internalType": "address",
						"name": "",
						"type": "address"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "uint256",
						"name": "_violationId",
						"type": "uint256"
					}
				],
				"name": "payFine",
				"outputs": [],
				"stateMutability": "payable",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "_officer",
						"type": "address"
					}
				],
				"name": "removeOfficer",
				"outputs": [],
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "uint256",
						"name": "_vehicleId",
						"type": "uint256"
					},
					{
						"internalType": "enum ViolationChain.ViolationType",
						"name": "_violationType",
						"type": "uint8"
					},
					{
						"internalType": "string",
						"name": "_description",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "_ipfsHash",
						"type": "string"
					}
				],
				"name": "reportViolation",
				"outputs": [
					{
						"internalType": "uint256",
						"name": "",
						"type": "uint256"
					}
				],
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "uint256",
						"name": "_violationId",
						"type": "uint256"
					},
					{
						"internalType": "enum ViolationChain.ViolationStatus",
						"name": "_status",
						"type": "uint8"
					},
					{
						"internalType": "uint256",
						"name": "_fineAmount",
						"type": "uint256"
					}
				],
				"name": "reviewViolation",
				"outputs": [],
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "",
						"type": "uint256"
					}
				],
				"name": "userReports",
				"outputs": [
					{
						"internalType": "uint256",
						"name": "",
						"type": "uint256"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "",
						"type": "address"
					}
				],
				"name": "userRewards",
				"outputs": [
					{
						"internalType": "uint256",
						"name": "",
						"type": "uint256"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [],
				"name": "vehicleLedger",
				"outputs": [
					{
						"internalType": "contract VehicleLedger",
						"name": "",
						"type": "address"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "uint256",
						"name": "",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "",
						"type": "uint256"
					}
				],
				"name": "vehicleViolations",
				"outputs": [
					{
						"internalType": "uint256",
						"name": "",
						"type": "uint256"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [],
				"name": "violationCounter",
				"outputs": [
					{
						"internalType": "uint256",
						"name": "",
						"type": "uint256"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "uint256",
						"name": "",
						"type": "uint256"
					}
				],
				"name": "violations",
				"outputs": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "reporter",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "vehicleId",
						"type": "uint256"
					},
					{
						"internalType": "enum ViolationChain.ViolationType",
						"name": "violationType",
						"type": "uint8"
					},
					{
						"internalType": "string",
						"name": "description",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "ipfsHash",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					},
					{
						"internalType": "enum ViolationChain.ViolationStatus",
						"name": "status",
						"type": "uint8"
					},
					{
						"internalType": "address",
						"name": "reviewer",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "reviewTimestamp",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "fineAmount",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "isPaid",
						"type": "bool"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [],
				"name": "withdraw",
				"outputs": [],
				"stateMutability": "nonpayable",
				"type": "function"
			}
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
      if (CONTRACT_ADDRESSES.CIVIC_TOKEN === '0x34683DAC607aF1e60f019552A672c33337133F64') {
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
      if (CONTRACT_ADDRESSES.VIOLATION_CHAIN === '0xf33bc070DC136064A2d438a5322a59EFfa5B88a4') {
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