// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VehicleLedger {
    struct Vehicle {
        string hashedPlateNumber;
        string hashedChassisId;
        string hashedEngineNumber;
        string ownerName;
        string vehicleType;
        uint256 registrationDate;
        bool isActive;
        address ownerAddress;
    }
    
    mapping(address => uint256[]) public userVehicles;
    mapping(uint256 => Vehicle) public vehicles;
    mapping(string => uint256) public plateToVehicleId;
    mapping(address => bool) public isRegisteredUser;
    
    uint256 public vehicleCounter;
    address public owner;
    
    event VehicleRegistered(
        uint256 indexed vehicleId,
        address indexed ownerAddress,
        string hashedPlateNumber,
        uint256 registrationDate
    );
    
    event VehicleStatusUpdated(uint256 indexed vehicleId, bool isActive);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        vehicleCounter = 1;
    }
    
    function registerVehicle(
        string memory _hashedPlateNumber,
        string memory _hashedChassisId,
        string memory _hashedEngineNumber,
        string memory _ownerName,
        string memory _vehicleType
    ) external returns (uint256) {
        require(bytes(_hashedPlateNumber).length > 0, "Plate number hash required");
        require(bytes(_hashedChassisId).length > 0, "Chassis ID hash required");
        require(plateToVehicleId[_hashedPlateNumber] == 0, "Vehicle already registered");
        
        uint256 vehicleId = vehicleCounter++;
        
        vehicles[vehicleId] = Vehicle({
            hashedPlateNumber: _hashedPlateNumber,
            hashedChassisId: _hashedChassisId,
            hashedEngineNumber: _hashedEngineNumber,
            ownerName: _ownerName,
            vehicleType: _vehicleType,
            registrationDate: block.timestamp,
            isActive: true,
            ownerAddress: msg.sender
        });
        
        userVehicles[msg.sender].push(vehicleId);
        plateToVehicleId[_hashedPlateNumber] = vehicleId;
        isRegisteredUser[msg.sender] = true;
        
        emit VehicleRegistered(vehicleId, msg.sender, _hashedPlateNumber, block.timestamp);
        
        return vehicleId;
    }
    
    function getVehicle(uint256 _vehicleId) external view returns (Vehicle memory) {
        require(_vehicleId > 0 && _vehicleId < vehicleCounter, "Invalid vehicle ID");
        return vehicles[_vehicleId];
    }
    
    function getUserVehicles(address _user) external view returns (uint256[] memory) {
        return userVehicles[_user];
    }
    
    function verifyVehicleOwnership(uint256 _vehicleId, address _user) external view returns (bool) {
        return vehicles[_vehicleId].ownerAddress == _user && vehicles[_vehicleId].isActive;
    }
    
    function getVehicleByPlate(string memory _hashedPlateNumber) external view returns (uint256, Vehicle memory) {
        uint256 vehicleId = plateToVehicleId[_hashedPlateNumber];
        require(vehicleId > 0, "Vehicle not found");
        return (vehicleId, vehicles[vehicleId]);
    }
    
    function updateVehicleStatus(uint256 _vehicleId, bool _isActive) external onlyOwner {
        require(_vehicleId > 0 && _vehicleId < vehicleCounter, "Invalid vehicle ID");
        vehicles[_vehicleId].isActive = _isActive;
        emit VehicleStatusUpdated(_vehicleId, _isActive);
    }
    
    function hashString(string memory _input) public pure returns (string memory) {
        return string(abi.encodePacked(keccak256(abi.encodePacked(_input))));
    }
}