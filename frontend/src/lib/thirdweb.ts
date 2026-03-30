import { createThirdwebClient, defineChain } from 'thirdweb';

// Create Thirdweb client
export const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Stellar Configuration (using Thirdweb's custom chain definition)
// Note: Stellar is not EVM-compatible. For full Stellar integration,
// consider using stellar-sdk directly alongside Thirdweb.

export const stellarTestnet = defineChain({
    id: 11155111, // Using placeholder ID for Stellar Testnet
    name: "Stellar Testnet",
    nativeCurrency: {
        name: "Lumens",
        symbol: "XLM",
        decimals: 7,
    },
    blockExplorers: [
        {
            name: "Stellar Expert (Testnet)",
            url: "https://stellar.expert/explorer/testnet",
        },
    ],
});

// Stellar Mainnet Configuration (for production)
export const stellarMainnet = defineChain({
    id: 11155112, // Using placeholder ID for Stellar Mainnet
    name: "Stellar Mainnet",
    nativeCurrency: {
        name: "Lumens",
        symbol: "XLM",
        decimals: 7,
    },
    blockExplorers: [
        {
            name: "Stellar Expert",
            url: "https://stellar.expert/explorer/public",
        },
    ],
});

// Active chain - change to stellarMainnet for production
export const activeChain = stellarTestnet;

// Contract addresses (Stellar contract addresses)
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

// Stellar-specific explorer URL helpers
export function getExplorerTxUrl(txHash: string): string {
    return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string): string {
    return `https://stellar.expert/explorer/testnet/account/${address}`;
}

// Stellar Network Configuration
export const STELLAR_CONFIG = {
    testnet: {
        horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org',
        sorobanRpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
        networkPassphrase: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
        chainId: 'testnet',
    },
    mainnet: {
        horizonUrl: 'https://horizon.stellar.org',
        sorobanRpcUrl: 'https://soroban-mainnet.stellar.org',
        networkPassphrase: 'Public Global Stellar Network ; September 2015',
        chainId: 'public',
    },
};
