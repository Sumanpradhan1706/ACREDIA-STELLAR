import { createThirdwebClient, defineChain } from 'thirdweb';

// Create Thirdweb client
export const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Define Mantle Sepolia Testnet
export const mantleSepolia = defineChain({
    id: 5003,
    name: "Mantle Sepolia Testnet",
    nativeCurrency: {
        name: "MNT",
        symbol: "MNT",
        decimals: 18,
    },
    blockExplorers: [
        {
            name: "Mantle Sepolia Explorer",
            url: "https://sepolia.mantlescan.xyz",
        },
    ],
});

// Define Mantle Mainnet (for future use)
export const mantleMainnet = defineChain({
    id: 5000,
    name: "Mantle",
    nativeCurrency: {
        name: "MNT",
        symbol: "MNT",
        decimals: 18,
    },
    blockExplorers: [
        {
            name: "Mantle Explorer",
            url: "https://mantlescan.xyz",
        },
    ],
});

// Active chain - change to mantleMainnet for production
export const activeChain = mantleSepolia;

// Contract addresses (will be filled after deployment)
export const CONTRACTS = {
    CREDENTIAL_NFT: process.env.NEXT_PUBLIC_CREDENTIAL_NFT_CONTRACT || '',
    CREDENTIAL_REGISTRY: process.env.NEXT_PUBLIC_CREDENTIAL_REGISTRY_CONTRACT || '',
};

// Helper function to get contract
export function getContractAddress(contractName: keyof typeof CONTRACTS) {
    const address = CONTRACTS[contractName];
    if (!address) {
        console.warn(`Contract address for ${contractName} not set`);
    }
    return address;
}

// Block explorer URL helper
export function getExplorerTxUrl(txHash: string): string {
    return `https://sepolia.mantlescan.xyz/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string): string {
    return `https://sepolia.mantlescan.xyz/address/${address}`;
}
