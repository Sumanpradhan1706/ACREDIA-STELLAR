import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/serverAuth';
import { sorobanServer, activeNetwork, getContractAddress } from '@/lib/stellar';
import {
    Contract,
    TransactionBuilder,
    Account,
    TimeoutInfinite,
    nativeToScVal,
    scValToNative,
    xdr,
} from '@stellar/stellar-sdk';

export const dynamic = 'force-dynamic';

// Dummy read-only address — no funds needed for simulation
const DUMMY_ADDRESS = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN';

async function simulateContractRead(method: string, args: any[]): Promise<any> {
    const contractId = getContractAddress('CREDENTIAL_NFT');
    if (!contractId) return null;

    const contract = new Contract(contractId);
    const sourceAccount = new Account(DUMMY_ADDRESS, '0');

    const tx = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: activeNetwork.networkPassphrase,
    })
        .addOperation(contract.call(method, ...args))
        .setTimeout(TimeoutInfinite)
        .build();

    const sim = await sorobanServer.simulateTransaction(tx as any);
    if ('error' in sim) return null;

    const retval = (sim as any).result?.retval;
    if (!retval) return null;

    try {
        if (typeof retval === 'string') {
            return scValToNative(xdr.ScVal.fromXDR(retval, 'base64'));
        }
        return scValToNative(retval);
    } catch {
        return null;
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
        const tokenIdArg = nativeToScVal(Number(token), { type: 'u64' });

        const [onChainCredential, onChainRevoked] = await Promise.all([
            simulateContractRead('get_credential', [tokenIdArg]),
            simulateContractRead('is_revoked', [tokenIdArg]),
        ]);

        // If the contract has no record for this token, the DB row cannot be trusted
        if (onChainCredential === null) {
            return NextResponse.json(
                { success: false, error: 'Credential not found on blockchain' },
                { status: 404 }
            );
        }

        // On-chain revocation is authoritative — override DB value
        const isRevoked = onChainRevoked === true || data.revoked === true;

        const institution = Array.isArray(data.institution)
            ? data.institution[0]
            : data.institution;

        const credentialData = data.metadata?.credentialData ?? {};
        const safeCredential = {
            tokenId: data.token_id,
            issuedAt: data.issued_at,
            revoked: isRevoked,
            revokedAt: data.revoked_at,
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
    } catch {
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
