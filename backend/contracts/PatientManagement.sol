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
        string[] diseases;
    }

    struct PatientSummary {
        address walletAddress;
        string name;
        string[] diseases;
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
    // Pending requests: patient => doctor => pending?
    mapping(address => mapping(address => bool)) public pendingRequests;
    // Non-compact list of doctors who requested for a patient (UI can filter by pendingRequests flag)
    mapping(address => address[]) private pendingDoctors;
    address[] private patientAddresses;
    
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
    event AccessRequested(
        address indexed patientAddress,
        address indexed doctorAddress,
        uint256 requestedAt
    );
    event AccessRequestCancelled(
        address indexed patientAddress,
        address indexed doctorAddress,
        uint256 cancelledAt
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
            isActive: true,
            diseases: new string[](0)
        });

        registeredPatients[msg.sender] = true;
        patientAddresses.push(msg.sender);
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

        // Clear pending request if any
        if (pendingRequests[msg.sender][addressToGrant]) {
            pendingRequests[msg.sender][addressToGrant] = false;
        }

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
     * @dev Doctor requests access to a patient's data
     */
    function requestAccess(address patient) external nonReentrant {
        require(patient != address(0), "Invalid patient");
        require(!accessPermissions[patient][msg.sender].isActive, "Already has access");
        require(!pendingRequests[patient][msg.sender], "Already requested");

        pendingRequests[patient][msg.sender] = true;
        pendingDoctors[patient].push(msg.sender);
        emit AccessRequested(patient, msg.sender, block.timestamp);
    }

    /**
     * @dev Doctor cancels a pending request
     */
    function cancelRequest(address patient) external nonReentrant {
        require(pendingRequests[patient][msg.sender], "No request");
        pendingRequests[patient][msg.sender] = false;
        emit AccessRequestCancelled(patient, msg.sender, block.timestamp);
    }

    /**
     * @dev Patient rejects a pending request from a doctor
     */
    function rejectRequest(address doctor) external nonReentrant onlyPatient {
        require(pendingRequests[msg.sender][doctor], "No request");
        pendingRequests[msg.sender][doctor] = false;
        emit AccessRequestCancelled(msg.sender, doctor, block.timestamp);
    }

    /**
     * @dev Get pending request doctors for a patient (may include historical entries; UI filters with pendingRequests flag)
     */
    function getPendingRequests(address patient) external view returns (address[] memory) {
        return pendingDoctors[patient];
    }

    /**
     * @dev Check if an address has access to patient data
     */
    function hasAccess(address requester, address patient) 
        external 
        view 
        returns (bool) 
    {
        bool direct = accessPermissions[patient][requester].isActive;
        bool linkedDoctor = false;
        // If DoctorManagement is set, allow doctors linked to the patient
        if (address(doctorManagement) != address(0)) {
            try doctorManagement.hasDoctorPatient(requester, patient) returns (bool ok) {
                linkedDoctor = ok;
            } catch {
                linkedDoctor = false;
            }
        }
        return direct || linkedDoctor;
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
        bool permitted = (msg.sender == patientAddress) || accessPermissions[patientAddress][msg.sender].isActive;
        if (!permitted && address(doctorManagement) != address(0)) {
            // Allow doctors associated with the patient via DoctorManagement
            try doctorManagement.hasDoctorPatient(msg.sender, patientAddress) returns (bool ok) {
                permitted = ok;
            } catch {
                permitted = false;
            }
        }
        require(permitted, "No access permission");

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

    /**
     * @dev Append a disease category to a patient's diseases list if not already present.
     * This is intended to be called after doctors create or update medical records.
     */
    function addDiseaseForPatient(address patientAddr, string memory disease)
        external
    {
        require(registeredPatients[patientAddr], "Not registered");
        bytes memory diseaseBytes = bytes(disease);
        require(diseaseBytes.length > 0, "Disease required");

        string[] storage arr = patients[patientAddr].diseases;
        bytes32 newHash = keccak256(diseaseBytes);
        for (uint i = 0; i < arr.length; i++) {
            if (keccak256(bytes(arr[i])) == newHash) {
                return;
            }
        }
        arr.push(disease);
    }

    function getAllPatientsSummary() 
        external 
        view 
        returns (PatientSummary[] memory) 
    {
        uint256 len = patientAddresses.length;
        PatientSummary[] memory result = new PatientSummary[](len);
        for (uint256 i = 0; i < len; i++) {
            address addr = patientAddresses[i];
            Patient storage p = patients[addr];
            result[i] = PatientSummary({
                walletAddress: p.walletAddress,
                name: p.name,
                diseases: p.diseases
            });
        }
        return result;
    }
}
