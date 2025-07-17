import React, { createContext, useContext, useState, useEffect } from 'react';
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

// Mock data for demo
const mockVehicles: Vehicle[] = [
  {
    id: 1,
    hashedPlateNumber: '0x123abc...',
    hashedChassisId: '0x456def...',
    hashedEngineNumber: '0x789ghi...',
    ownerName: 'John Doe',
    vehicleType: 'Motorcycle',
    registrationDate: Date.now() - 86400000,
    isActive: true,
    ownerAddress: '0x742d35Cc7Ac9E1234567890123456789012345'
  }
];

const mockViolations: Violation[] = [
  {
    id: 1,
    reporter: '0x742d35Cc7Ac9E1234567890123456789012345',
    vehicleId: 1,
    violationType: ViolationType.HELMET_VIOLATION,
    description: 'Rider not wearing helmet on MG Road',
    ipfsHash: 'QmX123...',
    timestamp: Date.now() - 3600000,
    status: ViolationStatus.PENDING,
    reviewer: '0x0000000000000000000000000000000000000000',
    reviewTimestamp: 0,
    fineAmount: 0,
    isPaid: false
  }
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { account, isConnected } = useWeb3();
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [violations, setViolations] = useState<Violation[]>(mockViolations);
  const [isLoading, setIsLoading] = useState(false);

  const userVehicles = vehicles.filter(v => v.ownerAddress === account);
  const userViolations = violations.filter(v => v.reporter === account);
  const pendingViolations = violations.filter(v => v.status === ViolationStatus.PENDING);

  const registerVehicle = async (vehicleData: any) => {
    setIsLoading(true);
    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newVehicle: Vehicle = {
        id: vehicles.length + 1,
        hashedPlateNumber: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(vehicleData.plateNumber)),
        hashedChassisId: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(vehicleData.chassisId)),
        hashedEngineNumber: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(vehicleData.engineNumber)),
        ownerName: vehicleData.ownerName,
        vehicleType: vehicleData.vehicleType,
        registrationDate: Date.now(),
        isActive: true,
        ownerAddress: account!
      };
      
      setVehicles(prev => [...prev, newVehicle]);
    } catch (error) {
      console.error('Error registering vehicle:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const reportViolation = async (violationData: any) => {
    setIsLoading(true);
    try {
      // Simulate IPFS upload and blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newViolation: Violation = {
        id: violations.length + 1,
        reporter: account!,
        vehicleId: violationData.vehicleId,
        violationType: violationData.violationType,
        description: violationData.description,
        ipfsHash: `QmX${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        status: ViolationStatus.PENDING,
        reviewer: '0x0000000000000000000000000000000000000000',
        reviewTimestamp: 0,
        fineAmount: 0,
        isPaid: false
      };
      
      setViolations(prev => [...prev, newViolation]);
    } catch (error) {
      console.error('Error reporting violation:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const reviewViolation = async (violationId: number, status: ViolationStatus, fineAmount: number) => {
    setIsLoading(true);
    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setViolations(prev => prev.map(v => 
        v.id === violationId 
          ? { 
              ...v, 
              status, 
              reviewer: account!,
              reviewTimestamp: Date.now(),
              fineAmount
            }
          : v
      ));
    } catch (error) {
      console.error('Error reviewing violation:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    // Simulate data refresh
    console.log('Refreshing data...');
  };

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

// Add ethers import at the top
const ethers = {
  utils: {
    keccak256: (data: string) => '0x' + Math.random().toString(16).substr(2, 64),
    toUtf8Bytes: (str: string) => str
  }
};