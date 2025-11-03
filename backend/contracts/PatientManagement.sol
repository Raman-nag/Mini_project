// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./DoctorManagement.sol";

/**
 * @title PatientManagement
 * @dev Manages patient registration and access control
 */
contract PatientManagement is Ownable, ReentrancyGuard {
    // Structs
    struct Patient {
        string name;
        string dateOfBirth;
        string bloodGroup;
        address walletAddress;
        uint256 registeredDate;
        bool isActive;
    }

    struct AccessPermission {
        address grantedTo;
        uint256 grantedAt;
        bool isActive;
    }

    // State variables
    mapping(address => Patient) public patients;
    mapping(address => mapping(address => AccessPermission)) public accessPermissions;
    mapping(address => bool) public registeredPatients;
    
    // Interface references
    DoctorManagement public doctorManagement;

    // Events
    event PatientRegistered(
        address indexed patientAddress,
        string name
    );
    event AccessGranted(
        address indexed patientAddress,
        address indexed grantedTo
    );
    event AccessRevoked(
        address indexed patientAddress,
        address indexed revokedFrom
    );
    event PatientDeactivated(address indexed patientAddress);

    // Modifiers
    modifier onlyPatient() {
        require(
            registeredPatients[msg.sender] && patients[msg.sender].isActive,
            "Not an active patient"
        );
        _;
    }

    /**
     * @dev Constructor
     */
    constructor(
        address _doctorManagement
    ) {
        doctorManagement = DoctorManagement(_doctorManagement);
    }

    /**
     * @dev Register a new patient
     */
    function registerPatient(
        string memory name,
        string memory dateOfBirth,
        string memory bloodGroup
    ) external nonReentrant {
        require(!registeredPatients[msg.sender], "Patient already registered");
        require(bytes(name).length > 0, "Name required");
        require(bytes(dateOfBirth).length > 0, "Date of birth required");
        require(bytes(bloodGroup).length > 0, "Blood group required");

        patients[msg.sender] = Patient({
            name: name,
            dateOfBirth: dateOfBirth,
            bloodGroup: bloodGroup,
            walletAddress: msg.sender,
            registeredDate: block.timestamp,
            isActive: true
        });

        registeredPatients[msg.sender] = true;
        emit PatientRegistered(msg.sender, name);
    }

    /**
     * @dev Get patient's medical records
     */
    function getMyRecords() 
        external 
        view 
        onlyPatient 
        returns (uint256[] memory) 
    {
        return doctorManagement.getPatientRecords(msg.sender);
    }

    /**
     * @dev Grant access to address
     */
    function grantAccess(address addressToGrant) 
        external 
        onlyPatient 
    {
        require(addressToGrant != address(0), "Invalid address");
        require(
            !accessPermissions[msg.sender][addressToGrant].isActive,
            "Access already granted"
        );

        accessPermissions[msg.sender][addressToGrant] = AccessPermission({
            grantedTo: addressToGrant,
            grantedAt: block.timestamp,
            isActive: true
        });

        emit AccessGranted(msg.sender, addressToGrant);
    }

    /**
     * @dev Revoke access from address
     */
    function revokeAccess(address addressToRevoke) 
        external 
        onlyPatient 
    {
        require(
            accessPermissions[msg.sender][addressToRevoke].isActive,
            "No active access found"
        );

        accessPermissions[msg.sender][addressToRevoke].isActive = false;
        emit AccessRevoked(msg.sender, addressToRevoke);
    }

    /**
     * @dev Check if an address has access to patient data
     */
    function hasAccess(address requester, address patient) 
        external 
        view 
        returns (bool) 
    {
        return accessPermissions[patient][requester].isActive;
    }

    /**
     * @dev Get patient details
     */
    function getPatientDetails(address patientAddress) 
        external 
        view 
        returns (
            string memory name,
            string memory dateOfBirth,
            string memory bloodGroup,
            uint256 registeredDate,
            bool isActive
        ) 
    {
        require(
            msg.sender == patientAddress || 
            accessPermissions[patientAddress][msg.sender].isActive,
            "No access permission"
        );

        Patient storage patient = patients[patientAddress];
        return (
            patient.name,
            patient.dateOfBirth,
            patient.bloodGroup,
            patient.registeredDate,
            patient.isActive
        );
    }

    /**
     * @dev Deactivate patient account
     */
    function deactivatePatient() 
        external 
        onlyPatient 
    {
        patients[msg.sender].isActive = false;
        emit PatientDeactivated(msg.sender);
    }
}
