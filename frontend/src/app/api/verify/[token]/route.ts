import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/serverAuth';
import { activeNetwork, getContractAddress, sorobanServer } from '@/lib/stellar';
import {
    Account,
    Contract,
    TransactionBuilder,
    TimeoutInfinite,
    nativeToScVal,
    scValToNative,
    xdr,
} from '@stellar/stellar-sdk';

export const dynamic = 'force-dynamic';

// Dummy read-only address — no funds needed for simulation
const DUMMY_ADDRESS = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN';

// Sentinel to distinguish "credential absent from chain" from infrastructure errors
const NOT_FOUND_ON_CHAIN = Symbol('NOT_FOUND_ON_CHAIN');

async function simulateContractRead(method: string, args: any[]): Promise<any> {
    const contractId = getContractAddress('CREDENTIAL_NFT');
    if (!contractId) {
        throw new Error('Missing contract configuration for CREDENTIAL_NFT');
    }

    const contract = new Contract(contractId);
    const sourceAccount = new Account(DUMMY_ADDRESS, '0');

    const tx = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: activeNetwork.networkPassphrase,
    })
        .addOperation(contract.call(method, ...args))
        .setTimeout(TimeoutInfinite)
        .build();

    // Network/RPC errors propagate as thrown exceptions (caller maps to 503)
    const sim = await sorobanServer.simulateTransaction(tx as any);

    if ('error' in sim) {
        const errStr = String((sim as any).error);
        // Contract returning "not found" / missing entry is a known absence, not an infra error
        if (errStr.includes('not found') || errStr.includes('MissingValue') || errStr.includes('KeyNotFound')) {
            return NOT_FOUND_ON_CHAIN;
        }
        throw new Error(`Contract simulation error: ${errStr}`);
    }

    const retval = (sim as any).result?.retval;
    // No retval on a successful sim means the entry doesn't exist (e.g. Option::None)
    if (!retval) return NOT_FOUND_ON_CHAIN;

    try {
        if (typeof retval === 'string') {
            return scValToNative(xdr.ScVal.fromXDR(retval, 'base64'));
        }
        // Failsafe for boolean ScVal objects where SDK swallowed the prototype
        if (typeof retval === 'object' && !retval.switch && retval._switch?.name === 'scvBool') {
            return retval._value;
        }
        return scValToNative(retval);
    } catch {
        // Parse failure is an infrastructure problem, not a missing credential
        throw new Error('Failed to decode contract response');
    }
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token: rawToken } = await params;
        const token = rawToken?.trim();

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Token is required' },
                { status: 400 }
            );
        }

        // Validate token is a safe non-negative integer before passing to contract
        if (!/^\d+$/.test(token) || Number(token) > Number.MAX_SAFE_INTEGER) {
            return NextResponse.json(
                { success: false, error: 'Invalid token ID' },
                { status: 400 }
            );
        }

        const supabase = getServiceRoleClient();
        const { data, error } = await supabase
            .from('credentials')
            .select(`
                id,
                token_id,
                issued_at,
                revoked,
                revoked_at,
                metadata,
                institution:institutions!credentials_institution_id_fkey (
                    name
                )
            `)
            .eq('token_id', token)
            .maybeSingle();

        if (error) {
            return NextResponse.json(
                { success: false, error: 'Failed to verify credential' },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { success: false, error: 'Credential not found' },
                { status: 404 }
            );
        }

        // --- On-chain verification ---
        // get_credential returns the full struct including revoked; no need for a separate is_revoked call
        const tokenIdArg = nativeToScVal(Number(token), { type: 'u64' });
        const onChainCredential = await simulateContractRead('get_credential', [tokenIdArg]);

        // If the contract has no record for this token, the DB row cannot be trusted
        if (onChainCredential === NOT_FOUND_ON_CHAIN) {
            return NextResponse.json(
                { success: false, error: 'Credential not found on blockchain' },
                { status: 404 }
            );
        }

        // On-chain revocation is authoritative — if the chain result is unreadable, fail safe
        if (typeof onChainCredential.revoked !== 'boolean') {
            return NextResponse.json(
                { success: false, error: 'Unable to determine revocation status from blockchain' },
                { status: 503 }
            );
        }
        const isRevoked = onChainCredential.revoked === true;

        const institution = Array.isArray(data.institution)
            ? data.institution[0]
            : data.institution;

        const credentialData = data.metadata?.credentialData ?? {};
        const safeCredential = {
            tokenId: data.token_id,
            issuedAt: data.issued_at,
            revoked: isRevoked,
            revokedAt: isRevoked ? data.revoked_at : null,
            institutionName: institution?.name ?? credentialData.institutionName ?? null,
            credentialType: credentialData.credentialType ?? null,
            degree: credentialData.degree ?? null,
            major: credentialData.major ?? null,
            issueDate: credentialData.issueDate ?? null,
            onChainVerified: true,
        };

        return NextResponse.json({
            success: true,
            credential: safeCredential,
        });
    } catch (err: any) {
        if (err?.message?.startsWith('Missing contract configuration')) {
            return NextResponse.json(
                { success: false, error: 'Server configuration error' },
                { status: 500 }
            );
        }
        if (err?.message?.startsWith('Contract simulation error') || err?.message?.startsWith('Failed to decode')) {
            return NextResponse.json(
                { success: false, error: 'Blockchain verification unavailable' },
                { status: 503 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
