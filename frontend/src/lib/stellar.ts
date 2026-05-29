import { rpc } from "@stellar/stellar-sdk";
import { debugWarn } from "./debug";

// Contract addresses (Stellar contract addresses)
export const CONTRACTS = {
    CREDENTIAL_NFT: process.env.NEXT_PUBLIC_CREDENTIAL_NFT_CONTRACT || '',
    CREDENTIAL_REGISTRY: process.env.NEXT_PUBLIC_CREDENTIAL_REGISTRY_CONTRACT || '',
};

export function getContractAddress(contractName: keyof typeof CONTRACTS) {
    const address = CONTRACTS[contractName];
    if (!address) {
        debugWarn(`Contract address for ${contractName} not set`);
    }
    return address;
}

// Stellar Network Configuration
export const STELLAR_CONFIG = {
    testnet: {
        horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org',
        sorobanRpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
        networkPassphrase: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
        networkName: 'testnet',
    },
    mainnet: {
        horizonUrl: 'https://horizon.stellar.org',
        sorobanRpcUrl: 'https://soroban-mainnet.stellar.org',
        networkPassphrase: 'Public Global Stellar Network ; September 2015',
        networkName: 'public',
    },
};

// Active network - change to mainnet for production
export const activeNetwork = STELLAR_CONFIG.testnet;

// Instantiate Soroban SDK Server helper
export const sorobanServer = new rpc.Server(activeNetwork.sorobanRpcUrl);

// Stellar-specific explorer URL helpers
export function getExplorerTxUrl(txHash: string): string {
    return `https://stellar.expert/explorer/${activeNetwork.networkName}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string): string {
    return `https://stellar.expert/explorer/${activeNetwork.networkName}/account/${address}`;
}
