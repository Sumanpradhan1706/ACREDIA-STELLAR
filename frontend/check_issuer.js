// Check who issued a credential on the blockchain
// Run this in browser console on your app

async function checkCredentialIssuer(tokenId) {
    const contractAddress = "0xDdC177431B2a376EDfF1D4362c7f69675B69038b";
    const abi = [
        {
            "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "name": "credentialIssuers",
            "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
            "stateMutability": "view",
            "type": "function"
        }
    ];

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, abi, provider);

    const issuer = await contract.credentialIssuers(tokenId);
    console.log("Token ID:", tokenId);
    console.log("Stored Issuer:", issuer);

    return issuer;
}

// Usage: Replace with your actual token ID
checkCredentialIssuer("YOUR_TOKEN_ID_HERE");
