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
  CIVIC_TOKEN: '0x34683DAC607aF1e60f019552A672c33337133F64', // Update with deployed address
  VEHICLE_LEDGER: '0x3274EB89645e982366fd0CBD4DA94EB45D59fc77', // Update with deployed address
  VIOLATION_CHAIN: '0xf33bc070DC136064A2d438a5322a59EFfa5B88a4' // Update with deployed address
};

// Contract ABIs (simplified - you'll need the full ABIs from compilation)
const VEHICLE_LEDGER_ABI = [
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
						"internalType": "uint256",
						"name": "vehicleId",
						"type": "uint256"
					},
					{
						"indexed": true,
						"internalType": "address",
						"name": "ownerAddress",
						"type": "address"
					},
					{
						"indexed": false,
						"internalType": "string",
						"name": "hashedPlateNumber",
						"type": "string"
					},
					{
						"indexed": false,
						"internalType": "uint256",
						"name": "registrationDate",
						"type": "uint256"
					}
				],
				"name": "VehicleRegistered",
				"type": "event"
			},
			{
				"anonymous": false,
				"inputs": [
					{
						"indexed": true,
						"internalType": "uint256",
						"name": "vehicleId",
						"type": "uint256"
					},
					{
						"indexed": false,
						"internalType": "bool",
						"name": "isActive",
						"type": "bool"
					}
				],
				"name": "VehicleStatusUpdated",
				"type": "event"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "_user",
						"type": "address"
					}
				],
				"name": "getUserVehicles",
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
				"name": "getVehicle",
				"outputs": [
					{
						"components": [
							{
								"internalType": "string",
								"name": "hashedPlateNumber",
								"type": "string"
							},
							{
								"internalType": "string",
								"name": "hashedChassisId",
								"type": "string"
							},
							{
								"internalType": "string",
								"name": "hashedEngineNumber",
								"type": "string"
							},
							{
								"internalType": "string",
								"name": "ownerName",
								"type": "string"
							},
							{
								"internalType": "string",
								"name": "vehicleType",
								"type": "string"
							},
							{
								"internalType": "uint256",
								"name": "registrationDate",
								"type": "uint256"
							},
							{
								"internalType": "bool",
								"name": "isActive",
								"type": "bool"
							},
							{
								"internalType": "address",
								"name": "ownerAddress",
								"type": "address"
							}
						],
						"internalType": "struct VehicleLedger.Vehicle",
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
						"internalType": "string",
						"name": "_hashedPlateNumber",
						"type": "string"
					}
				],
				"name": "getVehicleByPlate",
				"outputs": [
					{
						"internalType": "uint256",
						"name": "",
						"type": "uint256"
					},
					{
						"components": [
							{
								"internalType": "string",
								"name": "hashedPlateNumber",
								"type": "string"
							},
							{
								"internalType": "string",
								"name": "hashedChassisId",
								"type": "string"
							},
							{
								"internalType": "string",
								"name": "hashedEngineNumber",
								"type": "string"
							},
							{
								"internalType": "string",
								"name": "ownerName",
								"type": "string"
							},
							{
								"internalType": "string",
								"name": "vehicleType",
								"type": "string"
							},
							{
								"internalType": "uint256",
								"name": "registrationDate",
								"type": "uint256"
							},
							{
								"internalType": "bool",
								"name": "isActive",
								"type": "bool"
							},
							{
								"internalType": "address",
								"name": "ownerAddress",
								"type": "address"
							}
						],
						"internalType": "struct VehicleLedger.Vehicle",
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
						"internalType": "string",
						"name": "_input",
						"type": "string"
					}
				],
				"name": "hashString",
				"outputs": [
					{
						"internalType": "string",
						"name": "",
						"type": "string"
					}
				],
				"stateMutability": "pure",
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
				"name": "isRegisteredUser",
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
						"internalType": "string",
						"name": "",
						"type": "string"
					}
				],
				"name": "plateToVehicleId",
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
						"internalType": "string",
						"name": "_hashedPlateNumber",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "_hashedChassisId",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "_hashedEngineNumber",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "_ownerName",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "_vehicleType",
						"type": "string"
					}
				],
				"name": "registerVehicle",
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
						"name": "_vehicleId",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "_isActive",
						"type": "bool"
					}
				],
				"name": "updateVehicleStatus",
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
				"name": "userVehicles",
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
				"name": "vehicleCounter",
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
				"name": "vehicles",
				"outputs": [
					{
						"internalType": "string",
						"name": "hashedPlateNumber",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "hashedChassisId",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "hashedEngineNumber",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "ownerName",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "vehicleType",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "registrationDate",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "isActive",
						"type": "bool"
					},
					{
						"internalType": "address",
						"name": "ownerAddress",
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
						"name": "_vehicleId",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "_user",
						"type": "address"
					}
				],
				"name": "verifyVehicleOwnership",
				"outputs": [
					{
						"internalType": "bool",
						"name": "",
						"type": "bool"
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

    // Verify network before transaction
    const network = await provider?.getNetwork();
    if (network?.chainId !== 97n) {
      throw new Error('Please switch to BSC Testnet (Chain ID: 97) to perform transactions');
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

    // Verify network before transaction
    const network = await provider?.getNetwork();
    if (network?.chainId !== 97n) {
      throw new Error('Please switch to BSC Testnet (Chain ID: 97) to perform transactions');
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

    // Verify network before transaction
    const network = await provider?.getNetwork();
    if (network?.chainId !== 97n) {
      throw new Error('Please switch to BSC Testnet (Chain ID: 97) to perform transactions');
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