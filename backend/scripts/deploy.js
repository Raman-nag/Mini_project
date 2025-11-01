const fs = require('fs');
const path = require('path');
const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  
  const deployments = {};

  // 1. Deploy AccessControl
  const AccessControl = await hre.ethers.getContractFactory('AccessControl');
  const accessControl = await AccessControl.deploy();
  await accessControl.deployed();
  console.log('AccessControl deployed to:', accessControl.address);

  // 2. Deploy DoctorManagement (needs AccessControl)
  const DoctorManagement = await hre.ethers.getContractFactory('DoctorManagement');
  const doctorManagement = await DoctorManagement.deploy(accessControl.address);
  await doctorManagement.deployed();
  console.log('DoctorManagement deployed to:', doctorManagement.address);

  // 3. Deploy PatientManagement (needs DoctorManagement, AccessControl)
  const PatientManagement = await hre.ethers.getContractFactory('PatientManagement');
  const patientManagement = await PatientManagement.deploy(doctorManagement.address, accessControl.address);
  await patientManagement.deployed();
  console.log('PatientManagement deployed to:', patientManagement.address);

  // 4. Deploy HospitalManagement (needs DoctorManagement, PatientManagement, AccessControl)
  const HospitalManagement = await hre.ethers.getContractFactory('HospitalManagement');
  const hospitalManagement = await HospitalManagement.deploy(
    doctorManagement.address,
    patientManagement.address,
    accessControl.address
  );
  await hospitalManagement.deployed();
  console.log('HospitalManagement deployed to:', hospitalManagement.address);

  // 5. Deploy EMRSystem (connects all sub-contracts)
  const EMRSystem = await hre.ethers.getContractFactory('EMRSystem');
  const emrSystem = await EMRSystem.deploy(hospitalManagement.address, doctorManagement.address, patientManagement.address);
  await emrSystem.deployed();
  console.log('EMRSystem deployed to:', emrSystem.address);

  console.log('\nDeployment summary:');
  console.log('AccessControl:', accessControl.address);
  console.log('DoctorManagement:', doctorManagement.address);
  console.log('PatientManagement:', patientManagement.address);
  console.log('HospitalManagement:', hospitalManagement.address);
  console.log('EMRSystem:', emrSystem.address);

  // Optional: set up initial roles (grant deployer ADMIN role is already set in constructor)
  // Example: grant HOSPITAL_ROLE to deployer for testing
  try {
    const HOSPITAL_ROLE = await accessControl.HOSPITAL_ROLE();
    const DOCTOR_ROLE = await accessControl.DOCTOR_ROLE();
    const PATIENT_ROLE = await accessControl.PATIENT_ROLE();

    // Grant all roles to deployer for initial testing (remove or restrict in production)
    await (await accessControl.grantRole(HOSPITAL_ROLE, deployer.address)).wait();
    await (await accessControl.grantRole(DOCTOR_ROLE, deployer.address)).wait();
    await (await accessControl.grantRole(PATIENT_ROLE, deployer.address)).wait();
    console.log('Granted HOSPITAL/DOCTOR/PATIENT roles to deployer for testing');
  } catch (err) {
    console.warn('Role assignment skipped or failed:', err.message || err);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });