const hre = require("hardhat");

async function main() {
    console.log("Deploying contracts to Mantle network...");

    // Deploy CredentialNFT
    console.log("\n1. Deploying CredentialNFT...");
    const CredentialNFT = await hre.ethers.getContractFactory("CredentialNFT");
    const credentialNFT = await CredentialNFT.deploy();
    await credentialNFT.waitForDeployment();
    const nftAddress = await credentialNFT.getAddress();
    console.log("✅ CredentialNFT deployed to:", nftAddress);

    // Deploy CredentialRegistry
    console.log("\n2. Deploying CredentialRegistry...");
    const CredentialRegistry = await hre.ethers.getContractFactory("CredentialRegistry");
    const credentialRegistry = await CredentialRegistry.deploy();
    await credentialRegistry.waitForDeployment();
    const registryAddress = await credentialRegistry.getAddress();
    console.log("✅ CredentialRegistry deployed to:", registryAddress);

    console.log("\n========================================");
    console.log("DEPLOYMENT COMPLETE!");
    console.log("========================================");
    console.log("\nAdd these to your frontend .env.local file:");
    console.log(`NEXT_PUBLIC_CREDENTIAL_NFT_CONTRACT=${nftAddress}`);
    console.log(`NEXT_PUBLIC_CREDENTIAL_REGISTRY_CONTRACT=${registryAddress}`);
    console.log("\n========================================");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
