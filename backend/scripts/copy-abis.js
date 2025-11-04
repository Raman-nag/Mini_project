const fs = require('fs');
const path = require('path');

// Copy ABIs from artifacts to frontend
const artifactsPath = path.join(__dirname, '..', 'artifacts', 'contracts');
const frontendAbiPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'config', 'abis');

// Create abis directory if it doesn't exist
if (!fs.existsSync(frontendAbiPath)) {
  fs.mkdirSync(frontendAbiPath, { recursive: true });
}

const contractNames = ['DoctorManagement', 'PatientManagement', 'HospitalManagement', 'EMRSystem'];

contractNames.forEach(name => {
  const artifactPath = path.join(artifactsPath, `${name}.sol`, `${name}.json`);
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const abiPath = path.join(frontendAbiPath, `${name}.json`);
    fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
    console.log(`✓ ABI copied for ${name}`);
  } else {
    console.warn(`⚠ ABI not found for ${name} at ${artifactPath}`);
  }
});

console.log('\nABIs copied successfully!');


