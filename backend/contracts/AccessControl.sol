// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AccessControl
 * @dev Manages role-based access control for the EMR system
 */
contract AccessControl is Ownable {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant HOSPITAL_ROLE = keccak256("HOSPITAL_ROLE");
    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");
    bytes32 public constant PATIENT_ROLE = keccak256("PATIENT_ROLE");

    // Role assignments
    mapping(address => mapping(bytes32 => bool)) private roles;
    
    // Events
    event RoleGranted(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );
    event RoleRevoked(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    constructor() {
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    // Modifiers
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        _;
    }

    modifier onlyHospital() {
        require(hasRole(HOSPITAL_ROLE, msg.sender), "Caller is not a hospital");
        _;
    }

    modifier onlyDoctor() {
        require(hasRole(DOCTOR_ROLE, msg.sender), "Caller is not a doctor");
        _;
    }

    modifier onlyPatient() {
        require(hasRole(PATIENT_ROLE, msg.sender), "Caller is not a patient");
        _;
    }

    /**
     * @dev Internal function to set up initial roles
     */
    function _setupRole(bytes32 role, address account) internal {
        roles[account][role] = true;
        emit RoleGranted(role, account, msg.sender);
    }

    /**
     * @dev Grant a role to an account
     */
    function grantRole(bytes32 role, address account) 
        external 
        onlyAdmin 
    {
        require(account != address(0), "Invalid address");
        require(!hasRole(role, account), "Role already assigned");

        roles[account][role] = true;
        emit RoleGranted(role, account, msg.sender);
    }

    /**
     * @dev Revoke a role from an account
     */
    function revokeRole(bytes32 role, address account) 
        external 
        onlyAdmin 
    {
        require(hasRole(role, account), "Role not assigned");

        roles[account][role] = false;
        emit RoleRevoked(role, account, msg.sender);
    }

    /**
     * @dev Check if an account has a role
     */
    function hasRole(bytes32 role, address account) 
        public 
        view 
        returns (bool) 
    {
        return roles[account][role];
    }

    /**
     * @dev Get all roles of an account
     */
    function getRoles(address account) 
        external 
        view 
        returns (bool isAdmin, bool isHospital, bool isDoctor, bool isPatient) 
    {
        return (
            hasRole(ADMIN_ROLE, account),
            hasRole(HOSPITAL_ROLE, account),
            hasRole(DOCTOR_ROLE, account),
            hasRole(PATIENT_ROLE, account)
        );
    }
}
