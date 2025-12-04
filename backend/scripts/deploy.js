const fs = require('fs');
const path = require('path');
const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  console.log('Account balance:', (await hre.ethers.provider.getBalance(deployer.address)).toString());
  
  const deployments = {};

  // 1. Deploy DoctorManagement first (no dependencies)
  console.log('\n1. Deploying DoctorManagement...');
  const DoctorManagement = await hre.ethers.getContractFactory('DoctorManagement');
  const doctorManagement = await DoctorManagement.deploy();
  await doctorManagement.deployed();
  const doctorManagementAddress = doctorManagement.address;
  console.log('DoctorManagement deployed to:', doctorManagementAddress);
  deployments.DoctorManagement = doctorManagementAddress;

  // 2. Deploy PatientManagement (needs DoctorManagement)
  console.log('\n2. Deploying PatientManagement...');
  const PatientManagement = await hre.ethers.getContractFactory('PatientManagement');
  const patientManagement = await PatientManagement.deploy(doctorManagementAddress);
  await patientManagement.deployed();
  const patientManagementAddress = patientManagement.address;
  console.log('PatientManagement deployed to:', patientManagementAddress);
  deployments.PatientManagement = patientManagementAddress;

  // 3. Deploy HospitalManagement (needs DoctorManagement and PatientManagement)
  console.log('\n3. Deploying HospitalManagement...');
  const HospitalManagement = await hre.ethers.getContractFactory('HospitalManagement');
  const hospitalManagement = await HospitalManagement.deploy(
    doctorManagementAddress,
    patientManagementAddress
  );
  await hospitalManagement.deployed();
  const hospitalManagementAddress = hospitalManagement.address;
  console.log('HospitalManagement deployed to:', hospitalManagementAddress);
  deployments.HospitalManagement = hospitalManagementAddress;

  // 4. Deploy EMRSystem (connects all sub-contracts)
  console.log('\n4. Deploying EMRSystem...');
  const EMRSystem = await hre.ethers.getContractFactory('EMRSystem');
  const emrSystem = await EMRSystem.deploy(
    hospitalManagementAddress,
    doctorManagementAddress,
    patientManagementAddress
  );
  await emrSystem.deployed();
  const emrSystemAddress = emrSystem.address;
  console.log('EMRSystem deployed to:', emrSystemAddress);
  deployments.EMRSystem = emrSystemAddress;

  // 5. Deploy InsuranceManagement (references EMRSystem for role checks)
  console.log('\n5. Deploying InsuranceManagement...');
  const InsuranceManagement = await hre.ethers.getContractFactory('InsuranceManagement');
  const insuranceManagement = await InsuranceManagement.deploy(emrSystemAddress);
  await insuranceManagement.deployed();
  const insuranceManagementAddress = insuranceManagement.address;
  console.log('InsuranceManagement deployed to:', insuranceManagementAddress);
  deployments.InsuranceManagement = insuranceManagementAddress;

  // 6. Deploy ResearchOrganizationManagement (references EMRSystem and PatientManagement)
  console.log('\n6. Deploying ResearchOrganizationManagement...');
  const ResearchOrganizationManagement = await hre.ethers.getContractFactory('ResearchOrganizationManagement');
  const researchOrganizationManagement = await ResearchOrganizationManagement.deploy(
    emrSystemAddress,
    patientManagementAddress
  );
  await researchOrganizationManagement.deployed();
  const researchOrganizationManagementAddress = researchOrganizationManagement.address;
  console.log('ResearchOrganizationManagement deployed to:', researchOrganizationManagementAddress);
  deployments.ResearchOrganizationManagement = researchOrganizationManagementAddress;

  console.log('\n=== Deployment Summary ===');
  console.log('DoctorManagement:', doctorManagementAddress);
  console.log('PatientManagement:', patientManagementAddress);
  console.log('HospitalManagement:', hospitalManagementAddress);
  console.log('EMRSystem:', emrSystemAddress);
  console.log('InsuranceManagement:', insuranceManagementAddress);
  console.log('ResearchOrganizationManagement:', researchOrganizationManagementAddress);
  console.log('==========================\n');

  // Save deployment addresses to file
  const deploymentPath = path.join(__dirname, '..', 'deployments.json');
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deployments, null, 2)
  );
  console.log('Deployment addresses saved to:', deploymentPath);

  // Grant roles post-deploy
  try {
    console.log("\n🔐 Granting roles...");
    const hospitalAdminRole = await doctorManagement.HOSPITAL_ADMIN_ROLE();
    const tx = await doctorManagement.grantRole(hospitalAdminRole, hospitalManagement.address);
    await tx.wait();
    console.log("✅ HOSPITAL_ADMIN_ROLE granted to HospitalManagement");
  } catch (e) {
    console.warn('Warning: failed to grant HOSPITAL_ADMIN_ROLE automatically:', e.message);
  }

  // Copy ABIs to frontend
  const frontendAbiPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'config', 'abis');
  if (!fs.existsSync(frontendAbiPath)) {
    fs.mkdirSync(frontendAbiPath, { recursive: true });
  }

  const artifactsPath = path.join(__dirname, '..', 'artifacts', 'contracts');
  const contractNames = ['DoctorManagement', 'PatientManagement', 'HospitalManagement', 'EMRSystem', 'InsuranceManagement', 'ResearchOrganizationManagement'];
  
  contractNames.forEach(name => {
    const artifactPath = path.join(artifactsPath, `${name}.sol`, `${name}.json`);
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      const abiPath = path.join(frontendAbiPath, `${name}.json`);
      fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
      console.log(`ABI copied for ${name}`);
    }
  });

  return deployments;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });