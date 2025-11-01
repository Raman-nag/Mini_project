// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./HospitalManagement.sol";
import "./DoctorManagement.sol";
import "./PatientManagement.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title EMRSystem
 * @dev Main contract for Electronic Medical Records System
 */
contract EMRSystem is Ownable, ReentrancyGuard {
    HospitalManagement public hospitalManagement;
    DoctorManagement public doctorManagement;
    PatientManagement public patientManagement;

    // System state
    bool public systemPaused;

    // Events
    event SystemPaused(address indexed admin);
    event SystemResumed(address indexed admin);
    event ContractUpgraded(string contractName, address newAddress);

    /**
     * @dev Modifier to check if system is not paused
     */
    modifier whenNotPaused() {
        require(!systemPaused, "System is paused");
        _;
    }

    /**
     * @dev Constructor to initialize sub-contracts
     */
    constructor(
        address _hospitalManagement,
        address _doctorManagement,
        address _patientManagement
    ) {
        hospitalManagement = HospitalManagement(_hospitalManagement);
        doctorManagement = DoctorManagement(_doctorManagement);
        patientManagement = PatientManagement(_patientManagement);
    }

    /**
     * @dev Emergency pause function
     */
    function pauseSystem() external onlyOwner {
        systemPaused = true;
        emit SystemPaused(msg.sender);
    }

    /**
     * @dev Resume system operations
     */
    function resumeSystem() external onlyOwner {
        systemPaused = false;
        emit SystemResumed(msg.sender);
    }

    /**
     * @dev Upgrade contract addresses
     */
    function upgradeContract(string memory contractName, address newAddress) external onlyOwner {
        require(newAddress != address(0), "Invalid address");

        if (keccak256(bytes(contractName)) == keccak256(bytes("hospital"))) {
            hospitalManagement = HospitalManagement(newAddress);
        } else if (keccak256(bytes(contractName)) == keccak256(bytes("doctor"))) {
            doctorManagement = DoctorManagement(newAddress);
        } else if (keccak256(bytes(contractName)) == keccak256(bytes("patient"))) {
            patientManagement = PatientManagement(newAddress);
        } else {
            revert("Invalid contract name");
        }

        emit ContractUpgraded(contractName, newAddress);
    }

    /**
     * @dev Get contract addresses
     */
    function getContractAddresses() external view returns (
        address hospital,
        address doctor,
        address patient
    ) {
        return (
            address(hospitalManagement),
            address(doctorManagement),
            address(patientManagement)
        );
    }
}
