import { ethers } from 'ethers';
import { CONTRACT_ABIS, CONTRACT_ADDRESSES, DEFAULT_NETWORK_KEY } from '../config/contractConfig';
import { getProvider, getSigner, connectWallet, ensureCorrectNetwork } from '../utils/web3';

function getAddress() {
  const map = CONTRACT_ADDRESSES[DEFAULT_NETWORK_KEY] || {};
  return map.ResearchOrganizationManagement;
}

async function getContract(readonly = false) {
  const address = getAddress();
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    throw new Error('ResearchOrganizationManagement address not configured');
  }
  const abi = CONTRACT_ABIS.ResearchOrganizationManagement;
  const provider = getProvider();
  if (!provider) throw new Error('Provider not available');
  if (readonly) return new ethers.Contract(address, abi, provider);
  let signer = await getSigner();
  if (!signer) {
    await ensureCorrectNetwork();
    await connectWallet();
    signer = await getSigner();
  }
  if (!signer) throw new Error('Wallet not connected. Please connect MetaMask.');
  return new ethers.Contract(address, abi, signer);
}

export async function createGroup({
  name,
  groupIdHuman,
  purpose,
  leaderName,
  leaderWallet,
  diseaseCategory,
  patients,
}) {
  const c = await getContract(false);
  const tx = await c.createGroup(
    name,
    groupIdHuman,
    purpose,
    leaderName,
    leaderWallet,
    diseaseCategory || '',
    patients || []
  );
  const receipt = await tx.wait();
  return { success: receipt.status === 1, tx: receipt };
}

export async function addPatientsToGroup(groupKey, patients) {
  const c = await getContract(false);
  const tx = await c.addPatientsToGroup(groupKey, patients || []);
  const receipt = await tx.wait();
  return { success: receipt.status === 1, tx: receipt };
}

export async function batchRequestAccess(groupKey) {
  const c = await getContract(false);
  const tx = await c.batchRequestAccess(groupKey);
  const receipt = await tx.wait();
  return { success: receipt.status === 1, tx: receipt };
}

export async function revokeGroupRequests(groupKey) {
  const c = await getContract(false);
  const tx = await c.revokeGroupRequests(groupKey);
  const receipt = await tx.wait();
  return { success: receipt.status === 1, tx: receipt };
}

export async function respondToGroupRequest(groupKey, grant) {
  const c = await getContract(false);
  const tx = await c.respondToGroupRequest(groupKey, grant);
  const receipt = await tx.wait();
  return { success: receipt.status === 1, tx: receipt };
}

export async function markWorkCompleted(groupKey) {
  const c = await getContract(false);
  const tx = await c.markWorkCompleted(groupKey);
  const receipt = await tx.wait();
  return { success: receipt.status === 1, tx: receipt };
}

export async function getGroup(groupKey) {
  const c = await getContract(true);
  return await c.getGroup(groupKey);
}

export async function getGroupPatients(groupKey) {
  const c = await getContract(true);
  return await c.getGroupPatients(groupKey);
}

export async function getGroupCounts(groupKey) {
  const c = await getContract(true);
  return await c.getGroupCounts(groupKey);
}

export async function getGlobalAnalytics() {
  const c = await getContract(true);
  const res = await c.getGlobalAnalytics();
  return {
    groups: Number(res[0]),
    patients: Number(res[1]),
    worksCompleted: Number(res[2]),
  };
}

export async function getAllGroups() {
  const c = await getContract(true);
  return await c.getAllGroups();
}

// Patient-facing helper: list all groups that include the current wallet
// along with their consent status (enum index from contract)
export async function getMyGroupRequests() {
  const c = await getContract(true);
  const provider = getProvider();
  const signer = provider?.getSigner?.();
  if (!signer) throw new Error('Wallet not connected');
  const me = await signer.getAddress();
  const groups = await c.getAllGroups();
  const results = [];
  for (const g of groups) {
    try {
      const statuses = await c.getGroupPatientStatuses(g.id, [me]);
      const status = Array.isArray(statuses) && statuses.length > 0 ? Number(statuses[0]) : 0;
      if (status !== 0) {
        results.push({ group: g, status, me });
      }
    } catch (e) {
      // ignore groups where call fails
    }
  }
  return results;
}

export default {
  createGroup,
  addPatientsToGroup,
  batchRequestAccess,
  revokeGroupRequests,
  respondToGroupRequest,
  markWorkCompleted,
  getGroup,
  getGroupPatients,
  getGroupCounts,
  getGlobalAnalytics,
  getAllGroups,
  getMyGroupRequests,
};
