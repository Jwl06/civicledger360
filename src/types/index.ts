export interface Vehicle {
  id: number;
  hashedPlateNumber: string;
  hashedChassisId: string;
  hashedEngineNumber: string;
  ownerName: string;
  vehicleType: string;
  registrationDate: number;
  isActive: boolean;
  ownerAddress: string;
}

export interface Violation {
  id: number;
  reporter: string;
  vehicleId: number;
  violationType: ViolationType;
  description: string;
  ipfsHash: string;
  timestamp: number;
  status: ViolationStatus;
  reviewer: string;
  reviewTimestamp: number;
  fineAmount: number;
  isPaid: boolean;
}

export enum ViolationType {
  HELMET_VIOLATION = 0,
  PLATE_TAMPERING = 1,
  SPEEDING = 2,
  WRONG_PARKING = 3,
  OTHER = 4
}

export enum ViolationStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2
}

export interface Fine {
  violationId: number;
  amount: number;
  dueDate: number;
  isPaid: boolean;
  paidDate: number;
}

export interface User {
  address: string;
  isOfficer: boolean;
  isRegistered: boolean;
  tokenBalance: number;
  totalRewards: number;
}

export interface ReportData {
  vehicleId: number;
  violationType: ViolationType;
  description: string;
  imageFile?: File;
}