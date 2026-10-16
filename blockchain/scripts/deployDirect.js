import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const rpcUrl = "http://127.0.0.1:8545";
  const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

  console.log("Connecting to provider:", rpcUrl);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Deployer address:", wallet.address);

  const artifactPath = path.join(__dirname, "../artifacts/contracts/DisasterAudit.sol/DisasterAudit.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  console.log("Deploying DisasterAudit contract...");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("======================================");
  console.log("DisasterAudit deployed successfully!");
  console.log("Contract Address:", address);
  console.log("======================================");

  // Update backend .env
  const backendEnvPath = path.join(__dirname, "../../backend/.env");
  if (fs.existsSync(backendEnvPath)) {
    let envContent = fs.readFileSync(backendEnvPath, "utf8");
    envContent = envContent.replace(
      /DISASTER_AUDIT_CONTRACT=.*/,
      `DISASTER_AUDIT_CONTRACT=${address}`
    );
    fs.writeFileSync(backendEnvPath, envContent, "utf8");
    console.log("Updated backend/.env with contract address:", address);
  }
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
