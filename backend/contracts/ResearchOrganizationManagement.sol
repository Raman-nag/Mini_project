// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IEMRSystemResearch {
    function researchAdmins(address)
        external
        view
        returns (
            string memory name,
            string memory registrationNumber,
            address wallet,
            bool active,
            uint256 addedAt
        );
}

interface IPatientRegistry {
    function registeredPatients(address) external view returns (bool);
}

contract ResearchOrganizationManagement {
    IEMRSystemResearch public emrSystem;
    IPatientRegistry public patientRegistry;

    enum ConsentStatus {
        None,
        Pending,
        Granted,
        Rejected,
        Revoked
    }

    struct Group {
        bytes32 id;
        address org;
        string name;
        string groupIdHuman;
        string purpose;
        string leaderName;
        address leaderWallet;
        string diseaseCategory;
        uint256 createdAt;
        uint256 totalPatients;
        uint256 pendingCount;
        uint256 grantedCount;
        uint256 rejectedCount;
        uint256 revokedCount;
        uint256 worksCompleted;
        bool active;
    }

    mapping(bytes32 => Group) public groups;
    bytes32[] public groupIds;

    mapping(bytes32 => address[]) private groupPatients;

    mapping(bytes32 => mapping(address => ConsentStatus)) public groupPatientStatus;

    uint256 public totalGroups;
    uint256 public totalPatientsInGroups;
    uint256 public totalWorksCompleted;

    event GroupCreated(
        bytes32 indexed groupKey,
        address indexed org,
        string name,
        string groupIdHuman,
        string purpose,
        string diseaseCategory,
        uint256 createdAt
    );

    event GroupPatientsLinked(
        bytes32 indexed groupKey,
        uint256 patientCount
    );

    event GroupAccessRequested(
        bytes32 indexed groupKey,
        address indexed patient,
        string diseaseCategory,
        uint256 requestedAt
    );

    event GroupAccessResponded(
        bytes32 indexed groupKey,
        address indexed patient,
        ConsentStatus status,
        uint256 respondedAt
    );

    event GroupAccessRevokedBulk(
        bytes32 indexed groupKey,
        uint256 affectedCount,
        uint256 revokedAt
    );

    event WorkCompleted(
        bytes32 indexed groupKey,
        address indexed org,
        uint256 newCount,
        uint256 timestamp
    );

    modifier onlyResearchAdmin() {
        (, , , bool active, ) = emrSystem.researchAdmins(msg.sender);
        require(active, "Not research admin");
        _;
    }

    modifier onlyRegisteredPatient() {
        require(patientRegistry.registeredPatients(msg.sender), "Not registered patient");
        _;
    }

    constructor(address _emrSystem, address _patientRegistry) {
        require(_emrSystem != address(0), "Invalid EMRSystem");
        require(_patientRegistry != address(0), "Invalid PatientRegistry");
        emrSystem = IEMRSystemResearch(_emrSystem);
        patientRegistry = IPatientRegistry(_patientRegistry);
    }

    function _updateCountersOnStatusChange(
        Group storage g,
        ConsentStatus oldStatus,
        ConsentStatus newStatus
    ) internal {
        if (oldStatus == newStatus) return;

        if (oldStatus == ConsentStatus.Pending) g.pendingCount -= 1;
        else if (oldStatus == ConsentStatus.Granted) g.grantedCount -= 1;
        else if (oldStatus == ConsentStatus.Rejected) g.rejectedCount -= 1;
        else if (oldStatus == ConsentStatus.Revoked) g.revokedCount -= 1;

        if (newStatus == ConsentStatus.Pending) g.pendingCount += 1;
        else if (newStatus == ConsentStatus.Granted) g.grantedCount += 1;
        else if (newStatus == ConsentStatus.Rejected) g.rejectedCount += 1;
        else if (newStatus == ConsentStatus.Revoked) g.revokedCount += 1;
    }

    function _addPatientsToGroup(bytes32 groupKey, address[] memory patients) internal {
        Group storage g = groups[groupKey];
        require(g.org != address(0) && g.active, "Group not found");

        uint256 addedCount = 0;
        for (uint256 i = 0; i < patients.length; i++) {
            address p = patients[i];
            if (p == address(0)) continue;
            if (!patientRegistry.registeredPatients(p)) continue;

            ConsentStatus existing = groupPatientStatus[groupKey][p];
            if (existing != ConsentStatus.None) continue;

            groupPatients[groupKey].push(p);
            groupPatientStatus[groupKey][p] = ConsentStatus.Pending;
            g.totalPatients += 1;
            totalPatientsInGroups += 1;
            _updateCountersOnStatusChange(g, ConsentStatus.None, ConsentStatus.Pending);

            emit GroupAccessRequested(groupKey, p, g.diseaseCategory, block.timestamp);
            addedCount++;
        }

        if (addedCount > 0) {
            emit GroupPatientsLinked(groupKey, addedCount);
        }
    }

    function createGroup(
        string calldata name,
        string calldata groupIdHuman,
        string calldata purpose,
        string calldata leaderName,
        address leaderWallet,
        string calldata diseaseCategory,
        address[] calldata patients
    ) external onlyResearchAdmin returns (bytes32 groupKey) {
        require(bytes(name).length > 0, "Name required");
        require(bytes(groupIdHuman).length > 0, "Group ID required");
        require(leaderWallet != address(0), "Leader wallet required");

        groupKey = keccak256(abi.encodePacked(msg.sender, groupIdHuman));
        require(groups[groupKey].org == address(0), "Group already exists");

        Group storage g = groups[groupKey];
        g.id = groupKey;
        g.org = msg.sender;
        g.name = name;
        g.groupIdHuman = groupIdHuman;
        g.purpose = purpose;
        g.leaderName = leaderName;
        g.leaderWallet = leaderWallet;
        g.diseaseCategory = diseaseCategory;
        g.createdAt = block.timestamp;
        g.active = true;

        groupIds.push(groupKey);
        totalGroups += 1;

        emit GroupCreated(
            groupKey,
            msg.sender,
            name,
            groupIdHuman,
            purpose,
            diseaseCategory,
            g.createdAt
        );

        if (patients.length > 0) {
            _addPatientsToGroup(groupKey, patients);
        }
    }

    function addPatientsToGroup(bytes32 groupKey, address[] calldata patients) external onlyResearchAdmin {
        Group storage g = groups[groupKey];
        require(g.org == msg.sender, "Not group owner");
        _addPatientsToGroup(groupKey, patients);
    }

    function batchRequestAccess(bytes32 groupKey) external onlyResearchAdmin {
        Group storage g = groups[groupKey];
        require(g.org == msg.sender, "Not group owner");
        require(g.active, "Group inactive");

        address[] storage pts = groupPatients[groupKey];
        for (uint256 i = 0; i < pts.length; i++) {
            address p = pts[i];
            ConsentStatus current = groupPatientStatus[groupKey][p];
            if (current == ConsentStatus.None || current == ConsentStatus.Rejected || current == ConsentStatus.Revoked) {
                _updateCountersOnStatusChange(g, current, ConsentStatus.Pending);
                groupPatientStatus[groupKey][p] = ConsentStatus.Pending;
                emit GroupAccessRequested(groupKey, p, g.diseaseCategory, block.timestamp);
            }
        }
    }

    function revokeGroupRequests(bytes32 groupKey) external onlyResearchAdmin {
        Group storage g = groups[groupKey];
        require(g.org == msg.sender, "Not group owner");
        require(g.active, "Group inactive");

        address[] storage pts = groupPatients[groupKey];
        uint256 affected = 0;
        for (uint256 i = 0; i < pts.length; i++) {
            address p = pts[i];
            ConsentStatus current = groupPatientStatus[groupKey][p];
            if (current == ConsentStatus.Pending || current == ConsentStatus.Granted) {
                _updateCountersOnStatusChange(g, current, ConsentStatus.Revoked);
                groupPatientStatus[groupKey][p] = ConsentStatus.Revoked;
                affected++;
            }
        }

        if (affected > 0) {
            emit GroupAccessRevokedBulk(groupKey, affected, block.timestamp);
        }
    }

    function respondToGroupRequest(bytes32 groupKey, bool grant) external onlyRegisteredPatient {
        Group storage g = groups[groupKey];
        require(g.active, "Group inactive");

        ConsentStatus current = groupPatientStatus[groupKey][msg.sender];
        require(current == ConsentStatus.Pending, "No pending request");

        ConsentStatus newStatus = grant ? ConsentStatus.Granted : ConsentStatus.Rejected;
        _updateCountersOnStatusChange(g, current, newStatus);
        groupPatientStatus[groupKey][msg.sender] = newStatus;

        emit GroupAccessResponded(groupKey, msg.sender, newStatus, block.timestamp);
    }

    function markWorkCompleted(bytes32 groupKey) external onlyResearchAdmin {
        Group storage g = groups[groupKey];
        require(g.org == msg.sender, "Not group owner");
        require(g.active, "Group inactive");

        g.worksCompleted += 1;
        totalWorksCompleted += 1;

        emit WorkCompleted(groupKey, msg.sender, g.worksCompleted, block.timestamp);
    }

    function getGroup(bytes32 groupKey) external view returns (Group memory) {
        return groups[groupKey];
    }

    function getGroupPatients(bytes32 groupKey) external view returns (address[] memory) {
        return groupPatients[groupKey];
    }

    function getGroupPatientStatuses(bytes32 groupKey, address[] calldata patients)
        external
        view
        returns (ConsentStatus[] memory statuses)
    {
        statuses = new ConsentStatus[](patients.length);
        for (uint256 i = 0; i < patients.length; i++) {
            statuses[i] = groupPatientStatus[groupKey][patients[i]];
        }
    }

    function getGroupCounts(bytes32 groupKey)
        external
        view
        returns (
            uint256 total,
            uint256 pending,
            uint256 granted,
            uint256 rejected,
            uint256 revoked
        )
    {
        Group storage g = groups[groupKey];
        return (g.totalPatients, g.pendingCount, g.grantedCount, g.rejectedCount, g.revokedCount);
    }

    function getGlobalAnalytics()
        external
        view
        returns (
            uint256 groupsCount,
            uint256 patientsCount,
            uint256 worksCount
        )
    {
        return (totalGroups, totalPatientsInGroups, totalWorksCompleted);
    }

    function getAllGroups() external view returns (Group[] memory result) {
        uint256 len = groupIds.length;
        result = new Group[](len);
        for (uint256 i = 0; i < len; i++) {
            result[i] = groups[groupIds[i]];
        }
    }
}
