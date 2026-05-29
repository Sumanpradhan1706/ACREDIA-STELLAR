import { signTransaction } from '@stellar/freighter-api';
import {
    Account,
    Address,
    Contract,
    nativeToScVal,
    scValToNative,
    StrKey,
    TimeoutInfinite,
    TransactionBuilder,
    xdr,
} from '@stellar/stellar-sdk';
import { activeNetwork, getContractAddress, sorobanServer } from './stellar';
import { debugLog, debugWarn } from './debug';

export interface CredentialMetadata {
    studentAddress: string;
    credentialHash: string;
    ipfsHash: string;
    issuerAddress: string;
    issuedAt: number;
}

async function waitForConfirmation(hash: string, maxAttempts = 20): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise((res) => setTimeout(res, 1500));
        const response = await sorobanServer.getTransaction(hash);

        if (response.status === 'SUCCESS') {
            return response;
        }

        if (response.status === 'FAILED') {
            const resultMeta = (response as any).resultMetaXdr;
            throw new Error(
                `Transaction FAILED on-chain.\n` +
                    `Hash: ${hash}\n` +
                    `Result: ${resultMeta || 'No result metadata available'}`
            );
        }

        debugLog(`Waiting for transaction confirmation (attempt ${i + 1}).`);
    }

    throw new Error(`Transaction ${hash} not confirmed after ${maxAttempts} attempts`);
}

async function invokeContractMethod(
    contractId: string,
    method: string,
    args: any[],
    signerAddress: string
): Promise<{ transactionHash: string; result: any }> {
    const contract = new Contract(contractId);
    const sourceAccount = await sorobanServer.getAccount(signerAddress);

    const txBuilder = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: activeNetwork.networkPassphrase,
    })
        .addOperation(contract.call(method, ...args))
        .setTimeout(300);

    const transaction = txBuilder.build();

    debugLog(`Simulating contract method "${method}".`);
    const simResult = await sorobanServer.simulateTransaction(transaction as any);

    if ('error' in simResult) {
        const errStr = String((simResult as any).error);
        if (errStr.includes('Issuer not authorized') || errStr.includes('UnreachableCodeReached')) {
            throw new Error(
                `Your wallet is not authorized to issue credentials.\n\n` +
                    `The contract owner (admin) must first authorize your Stellar address:\n` +
                    `"${signerAddress}"\n\n` +
                    `Ask the admin to use Admin Dashboard -> Authorize Wallet.`
            );
        }

        throw new Error(`Simulation failed: ${errStr}`);
    }

    debugLog(`Preparing contract method "${method}".`);
    const preparedTx = await sorobanServer.prepareTransaction(transaction as any);

    debugLog('Signing transaction with Freighter.');
    const signedXdrResponse = await signTransaction(preparedTx.toXDR(), {
        networkPassphrase: activeNetwork.networkPassphrase,
        network: activeNetwork.networkName,
    } as any);

    const finalXdr =
        typeof signedXdrResponse === 'string'
            ? signedXdrResponse
            : (signedXdrResponse as any)?.signedTxXdr || Object.values(signedXdrResponse || {})[0];

    if (!finalXdr || typeof finalXdr !== 'string') {
        throw new Error(
            'Freighter signing failed or was canceled. Response: ' + JSON.stringify(signedXdrResponse)
        );
    }

    const signedTx = TransactionBuilder.fromXDR(finalXdr, activeNetwork.networkPassphrase);
    debugLog('Submitting signed transaction to Stellar.');
    const sendResponse = await sorobanServer.sendTransaction(signedTx as any);

    if (sendResponse.status === 'ERROR') {
        throw new Error(
            `Submission failed: ${sendResponse.errorResult?.toXDR('base64') || 'Unknown error'}`
        );
    }

    const resultValue = getSorobanTransactionResult(simResult);

    // Wait for on-chain confirmation
    console.log(`⏳ Waiting for confirmation (hash: ${sendResponse.hash})...`);
    debugLog('Waiting for on-chain confirmation.');
    await waitForConfirmation(sendResponse.hash);
    debugLog(`Contract method "${method}" confirmed on-chain.`);

    return {
        transactionHash: sendResponse.hash,
        result: resultValue,
    };
}

export function getSorobanTransactionResult(simResult: any): any {
    const rawResult =
        simResult?.result?.retval ||
        simResult?.result?.result?.retval ||
        simResult?.retval ||
        simResult?.result?.xdr?.retval;

    if (rawResult == null) {
        return null;
    }

    try {
        if (typeof rawResult === "string") {
            const scval = xdr.ScVal.fromXDR(rawResult, "base64");
            return scValToNative(scval);
        }

        if (typeof rawResult === "object" && (rawResult.switch || rawResult._switch)) {
            return scValToNative(rawResult);
        }

        return rawResult;
    } catch (e) {
        console.error("DEBUG getSorobanTransactionResult error:", e);
        return null;
    }
}

async function simulateRead(
    contractId: string,
    method: string,
    args: any[] = [],
    sourceAddress: string
): Promise<any> {
    const contract = new Contract(contractId);
    let sourceAccount;

    try {
        sourceAccount = await sorobanServer.getAccount(sourceAddress);
    } catch {
        sourceAccount = new Account(sourceAddress, '0');
    }

    const txBuilder = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: activeNetwork.networkPassphrase,
    })
        .addOperation(contract.call(method, ...args))
        .setTimeout(TimeoutInfinite);

    const sim = await sorobanServer.simulateTransaction(txBuilder.build() as any);
    if ('error' in sim) {
        debugWarn('simulateRead failed.', (sim as any).error);
        return null;
    }

    return getSorobanTransactionResult(sim);
}

export async function getContractOwner(callerAddress: string): Promise<string> {
    const contractId = getContractAddress('CREDENTIAL_NFT');
    if (!contractId) {
        debugWarn('Contract address is unavailable while loading owner.');
        return '';
    }

    try {
        const result = await simulateRead(contractId, 'get_owner', [], callerAddress);
        return result || '';
    } catch (error: any) {
        debugWarn('Failed to load contract owner.', error?.message || String(error));
        return '';
    }
}

export async function isAuthorizedIssuer(
    issuerAddress: string,
    callerAddress: string
): Promise<boolean> {
    const contractId = getContractAddress('CREDENTIAL_NFT');

    try {
        const result = await simulateRead(
            contractId,
            'is_authorized_issuer',
            [new Address(issuerAddress).toScVal()],
            callerAddress
        );
        return result === true;
    } catch (error) {
        debugWarn('Failed to check issuer authorization.', error);
        return false;
    }
}

export async function authorizeIssuer(adminAddress: string, issuerAddress: string): Promise<string> {
    const contractId = getContractAddress('CREDENTIAL_NFT');
    const args = [new Address(issuerAddress).toScVal()];
    const { transactionHash } = await invokeContractMethod(contractId, "authorize_issuer", args, adminAddress);
    return transactionHash;
}

export function ensureValidTokenId(tokenId: unknown): string {
    let normalized: string;

    if (typeof tokenId === "bigint") {
        normalized = tokenId.toString();
    } else if (typeof tokenId === "number") {
        normalized = Number.isSafeInteger(tokenId) ? tokenId.toString() : "";
    } else if (typeof tokenId === "string") {
        normalized = tokenId;
    } else {
        normalized = "";
    }

    if (!/^[1-9][0-9]*$/.test(normalized)) {
        throw new Error(
            `Invalid token ID returned from Soroban contract: ${JSON.stringify(tokenId)}.`
        );
    }

    return normalized;
}

export async function issueCredentialOnStellar(
    studentAddress: string,
    credentialHash: string,
    ipfsUri: string,
    issuerAddress: string
): Promise<{ tokenId: string; transactionHash: string }> {
    debugLog('Issuing credential on Stellar.');

    const authorized = await isAuthorizedIssuer(issuerAddress, issuerAddress);
    if (!authorized) {
        throw new Error(
            `Your wallet ("${issuerAddress}") is not authorized to issue credentials.\n\n` +
                `The contract admin must authorize your wallet first via:\n` +
                `Admin Dashboard -> "Authorize Wallet" -> enter your Stellar address.`
        );
    }

    const contractId = getContractAddress('CREDENTIAL_NFT');
    const args = [
        new Address(studentAddress).toScVal(),
        new Address(issuerAddress).toScVal(),
        nativeToScVal(credentialHash, { type: 'string' }),
        nativeToScVal(ipfsUri, { type: 'string' }),
    ];

    const { transactionHash, result } = await invokeContractMethod(contractId, "issue_credential", args, issuerAddress);
    const tokenId = ensureValidTokenId(result);

    console.log("✅ Credential issued on Stellar Network. Tx:", transactionHash);
    console.log("✅ Contract returned token ID:", tokenId);
    return {
        tokenId,
        transactionHash,
    };
}

export async function revokeCredentialOnStellar(tokenId: string, issuerAddress: string): Promise<string> {
    console.log("🗑️ Revoking credential on Stellar Network...");
    const contractId = getContractAddress("CREDENTIAL_NFT");
    const validatedTokenId = ensureValidTokenId(tokenId);

    const args = [
        nativeToScVal(Number(validatedTokenId), { type: "u64" }),
        new Address(issuerAddress).toScVal(),
    ];

    const { transactionHash } = await invokeContractMethod(contractId, "revoke_credential", args, issuerAddress);
    console.log("✅ Credential revoked on Stellar Network. Tx:", transactionHash);
    return transactionHash;
}

export async function generateCredentialHash(metadata: any): Promise<string> {
    const dataString = JSON.stringify(metadata);
    const msgUint8 = new TextEncoder().encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function isValidStellarAddress(address: string): boolean {
    return StrKey.isValidEd25519PublicKey(address);
}

export function isValidAddress(address: string): boolean {
    return isValidStellarAddress(address);
}

export function formatStellarAddress(address: string, length = 8): string {
    if (!address || address.length < 2 * length) return address;
    return `${address.substring(0, length)}...${address.substring(address.length - length)}`;
}
