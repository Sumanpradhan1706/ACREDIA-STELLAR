/**
 * Server-side Soroban read helpers.
 * These run in Node.js (API routes) — no Freighter, no browser SDK quirks.
 * All functions use simulateTransaction for read-only contract calls.
 */
import {
    rpc,
    Contract,
    TransactionBuilder,
    Account,
    TimeoutInfinite,
    Address,
    nativeToScVal,
    scValToNative,
    xdr,
} from "@stellar/stellar-sdk";

const RPC_URL =
    process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE =
    process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";
const CONTRACT_ID =
    process.env.NEXT_PUBLIC_CREDENTIAL_NFT_CONTRACT || "";

// Dummy funded account used as transaction source for read-only simulations.
// The contract itself is always present on-ledger, so we borrow its address.
const DUMMY_SOURCE = CONTRACT_ID;

const server = new rpc.Server(RPC_URL);

export interface OnChainCredential {
    student: string;
    issuer: string;
    hash: string;
    uri: string;
    issued_at: bigint | number;
}

async function simulate(method: string, args: xdr.ScVal[]): Promise<unknown> {
    if (!CONTRACT_ID) throw new Error("CONTRACT_ID not configured");

    const contract = new Contract(CONTRACT_ID);
    // Use a dummy Account with sequence "0" — valid for read-only simulation
    const source = new Account(DUMMY_SOURCE, "0");

    const tx = new TransactionBuilder(source, {
        fee: "100",
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(contract.call(method, ...args))
        .setTimeout(TimeoutInfinite)
        .build();

    const sim = await server.simulateTransaction(tx as any);

    if ("error" in sim) {
        throw new Error(`Simulation error (${method}): ${(sim as any).error}`);
    }

    const retval = (sim as any).result?.retval;
    if (retval === undefined || retval === null) return null;

    // retval may be an xdr.ScVal object or a base64 string depending on SDK version
    if (typeof retval === "string") {
        return scValToNative(xdr.ScVal.fromXDR(retval, "base64"));
    }
    return scValToNative(retval);
}

/**
 * Fetch full credential struct by token_id (u64).
 * Returns null if the token does not exist on-chain.
 */
export async function getCredential(tokenId: string | number): Promise<OnChainCredential | null> {
    try {
        const result = await simulate("get_credential", [
            nativeToScVal(Number(tokenId), { type: "u64" }),
        ]);
        if (!result || typeof result !== "object") return null;
        const r = result as Record<string, unknown>;
        return {
            student: String(r.student ?? ""),
            issuer: String(r.issuer ?? ""),
            hash: String(r.hash ?? ""),
            uri: String(r.uri ?? ""),
            issued_at: (r.issued_at as bigint | number) ?? 0,
        };
    } catch {
        return null;
    }
}

/**
 * Look up a credential by its SHA-256 hash.
 * Returns the token_id (number) or null if not found.
 */
export async function verifyCredentialByHash(hash: string): Promise<number | null> {
    try {
        const result = await simulate("verify_credential", [
            nativeToScVal(hash, { type: "string" }),
        ]);
        if (result === null || result === undefined) return null;
        return Number(result);
    } catch {
        return null;
    }
}

/**
 * Check whether a credential has been revoked on-chain.
 */
export async function isRevoked(tokenId: string | number): Promise<boolean> {
    try {
        const result = await simulate("is_revoked", [
            nativeToScVal(Number(tokenId), { type: "u64" }),
        ]);
        return result === true;
    } catch {
        return false;
    }
}
