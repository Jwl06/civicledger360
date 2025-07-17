import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Vehicle, Violation, ViolationType, ViolationStatus } from '../types';
import { useWeb3 } from './Web3Context';

interface DataContextType {
  vehicles: Vehicle[];
  violations: Violation[];
  userVehicles: Vehicle[];
  userViolations: Violation[];
  pendingViolations: Violation[];
  registerVehicle: (vehicleData: any) => Promise<void>;
  reportViolation: (violationData: any) => Promise<void>;
  reviewViolation: (violationId: number, status: ViolationStatus, fineAmount: number) => Promise<void>;
  isLoading: boolean;
  refreshData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Contract addresses - UPDATE THESE AFTER DEPLOYMENT
const CONTRACT_ADDRESSES = {
  CIVIC_TOKEN: '0x0000000000000000000000000000000000000000', // Update with deployed address
  VEHICLE_LEDGER: '0x0000000000000000000000000000000000000000', // Update with deployed address
  VIOLATION_CHAIN: '0x0000000000000000000000000000000000000000' // Update with deployed address
};

// Contract ABIs (simplified - you'll need the full ABIs from compilation)
const VEHICLE_LEDGER_ABI = [
  "function registerVehicle(string memory _hashedPlateNumber, string memory _hashedChassisId, string memory _hashedEngineNumber, string memory _ownerName, string memory _vehicleType) external returns (uint256)",
  "function getVehicle(uint256 _vehicleId) external view returns (tuple(string hashedPlateNumber, string hashedChassisId, string hashedEngineNumber, string ownerName, string vehicleType, uint256 registrationDate, bool isActive, address ownerAddress))",
  "function getUserVehicles(address _user) external view returns (uint256[])",
  "function verifyVehicleOwnership(uint256 _vehicleId, address _user) external view returns (bool)",
  "function vehicleCounter() external view returns (uint256)"
];

const VIOLATION_CHAIN_ABI = [
  "function reportViolation(uint256 _vehicleId, uint8 _violationType, string memory _description, string memory _ipfsHash) external returns (uint256)",
  "function reviewViolation(uint256 _violationId, uint8 _status, uint256 _fineAmount) external",
  "function getViolation(uint256 _violationId) external view returns (tuple(uint256 id, address reporter, uint256 vehicleId, uint8 violationType, string description, string ipfsHash, uint256 timestamp, uint8 status, address reviewer, uint256 reviewTimestamp, uint256 fineAmount, bool isPaid))",
  "function getUserReports(address _user) external view returns (uint256[])",
  "function getPendingViolations() external view returns (uint256[])",
  "function violationCounter() external view returns (uint256)"
];

const CIVIC_TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function mint(address to, uint256 amount) external",
  "function decimals() external view returns (uint8)"
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { account, signer, provider, isConnected } = useWeb3();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Contract instances
  const getVehicleLedgerContract = () => {
    if (!signer) throw new Error('Wallet not connected');
    return new ethers.Contract(CONTRACT_ADDRESSES.VEHICLE_LEDGER, VEHICLE_LEDGER_ABI, signer);
  };

  const getViolationChainContract = () => {
    if (!signer) throw new Error('Wallet not connected');
    return new ethers.Contract(CONTRACT_ADDRESSES.VIOLATION_CHAIN, VIOLATION_CHAIN_ABI, signer);
  };

  const getCivicTokenContract = () => {
    if (!provider) throw new Error('Provider not available');
    return new ethers.Contract(CONTRACT_ADDRESSES.CIVIC_TOKEN, CIVIC_TOKEN_ABI, provider);
  };

  // Hash function for sensitive data
  const hashString = (input: string): string => {
    return ethers.keccak256(ethers.toUtf8Bytes(input));
  };

  const registerVehicle = async (vehicleData: any) => {
    if (!account || !signer) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    try {
      const contract = getVehicleLedgerContract();
      
      // Hash sensitive data
      const hashedPlateNumber = hashString(vehicleData.plateNumber);
      const hashedChassisId = hashString(vehicleData.chassisId);
      const hashedEngineNumber = hashString(vehicleData.engineNumber);

      console.log('Registering vehicle with hashed data...');
      
      const tx = await contract.registerVehicle(
        hashedPlateNumber,
        hashedChassisId,
        hashedEngineNumber,
        vehicleData.ownerName,
        vehicleData.vehicleType
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Vehicle registered successfully:', receipt);

      // Refresh data after successful registration
      await refreshData();
    } catch (error) {
      console.error('Error registering vehicle:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const reportViolation = async (violationData: any) => {
    if (!account || !signer) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    try {
      const contract = getViolationChainContract();
      
      // Simulate IPFS hash (in real implementation, upload to IPFS first)
      const ipfsHash = `QmX${Math.random().toString(36).substr(2, 9)}`;

      console.log('Reporting violation...');
      
      const tx = await contract.reportViolation(
        violationData.vehicleId,
        violationData.violationType,
        violationData.description,
        ipfsHash
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Violation reported successfully:', receipt);

      // Refresh data after successful report
      await refreshData();
    } catch (error) {
      console.error('Error reporting violation:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const reviewViolation = async (violationId: number, status: ViolationStatus, fineAmount: number) => {
    if (!account || !signer) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    try {
      const contract = getViolationChainContract();
      
      console.log('Reviewing violation...');
      
      const tx = await contract.reviewViolation(
        violationId,
        status,
        ethers.parseEther(fineAmount.toString()) // Convert to wei if needed
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Violation reviewed successfully:', receipt);

      // Refresh data after successful review
      await refreshData();
    } catch (error) {
      console.error('Error reviewing violation:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserVehicles = async () => {
    if (!account || !provider) return;

    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.VEHICLE_LEDGER, VEHICLE_LEDGER_ABI, provider);
      const vehicleIds = await contract.getUserVehicles(account);
      
      const vehiclePromises = vehicleIds.map(async (id: bigint) => {
        const vehicleData = await contract.getVehicle(id);
        return {
          id: Number(id),
          hashedPlateNumber: vehicleData.hashedPlateNumber,
          hashedChassisId: vehicleData.hashedChassisId,
          hashedEngineNumber: vehicleData.hashedEngineNumber,
          ownerName: vehicleData.ownerName,
          vehicleType: vehicleData.vehicleType,
          registrationDate: Number(vehicleData.registrationDate) * 1000, // Convert to milliseconds
          isActive: vehicleData.isActive,
          ownerAddress: vehicleData.ownerAddress
        };
      });

      const userVehicles = await Promise.all(vehiclePromises);
      setVehicles(userVehicles);
    } catch (error) {
      console.error('Error loading user vehicles:', error);
    }
  };

  const loadUserViolations = async () => {
    if (!account || !provider) return;

    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.VIOLATION_CHAIN, VIOLATION_CHAIN_ABI, provider);
      const violationIds = await contract.getUserReports(account);
      
      const violationPromises = violationIds.map(async (id: bigint) => {
        const violationData = await contract.getViolation(id);
        return {
          id: Number(violationData.id),
          reporter: violationData.reporter,
          vehicleId: Number(violationData.vehicleId),
          violationType: violationData.violationType,
          description: violationData.description,
          ipfsHash: violationData.ipfsHash,
          timestamp: Number(violationData.timestamp) * 1000, // Convert to milliseconds
          status: violationData.status,
          reviewer: violationData.reviewer,
          reviewTimestamp: Number(violationData.reviewTimestamp) * 1000,
          fineAmount: Number(ethers.formatEther(violationData.fineAmount)),
          isPaid: violationData.isPaid
        };
      });

      const userViolations = await Promise.all(violationPromises);
      setViolations(userViolations);
    } catch (error) {
      console.error('Error loading user violations:', error);
    }
  };

  const loadPendingViolations = async () => {
    if (!provider) return;

    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.VIOLATION_CHAIN, VIOLATION_CHAIN_ABI, provider);
      const pendingIds = await contract.getPendingViolations();
      
      const violationPromises = pendingIds.map(async (id: bigint) => {
        const violationData = await contract.getViolation(id);
        return {
          id: Number(violationData.id),
          reporter: violationData.reporter,
          vehicleId: Number(violationData.vehicleId),
          violationType: violationData.violationType,
          description: violationData.description,
          ipfsHash: violationData.ipfsHash,
          timestamp: Number(violationData.timestamp) * 1000,
          status: violationData.status,
          reviewer: violationData.reviewer,
          reviewTimestamp: Number(violationData.reviewTimestamp) * 1000,
          fineAmount: Number(ethers.formatEther(violationData.fineAmount)),
          isPaid: violationData.isPaid
        };
      });

      const pendingViolations = await Promise.all(violationPromises);
      // Add pending violations to the violations array
      setViolations(prev => {
        const existingIds = new Set(prev.map(v => v.id));
        const newViolations = pendingViolations.filter(v => !existingIds.has(v.id));
        return [...prev, ...newViolations];
      });
    } catch (error) {
      console.error('Error loading pending violations:', error);
    }
  };

  const refreshData = async () => {
    if (!isConnected) return;
    
    console.log('Refreshing blockchain data...');
    await Promise.all([
      loadUserVehicles(),
      loadUserViolations(),
      loadPendingViolations()
    ]);
  };

  // Load data when wallet connects
  useEffect(() => {
    if (isConnected && account) {
      refreshData();
    }
  }, [isConnected, account]);

  // Filter data based on user
  const userVehicles = vehicles.filter(v => v.ownerAddress?.toLowerCase() === account?.toLowerCase());
  const userViolations = violations.filter(v => v.reporter?.toLowerCase() === account?.toLowerCase());
  const pendingViolations = violations.filter(v => v.status === ViolationStatus.PENDING);

  const value = {
    vehicles,
    violations,
    userVehicles,
    userViolations,
    pendingViolations,
    registerVehicle,
    reportViolation,
    reviewViolation,
    isLoading,
    refreshData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};