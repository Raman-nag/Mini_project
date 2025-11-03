// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DoctorManagement
 * @dev Manages doctor registration and medical records
 */
contract DoctorManagement is Ownable, ReentrancyGuard, AccessControl {
    // ===============================
    // Role Definitions
    // ===============================
    bytes32 public constant HOSPITAL_ADMIN_ROLE = keccak256("HOSPITAL_ADMIN_ROLE");
    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");

    // ===============================
    // Structs
    // ===============================
    struct Doctor {
        string name;
        string specialization;
        string licenseNumber;
        address hospitalAddress;
        address walletAddress;
        bool isActive;
        uint256 timestamp;
    }

    struct MedicalRecord {
        address patientAddress;
        string diagnosis;
        string[] symptoms;
        string prescription;
        string treatmentPlan;
        string ipfsHash;
        uint256 timestamp;
        address doctorAddress;
        bool isActive;
    }

    // ===============================
    // State Variables
    // ===============================
    mapping(address => Doctor) public doctors;
    mapping(uint256 => MedicalRecord) public medicalRecords;
    mapping(address => uint256[]) public patientRecords;
    mapping(address => address[]) public doctorPatients;
    
    uint256 public recordCount;
    mapping(address => bool) public registeredDoctors;

    // ===============================
    // Events
    // ===============================
    event DoctorRegistered(
        address indexed doctorAddress,
        address indexed hospitalAddress,
        string licenseNumber
    );
    event DoctorDeactivated(address indexed doctorAddress);
    event RecordCreated(
        uint256 indexed recordId,
        address indexed patientAddress,
        address indexed doctorAddress
    );
    event RecordUpdated(
        uint256 indexed recordId,
        address indexed doctorAddress
    );

    // ===============================
    // Modifiers
    // ===============================
    modifier onlyActiveDoctor() {
        require(
            registeredDoctors[msg.sender] && doctors[msg.sender].isActive,
            "Not an active doctor"
        );
        _;
    }

    modifier onlyHospital(address doctorAddress) {
        require(
            msg.sender == doctors[doctorAddress].hospitalAddress,
            "Only hospital can perform this action"
        );
        _;
    }

    modifier onlyRecordOwner(uint256 recordId) {
        require(
            msg.sender == medicalRecords[recordId].doctorAddress,
            "Only record owner can modify"
        );
        _;
    }

    // ===============================
    // Constructor
    // ===============================
    constructor() {
        // Grant admin role to contract deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(HOSPITAL_ADMIN_ROLE, msg.sender);
    }

    // ===============================
    // Doctor Management
    // ===============================
    function registerDoctor(
        address doctorAddress,
        string memory licenseNumber,
        address hospitalAddress
    ) external onlyRole(HOSPITAL_ADMIN_ROLE) {
        require(doctorAddress != address(0), "Invalid doctor address");
        require(!registeredDoctors[doctorAddress], "Doctor already registered");
        require(bytes(licenseNumber).length > 0, "License number required");

        doctors[doctorAddress] = Doctor({
            name: "",  // To be updated by doctor
            specialization: "", // To be updated by doctor
            licenseNumber: licenseNumber,
            hospitalAddress: hospitalAddress,
            walletAddress: doctorAddress,
            isActive: true,
            timestamp: block.timestamp
        });

        registeredDoctors[doctorAddress] = true;
        _grantRole(DOCTOR_ROLE, doctorAddress);

        emit DoctorRegistered(doctorAddress, hospitalAddress, licenseNumber);
    }

    function deactivateDoctor(address doctorAddress) 
        external 
        onlyRole(HOSPITAL_ADMIN_ROLE)
    {
        doctors[doctorAddress].isActive = false;
        emit DoctorDeactivated(doctorAddress);
    }

    function updateProfile(
        string memory name,
        string memory specialization
    ) external onlyActiveDoctor {
        Doctor storage doctor = doctors[msg.sender];
        doctor.name = name;
        doctor.specialization = specialization;
    }

    // ===============================
    // Medical Records
    // ===============================
    function createMedicalRecord(
        address patientAddress,
        string memory diagnosis,
        string[] memory symptoms,
        string memory prescription,
        string memory treatmentPlan,
        string memory ipfsHash
    ) external onlyActiveDoctor nonReentrant returns (uint256) {
        require(patientAddress != address(0), "Invalid patient address");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");

        uint256 recordId = recordCount++;
        
        medicalRecords[recordId] = MedicalRecord({
            patientAddress: patientAddress,
            diagnosis: diagnosis,
            symptoms: symptoms,
            prescription: prescription,
            treatmentPlan: treatmentPlan,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            doctorAddress: msg.sender,
            isActive: true
        });

        patientRecords[patientAddress].push(recordId);
        
        if (!isExistingPatient(patientAddress)) {
            doctorPatients[msg.sender].push(patientAddress);
        }

        emit RecordCreated(recordId, patientAddress, msg.sender);
        return recordId;
    }

    function updateMedicalRecord(
        uint256 recordId,
        string memory diagnosis,
        string[] memory symptoms,
        string memory prescription,
        string memory treatmentPlan,
        string memory ipfsHash
    ) external onlyActiveDoctor onlyRecordOwner(recordId) {
        require(medicalRecords[recordId].isActive, "Record is not active");

        MedicalRecord storage record = medicalRecords[recordId];
        record.diagnosis = diagnosis;
        record.symptoms = symptoms;
        record.prescription = prescription;
        record.treatmentPlan = treatmentPlan;
        record.ipfsHash = ipfsHash;
        record.timestamp = block.timestamp;

        emit RecordUpdated(recordId, msg.sender);
    }

    // ===============================
    // Getters
    // ===============================
    function getPatientRecords(address patientAddress) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return patientRecords[patientAddress];
    }

    function getDoctorPatients() 
        external 
        view 
        onlyActiveDoctor 
        returns (address[] memory) 
    {
        return doctorPatients[msg.sender];
    }

    function getRecordById(uint256 recordId) 
        external 
        view 
        returns (MedicalRecord memory) 
    {
        return medicalRecords[recordId];
    }

    // ===============================
    // Internal Helpers
    // ===============================
    function isExistingPatient(address patientAddress) 
        internal 
        view 
        returns (bool) 
    {
        address[] memory patients = doctorPatients[msg.sender];
        for (uint i = 0; i < patients.length; i++) {
            if (patients[i] == patientAddress) {
                return true;
            }
        }
        return false;
    }
}
