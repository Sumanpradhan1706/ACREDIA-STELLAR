import { activeNetwork, sorobanServer, getContractAddress } from "./stellar";
import { signTransaction } from "@stellar/freighter-api";
import {
    Address,
    nativeToScVal,
    scValToNative,
    TransactionBuilder,
    TimeoutInfinite,
    StrKey,
    Contract,
    Account,
    xdr,
} from "@stellar/stellar-sdk";

export interface CredentialMetadata {
    studentAddress: string;
    credentialHash: string;
    ipfsHash: string;
    issuerAddress: string;
    issuedAt: number;
}

/**
 * Poll for transaction confirmation after sendTransaction()
 * Soroban transactions are async — sendTransaction() only queues them.
 */
async function waitForConfirmation(hash: string, maxAttempts = 20): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise((res) => setTimeout(res, 1500));
        const response = await sorobanServer.getTransaction(hash);

        if (response.status === "SUCCESS") {
            return response;
        }
        if (response.status === "FAILED") {
            const resultMeta = (response as any).resultMetaXdr;
            throw new Error(
                `Transaction FAILED on-chain.\n` +
                `Hash: ${hash}\n` +
                `Result: ${resultMeta || "No result metadata available"}`
            );
        }
        // Status is "NOT_FOUND" or "PENDING" — keep polling
        console.log(`⏳ Waiting for confirmation (attempt ${i + 1})...`);
    }
    throw new Error(`Transaction ${hash} not confirmed after ${maxAttempts} attempts`);
}

/**
 * Core smart contract invocation helper for Soroban.
 * Handles transaction building, simulation, Freighter signing, submission, and confirmation polling.
 */
async function invokeContractMethod(
    contractId: string,
    method: string,
    args: any[],
    signerAddress: string
): Promise<{ transactionHash: string; result: any }> {
    const contract = new Contract(contractId);
    const sourceAccount = await sorobanServer.getAccount(signerAddress);

    const txBuilder = new TransactionBuilder(sourceAccount, {
        fee: "100",
        networkPassphrase: activeNetwork.networkPassphrase,
    })
        .addOperation(contract.call(method, ...args))
        .setTimeout(300);

    const transaction = txBuilder.build();

    // Simulate first — this catches authorization and logic errors BEFORE submitting
    console.log(`🔍 Simulating ${method}...`);
    const simResult = await sorobanServer.simulateTransaction(transaction as any);

    if ("error" in simResult) {
        const errStr = String((simResult as any).error);
        // Parse common contract panics into human-readable messages
        if (errStr.includes("Issuer not authorized") || errStr.includes("UnreachableCodeReached")) {
            throw new Error(
                `❌ Your wallet is not authorized to issue credentials.\n\n` +
                `The contract owner (admin) must first authorize your Stellar address:\n` +
                `"${signerAddress}"\n\n` +
                `Ask the admin to use Admin Dashboard → Authorize Wallet.`
            );
        }
        throw new Error(`Simulation failed: ${errStr}`);
    }

    // Prepare (adds resource fees from simulation result)
    console.log(`📝 Preparing ${method}...`);
    const preparedTx = await sorobanServer.prepareTransaction(transaction as any);

    // Sign with Freighter wallet
    console.log(`✍️ Signing with Freighter...`);
    const signedXdrResponse = await signTransaction(preparedTx.toXDR(), {
        networkPassphrase: activeNetwork.networkPassphrase,
        network: activeNetwork.networkName,
    } as any);

    // Support both Freighter v5 (returns string) and v6 (returns object)
    const finalXdr = typeof signedXdrResponse === "string" 
        ? signedXdrResponse 
        : (signedXdrResponse as any)?.signedTxXdr || Object.values(signedXdrResponse || {})[0];

    if (!finalXdr || typeof finalXdr !== "string") {
        throw new Error("❌ Freighter signing failed or was canceled. Response: " + JSON.stringify(signedXdrResponse));
    }

    // Submit to network
    const signedTx = TransactionBuilder.fromXDR(finalXdr, activeNetwork.networkPassphrase);
    console.log(`📡 Submitting to Stellar network...`);
    const sendResponse = await sorobanServer.sendTransaction(signedTx as any);

    if (sendResponse.status === "ERROR") {
        throw new Error(
            `Submission failed: ${sendResponse.errorResult?.toXDR("base64") || "Unknown error"}`
        );
    }

    const resultValue = getSorobanTransactionResult(simResult);

    // Wait for on-chain confirmation
    console.log(`⏳ Waiting for confirmation (hash: ${sendResponse.hash})...`);
    await waitForConfirmation(sendResponse.hash);
    console.log(`✅ ${method} confirmed on-chain.`);

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

/**
 * Read-only simulation helper (no auth, no submission)
 */
async function simulateRead(contractId: string, method: string, args: any[] = [], sourceAddress: string): Promise<any> {
    const contract = new Contract(contractId);
    let sourceAccount;
    try {
        sourceAccount = await sorobanServer.getAccount(sourceAddress);
    } catch {
        // If the wallet is empty/unfunded (0 XLM), it won't exist on the ledger yet.
        // For read-only simulations, we can bypass this by constructing a dummy Account struct.
        sourceAccount = new Account(sourceAddress, "0");
    }

    const txBuilder = new TransactionBuilder(sourceAccount, {
        fee: "100",
        networkPassphrase: activeNetwork.networkPassphrase,
    })
        .addOperation(contract.call(method, ...args))
        .setTimeout(TimeoutInfinite);

    const sim = await sorobanServer.simulateTransaction(txBuilder.build() as any);
    if ("error" in sim) {
        console.error("DEBUG simulateRead errored:", (sim as any).error);
        return null;
    }

    return getSorobanTransactionResult(sim);
}

/**
 * Get the contract owner address
 */
export async function getContractOwner(callerAddress: string): Promise<string> {
    const contractId = getContractAddress("CREDENTIAL_NFT");
    if (!contractId) {
        console.error("DEBUG: Contract ID is empty!");
        return "";
    }
    try {
        const result = await simulateRead(contractId, "get_owner", [], callerAddress);
        return result || "";
    } catch (e: any) {
        console.error("DEBUG getContractOwner error:", e?.message || String(e));
        return "";
    }
}

/**
 * Check if a Stellar address is an authorized issuer
 */
export async function isAuthorizedIssuer(issuerAddress: string, callerAddress: string): Promise<boolean> {
    const contractId = getContractAddress("CREDENTIAL_NFT");
    try {
        const result = await simulateRead(contractId, "is_authorized_issuer", [
            new Address(issuerAddress).toScVal(),
        ], callerAddress);
        console.log("DEBUG isAuthorizedIssuer returned:", result);
        return result === true;
    } catch (e: any) {
        console.error("DEBUG isAuthorizedIssuer error:", e);
        return false;
    }
}

/**
 * Authorize an issuer (admin only)
 */
export async function authorizeIssuer(adminAddress: string, issuerAddress: string): Promise<string> {
    const contractId = getContractAddress("CREDENTIAL_NFT");
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

/**
 * Issue a credential on the Stellar Network
 */
export async function issueCredentialOnStellar(
    studentAddress: string,
    credentialHash: string,
    ipfsUri: string,
    issuerAddress: string
): Promise<{ tokenId: string; transactionHash: string }> {
    console.log("🚀 Issuing credential on Stellar Network...");
    console.log("  Student:", studentAddress);
    console.log("  Issuer:", issuerAddress);

    // Pre-flight: check authorization before wasting the user's time
    const authorized = await isAuthorizedIssuer(issuerAddress, issuerAddress);
    if (!authorized) {
        throw new Error(
            `❌ Your wallet ("${issuerAddress}") is not authorized to issue credentials.\n\n` +
            `The contract admin must authorize your wallet first via:\n` +
            `Admin Dashboard → "Authorize Wallet" → enter your Stellar address.`
        );
    }

    const contractId = getContractAddress("CREDENTIAL_NFT");
    const args = [
        new Address(studentAddress).toScVal(),
        new Address(issuerAddress).toScVal(),
        nativeToScVal(credentialHash, { type: "string" }),
        nativeToScVal(ipfsUri, { type: "string" }),
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

/**
 * Revoke a credential on the Stellar Network
 */
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

/**
 * Generate SHA-256 credential hash from metadata using the Browser Crypto API
 */
export async function generateCredentialHash(metadata: any): Promise<string> {
    const dataString = JSON.stringify(metadata);
    const msgUint8 = new TextEncoder().encode(dataString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Validate a Stellar public key
 */
export function isValidStellarAddress(address: string): boolean {
    return StrKey.isValidEd25519PublicKey(address);
}

export function isValidAddress(address: string): boolean {
    return isValidStellarAddress(address);
}

export function formatStellarAddress(address: string, length: number = 8): string {
    if (!address || address.length < 2 * length) return address;
    return `${address.substring(0, length)}...${address.substring(address.length - length)}`;
}
