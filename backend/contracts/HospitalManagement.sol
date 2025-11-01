// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./AccessControl.sol";
import "./DoctorManagement.sol";
import "./PatientManagement.sol";

/**
 * @title HospitalManagement
 * @dev Manages hospital registration and operations
 */
contract HospitalManagement is Ownable, ReentrancyGuard {
    // Structs
    struct Hospital {
        string name;
        string registrationNumber;
        address walletAddress;
        bool isActive;
        uint256 timestamp;
        address[] doctors;
        address[] patients;
    }

    // State variables
    mapping(address => Hospital) public hospitals;
    mapping(address => bool) public registeredHospitals;
    address[] public hospitalAddresses;

    // Events
    event HospitalRegistered(
        address indexed hospitalAddress,
        string name,
        string registrationNumber
    );
    event DoctorAdded(
        address indexed hospitalAddress,
        address indexed doctorAddress
    );
    event DoctorRemoved(
        address indexed hospitalAddress,
        address indexed doctorAddress
    );
    event HospitalDeactivated(address indexed hospitalAddress);

    // Interface references
    DoctorManagement public doctorManagement;
    PatientManagement public patientManagement;
    AccessControl public accessControl;

    // Modifiers
    modifier onlyHospital() {
        require(
            registeredHospitals[msg.sender] && hospitals[msg.sender].isActive,
            "Not an active hospital"
        );
        _;
    }

    modifier hospitalExists(address hospitalAddress) {
        require(registeredHospitals[hospitalAddress], "Hospital does not exist");
        _;
    }

    /**
     * @dev Constructor to initialize contract dependencies
     */
    constructor(
        address _doctorManagement,
        address _patientManagement,
        address _accessControl
    ) {
        doctorManagement = DoctorManagement(_doctorManagement);
        patientManagement = PatientManagement(_patientManagement);
        accessControl = AccessControl(_accessControl);
    }

    /**
     * @dev Register a new hospital
     */
    function registerHospital(
        string memory name,
        string memory registrationNumber
    ) external nonReentrant {
        require(!registeredHospitals[msg.sender], "Hospital already registered");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(registrationNumber).length > 0, "Registration number cannot be empty");

        hospitals[msg.sender] = Hospital({
            name: name,
            registrationNumber: registrationNumber,
            walletAddress: msg.sender,
            isActive: true,
            timestamp: block.timestamp,
            doctors: new address[](0),
            patients: new address[](0)
        });

        registeredHospitals[msg.sender] = true;
        hospitalAddresses.push(msg.sender);

        emit HospitalRegistered(msg.sender, name, registrationNumber);
    }

    /**
     * @dev Add a doctor to the hospital
     */
    function addDoctor(address doctorAddress, string memory licenseNumber) 
        external 
        onlyHospital 
    {
        require(doctorAddress != address(0), "Invalid doctor address");
        require(!isDoctor(doctorAddress), "Doctor already registered");

        hospitals[msg.sender].doctors.push(doctorAddress);
        doctorManagement.registerDoctor(doctorAddress, licenseNumber, msg.sender);

        emit DoctorAdded(msg.sender, doctorAddress);
    }

    /**
     * @dev Remove a doctor from the hospital
     */
    function removeDoctor(address doctorAddress) 
        external 
        onlyHospital 
    {
        require(isDoctor(doctorAddress), "Doctor not found");

        // Remove doctor from array
        address[] storage doctors = hospitals[msg.sender].doctors;
        for (uint i = 0; i < doctors.length; i++) {
            if (doctors[i] == doctorAddress) {
                doctors[i] = doctors[doctors.length - 1];
                doctors.pop();
                break;
            }
        }

        doctorManagement.deactivateDoctor(doctorAddress);
        emit DoctorRemoved(msg.sender, doctorAddress);
    }

    /**
     * @dev Get all doctors in a hospital
     */
    function getHospitalDoctors(address hospitalAddress) 
        external 
        view 
        hospitalExists(hospitalAddress) 
        returns (address[] memory) 
    {
        return hospitals[hospitalAddress].doctors;
    }

    /**
     * @dev Get all patients in a hospital
     */
    function getHospitalPatients(address hospitalAddress) 
        external 
        view 
        hospitalExists(hospitalAddress) 
        returns (address[] memory) 
    {
        return hospitals[hospitalAddress].patients;
    }

    /**
     * @dev Deactivate a hospital
     */
    function deactivateHospital(address hospitalAddress) 
        external 
        onlyOwner 
        hospitalExists(hospitalAddress) 
    {
        hospitals[hospitalAddress].isActive = false;
        emit HospitalDeactivated(hospitalAddress);
    }

    /**
     * @dev Check if an address is a registered doctor
     */
    function isDoctor(address doctorAddress) public view returns (bool) {
        address[] memory doctors = hospitals[msg.sender].doctors;
        for (uint i = 0; i < doctors.length; i++) {
            if (doctors[i] == doctorAddress) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Get hospital details
     */
    function getHospitalDetails(address hospitalAddress) 
        external 
        view 
        hospitalExists(hospitalAddress) 
        returns (
            string memory name,
            string memory registrationNumber,
            bool isActive,
            uint256 timestamp,
            uint256 doctorCount,
            uint256 patientCount
        ) 
    {
        Hospital storage hospital = hospitals[hospitalAddress];
        return (
            hospital.name,
            hospital.registrationNumber,
            hospital.isActive,
            hospital.timestamp,
            hospital.doctors.length,
            hospital.patients.length
        );
    }
}
