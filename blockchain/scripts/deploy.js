import { network } from "hardhat";

async function main() {
    console.log("Deploying DisasterAudit...");

    const { ethers } = await network.create();

    const DisasterAudit =
        await ethers.getContractFactory("DisasterAudit");

    const disasterAudit =
        await DisasterAudit.deploy();

    await disasterAudit.waitForDeployment();

    const address =
        await disasterAudit.getAddress();

    console.log("======================================");
    console.log("DisasterAudit deployed successfully");
    console.log("Contract address:", address);
    console.log("======================================");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});