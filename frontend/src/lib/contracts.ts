import { createThirdwebClient, getContract, prepareContractCall, sendTransaction, waitForReceipt } from "thirdweb";
import { mantleSepolia, client } from "./thirdweb";
import { ethers } from "ethers";

// Contract ABIs (minimal - only the functions we need)
const CREDENTIAL_NFT_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "student", "type": "address" },
            { "internalType": "string", "name": "credentialHash", "type": "string" },
            { "internalType": "string", "name": "uri", "type": "string" }
        ],
        "name": "issueCredential",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
        "name": "revokeCredential",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
        "name": "tokenURI",
        "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "name": "credentialHashes",
        "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "name": "credentialIssuers",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "name": "revokedCredentials",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

const CREDENTIAL_REGISTRY_ABI = [
    {
        "inputs": [
            { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
            { "internalType": "address", "name": "student", "type": "address" },
            { "internalType": "address", "name": "issuer", "type": "address" },
            { "internalType": "string", "name": "credentialHash", "type": "string" },
            { "internalType": "string", "name": "ipfsHash", "type": "string" }
        ],
        "name": "registerCredential",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
        "name": "getCredentialByTokenId",
        "outputs": [
            { "internalType": "bool", "name": "exists", "type": "bool" },
            { "internalType": "address", "name": "student", "type": "address" },
            { "internalType": "address", "name": "issuer", "type": "address" },
            { "internalType": "string", "name": "credentialHash", "type": "string" },
            { "internalType": "string", "name": "ipfsHash", "type": "string" },
            { "internalType": "uint256", "name": "issuedAt", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "string", "name": "credentialHash", "type": "string" }],
        "name": "verifyCredential",
        "outputs": [
            { "internalType": "bool", "name": "exists", "type": "bool" },
            { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
            { "internalType": "address", "name": "student", "type": "address" },
            { "internalType": "address", "name": "issuer", "type": "address" },
            { "internalType": "string", "name": "ipfsHash", "type": "string" },
            { "internalType": "uint256", "name": "issuedAt", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

// Get contract instances
export function getCredentialNFTContract() {
    return getContract({
        client,
        chain: mantleSepolia,
        address: process.env.NEXT_PUBLIC_CREDENTIAL_NFT_CONTRACT!,
        abi: CREDENTIAL_NFT_ABI,
    });
}

export function getCredentialRegistryContract() {
    return getContract({
        client,
        chain: mantleSepolia,
        address: process.env.NEXT_PUBLIC_CREDENTIAL_REGISTRY_CONTRACT!,
        abi: CREDENTIAL_REGISTRY_ABI,
    });
}

/**
 * Issue a credential NFT to a student
 */
export async function issueCredentialNFT(
    studentAddress: string,
    credentialHash: string,
    ipfsUri: string,
    account: any // Thirdweb account object
): Promise<{ tokenId: string; transactionHash: string }> {
    try {
        const contract = getCredentialNFTContract();

        // Prepare the contract call
        const transaction = prepareContractCall({
            contract,
            method: "issueCredential",
            params: [studentAddress, credentialHash, ipfsUri],
        });

        // Send transaction
        const result = await sendTransaction({
            transaction,
            account,
        });

        // Wait for receipt
        const receipt = await waitForReceipt({
            client,
            chain: mantleSepolia,
            transactionHash: result.transactionHash,
        });

        // Parse token ID from transaction logs/events
        let tokenId: string;
        try {
            // The CredentialIssued event contains the tokenId
            // Event signature: CredentialIssued(uint256 indexed tokenId, address indexed student, address indexed issuer, string credentialHash, string tokenURI)
            const logs = receipt.logs;

            if (logs && logs.length > 0) {
                // The first topic after event signature is the tokenId
                // Topic 0: event signature hash
                // Topic 1: tokenId (indexed)
                const tokenIdHex = logs[logs.length - 1]?.topics?.[1];
                if (tokenIdHex) {
                    tokenId = BigInt(tokenIdHex).toString();
                    console.log('✅ Parsed token ID from event:', tokenId);
                } else {
                    throw new Error('Token ID not found in logs');
                }
            } else {
                throw new Error('No logs in receipt');
            }
        } catch (parseError) {
            console.warn('⚠️ Could not parse token ID from receipt, using timestamp fallback');
            console.error(parseError);
            tokenId = Date.now().toString();
        }

        return {
            tokenId,
            transactionHash: result.transactionHash,
        };
    } catch (error) {
        console.error('Error issuing credential NFT:', error);
        throw new Error('Failed to issue credential NFT');
    }
}

/**
 * Register credential in the registry
 */
export async function registerCredential(
    tokenId: string,
    studentWallet: string,
    issuerWallet: string,
    credentialHash: string,
    ipfsHash: string,
    account: any
): Promise<string> {
    try {
        const contract = getCredentialRegistryContract();

        const transaction = prepareContractCall({
            contract,
            method: "registerCredential",
            params: [
                BigInt(tokenId),
                studentWallet,
                issuerWallet,
                credentialHash,
                ipfsHash
            ],
        });

        const result = await sendTransaction({
            transaction,
            account,
        });

        await waitForReceipt({
            client,
            chain: mantleSepolia,
            transactionHash: result.transactionHash,
        });

        return result.transactionHash;
    } catch (error) {
        console.error('Error registering credential:', error);
        throw new Error('Failed to register credential');
    }
}

/**
 * Revoke a credential
 */
export async function revokeCredential(
    tokenId: string,
    account: any
): Promise<string> {
    try {
        const contract = getCredentialNFTContract();

        const transaction = prepareContractCall({
            contract,
            method: "revokeCredential",
            params: [BigInt(tokenId)],
        });

        const result = await sendTransaction({
            transaction,
            account,
        });

        await waitForReceipt({
            client,
            chain: mantleSepolia,
            transactionHash: result.transactionHash,
        });

        return result.transactionHash;
    } catch (error) {
        console.error('Error revoking credential:', error);
        throw new Error('Failed to revoke credential');
    }
}

/**
 * Get the issuer address stored on blockchain for a token
 */
export async function getCredentialIssuer(tokenId: string): Promise<string> {
    try {
        const contract = getCredentialNFTContract();

        // Use readContract from thirdweb
        const { readContract } = await import('thirdweb');

        const issuer = await readContract({
            contract,
            method: "credentialIssuers",
            params: [BigInt(tokenId)],
        });

        return issuer as string;
    } catch (error) {
        console.error('Error getting credential issuer:', error);
        throw new Error('Failed to get credential issuer from blockchain');
    }
}

/**
 * Generate credential hash from metadata
 */
export function generateCredentialHash(metadata: any): string {
    const dataString = JSON.stringify(metadata);
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));
}

/**
 * Verify if a wallet address is valid
 */
export function isValidAddress(address: string): boolean {
    try {
        return ethers.utils.isAddress(address);
    } catch {
        return false;
    }
}
