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
  await doctorManagement.waitForDeployment();
  const doctorManagementAddress = await doctorManagement.getAddress();
  console.log('DoctorManagement deployed to:', doctorManagementAddress);
  deployments.DoctorManagement = doctorManagementAddress;

  // 2. Deploy PatientManagement (needs DoctorManagement)
  console.log('\n2. Deploying PatientManagement...');
  const PatientManagement = await hre.ethers.getContractFactory('PatientManagement');
  const patientManagement = await PatientManagement.deploy(doctorManagementAddress);
  await patientManagement.waitForDeployment();
  const patientManagementAddress = await patientManagement.getAddress();
  console.log('PatientManagement deployed to:', patientManagementAddress);
  deployments.PatientManagement = patientManagementAddress;

  // 3. Deploy HospitalManagement (needs DoctorManagement and PatientManagement)
  console.log('\n3. Deploying HospitalManagement...');
  const HospitalManagement = await hre.ethers.getContractFactory('HospitalManagement');
  const hospitalManagement = await HospitalManagement.deploy(
    doctorManagementAddress,
    patientManagementAddress
  );
  await hospitalManagement.waitForDeployment();
  const hospitalManagementAddress = await hospitalManagement.getAddress();
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
  await emrSystem.waitForDeployment();
  const emrSystemAddress = await emrSystem.getAddress();
  console.log('EMRSystem deployed to:', emrSystemAddress);
  deployments.EMRSystem = emrSystemAddress;

  console.log('\n=== Deployment Summary ===');
  console.log('DoctorManagement:', doctorManagementAddress);
  console.log('PatientManagement:', patientManagementAddress);
  console.log('HospitalManagement:', hospitalManagementAddress);
  console.log('EMRSystem:', emrSystemAddress);
  console.log('==========================\n');

  // Save deployment addresses to file
  const deploymentPath = path.join(__dirname, '..', 'deployments.json');
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deployments, null, 2)
  );
  console.log('Deployment addresses saved to:', deploymentPath);

  // Copy ABIs to frontend
  const frontendAbiPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'config', 'abis');
  if (!fs.existsSync(frontendAbiPath)) {
    fs.mkdirSync(frontendAbiPath, { recursive: true });
  }

  const artifactsPath = path.join(__dirname, '..', 'artifacts', 'contracts');
  const contractNames = ['DoctorManagement', 'PatientManagement', 'HospitalManagement', 'EMRSystem'];
  
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