// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CivicToken.sol";
import "./VehicleLedger.sol";

contract ViolationChain {
    enum ViolationType { HELMET_VIOLATION, PLATE_TAMPERING, SPEEDING, WRONG_PARKING, OTHER }
    enum ViolationStatus { PENDING, APPROVED, REJECTED }
    
    struct Violation {
        uint256 id;
        address reporter;
        uint256 vehicleId;
        ViolationType violationType;
        string description;
        string ipfsHash;
        uint256 timestamp;
        ViolationStatus status;
        address reviewer;
        uint256 reviewTimestamp;
        uint256 fineAmount;
        bool isPaid;
    }
    
    struct Fine {
        uint256 violationId;
        uint256 amount;
        uint256 dueDate;
        bool isPaid;
        uint256 paidDate;
    }
    
    mapping(uint256 => Violation) public violations;
    mapping(address => uint256[]) public userReports;
    mapping(uint256 => uint256[]) public vehicleViolations;
    mapping(uint256 => Fine) public fines;
    mapping(address => bool) public isOfficer;
    mapping(address => uint256) public userRewards;
    
    uint256 public violationCounter;
    uint256 public constant REWARD_AMOUNT = 10 * 10**18; // 10 CIVIC tokens
    address public owner;
    
    CivicToken public civicToken;
    VehicleLedger public vehicleLedger;
    
    event ViolationReported(
        uint256 indexed violationId,
        address indexed reporter,
        uint256 indexed vehicleId,
        ViolationType violationType
    );
    
    event ViolationReviewed(
        uint256 indexed violationId,
        address indexed reviewer,
        ViolationStatus status
    );
    
    event FineIssued(
        uint256 indexed violationId,
        uint256 indexed vehicleId,
        uint256 amount
    );
    
    event RewardIssued(address indexed reporter, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyOfficer() {
        require(isOfficer[msg.sender] || msg.sender == owner, "Only officers can call this function");
        _;
    }
    
    constructor(address _civicToken, address _vehicleLedger) {
        owner = msg.sender;
        civicToken = CivicToken(_civicToken);
        vehicleLedger = VehicleLedger(_vehicleLedger);
        violationCounter = 1;
        isOfficer[msg.sender] = true;
    }
    
    function addOfficer(address _officer) external onlyOwner {
        isOfficer[_officer] = true;
    }
    
    function removeOfficer(address _officer) external onlyOwner {
        isOfficer[_officer] = false;
    }
    
    function reportViolation(
        uint256 _vehicleId,
        ViolationType _violationType,
        string memory _description,
        string memory _ipfsHash
    ) external returns (uint256) {
        require(vehicleLedger.isRegisteredUser(msg.sender), "User must be registered");
        require(_vehicleId > 0, "Invalid vehicle ID");
        
        uint256 violationId = violationCounter++;
        
        violations[violationId] = Violation({
            id: violationId,
            reporter: msg.sender,
            vehicleId: _vehicleId,
            violationType: _violationType,
            description: _description,
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp,
            status: ViolationStatus.PENDING,
            reviewer: address(0),
            reviewTimestamp: 0,
            fineAmount: 0,
            isPaid: false
        });
        
        userReports[msg.sender].push(violationId);
        vehicleViolations[_vehicleId].push(violationId);
        
        emit ViolationReported(violationId, msg.sender, _vehicleId, _violationType);
        
        return violationId;
    }
    
    function reviewViolation(
        uint256 _violationId,
        ViolationStatus _status,
        uint256 _fineAmount
    ) external onlyOfficer {
        require(_violationId > 0 && _violationId < violationCounter, "Invalid violation ID");
        require(violations[_violationId].status == ViolationStatus.PENDING, "Violation already reviewed");
        
        violations[_violationId].status = _status;
        violations[_violationId].reviewer = msg.sender;
        violations[_violationId].reviewTimestamp = block.timestamp;
        violations[_violationId].fineAmount = _fineAmount;
        
        if (_status == ViolationStatus.APPROVED) {
            // Issue reward to reporter
            civicToken.mint(violations[_violationId].reporter, REWARD_AMOUNT);
            userRewards[violations[_violationId].reporter] += REWARD_AMOUNT;
            emit RewardIssued(violations[_violationId].reporter, REWARD_AMOUNT);
            
            // Issue fine if amount > 0
            if (_fineAmount > 0) {
                fines[_violationId] = Fine({
                    violationId: _violationId,
                    amount: _fineAmount,
                    dueDate: block.timestamp + 30 days,
                    isPaid: false,
                    paidDate: 0
                });
                
                emit FineIssued(_violationId, violations[_violationId].vehicleId, _fineAmount);
            }
        }
        
        emit ViolationReviewed(_violationId, msg.sender, _status);
    }
    
    function payFine(uint256 _violationId) external payable {
        require(fines[_violationId].violationId == _violationId, "Fine not found");
        require(!fines[_violationId].isPaid, "Fine already paid");
        require(msg.value >= fines[_violationId].amount, "Insufficient payment");
        
        fines[_violationId].isPaid = true;
        fines[_violationId].paidDate = block.timestamp;
        violations[_violationId].isPaid = true;
        
        // Refund excess payment
        if (msg.value > fines[_violationId].amount) {
            payable(msg.sender).transfer(msg.value - fines[_violationId].amount);
        }
    }
    
    function getViolation(uint256 _violationId) external view returns (Violation memory) {
        require(_violationId > 0 && _violationId < violationCounter, "Invalid violation ID");
        return violations[_violationId];
    }
    
    function getUserReports(address _user) external view returns (uint256[] memory) {
        return userReports[_user];
    }
    
    function getVehicleViolations(uint256 _vehicleId) external view returns (uint256[] memory) {
        return vehicleViolations[_vehicleId];
    }
    
    function getPendingViolations() external view returns (uint256[] memory) {
        uint256[] memory pending = new uint256[](violationCounter - 1);
        uint256 count = 0;
        
        for (uint256 i = 1; i < violationCounter; i++) {
            if (violations[i].status == ViolationStatus.PENDING) {
                pending[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = pending[i];
        }
        
        return result;
    }
    
    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}