import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/serverAuth';
import { getCredential, isRevoked } from '@/lib/contractReads';
import { deriveCredentialHash } from '@/lib/credentialHash';
import { enforceRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const VERIFY_RATE_LIMIT = {
    windowSeconds: 60,
    maxRequests: 10,
    prefix: 'verify',
} as const;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> },
) {
    try {
        const rateLimitResponse = enforceRateLimit(request, VERIFY_RATE_LIMIT);
        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        const { token: rawToken } = await params;
        const token = rawToken?.trim();

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Token is required' },
                { status: 400 },
            );
        }

        // ── 1. Fetch from Supabase ────────────────────────────────────────────
        const supabase = getServiceRoleClient();
        const { data, error } = await supabase
            .from('credentials')
            .select(
                `
                id,
                token_id,
                issued_at,
                revoked,
                revoked_at,
                metadata,
                metadata_schema_version,
                hash_algorithm,
                ipfs_hash,
                student_wallet_address,
                issuer_wallet_address,
                institution:institutions!credentials_institution_id_fkey (
                    name
                )
            `,
            )
            .eq('token_id', token)
            .maybeSingle();

        if (error) {
            return NextResponse.json(
                { success: false, error: 'Failed to query credential' },
                { status: 500 },
            );
        }

        if (!data) {
            return NextResponse.json(
                { success: false, error: 'Credential not found' },
                { status: 404 },
            );
        }

        // ── 2. Fetch from Soroban contract ────────────────────────────────────
        const [onChain, onChainRevoked] = await Promise.all([
            getCredential(data.token_id),
            isRevoked(data.token_id),
        ]);

        // ── 3. Cross-check ────────────────────────────────────────────────────
        const dbHash = data.metadata
            ? await deriveCredentialHash(
                  data.metadata,
                  data.metadata_schema_version,
                  data.hash_algorithm,
              )
            : null;
        const expectedUri = data.ipfs_hash ? `ipfs://${data.ipfs_hash}` : null;

        const onChainMatch =
            onChain !== null &&
            (() => {
                const issuerMatch =
                    data.issuer_wallet_address &&
                    onChain.issuer.toLowerCase() === data.issuer_wallet_address.toLowerCase();

                const studentMatch =
                    data.student_wallet_address &&
                    onChain.student.toLowerCase() === data.student_wallet_address.toLowerCase();

                const hashMatch = dbHash && onChain.hash === dbHash;

                const uriMatch = expectedUri && onChain.uri === expectedUri;

                return Boolean(issuerMatch && studentMatch && hashMatch && uriMatch);
            })();

        // Revocation: trust the chain over the DB (chain is authoritative)
        const revoked = onChainRevoked || data.revoked;

        const verified = onChain !== null && onChainMatch === true && !revoked;

        // ── 4. Build response ─────────────────────────────────────────────────
        const institution = Array.isArray(data.institution)
            ? data.institution[0]
            : data.institution;

        const credentialData = data.metadata?.credentialData ?? {};

        return NextResponse.json({
            success: true,
            credential: {
                tokenId: data.token_id,
                issuedAt: data.issued_at,
                revoked,
                revokedAt: data.revoked_at,
                institutionName: institution?.name ?? credentialData.institutionName ?? null,
                credentialType: credentialData.credentialType ?? null,
                degree: credentialData.degree ?? null,
                major: credentialData.major ?? null,
                issueDate: credentialData.issueDate ?? null,
            },
            verification: {
                verified,
                revoked,
                databaseMatch: data !== null,
                onChainMatch: onChainMatch === true,
                onChainFound: onChain !== null,
                // Granular mismatch details (useful for debugging / UI)
                checks: onChain
                    ? {
                          issuerMatch: data.issuer_wallet_address
                              ? onChain.issuer.toLowerCase() ===
                                data.issuer_wallet_address.toLowerCase()
                              : null,
                          studentMatch: data.student_wallet_address
                              ? onChain.student.toLowerCase() ===
                                data.student_wallet_address.toLowerCase()
                              : null,
                          hashMatch: dbHash ? onChain.hash === dbHash : null,
                          uriMatch: expectedUri ? onChain.uri === expectedUri : null,
                          notRevoked: !onChainRevoked,
                      }
                    : null,
            },
        });
    } catch (err: unknown) {
        if ((err instanceof Error ? err.message : String(err))?.startsWith('Missing contract configuration')) {
            return NextResponse.json(
                { success: false, error: 'Server configuration error' },
                { status: 500 },
            );
        }
        if (
            (err instanceof Error ? err.message : String(err))?.startsWith('Contract simulation error') ||
            (err instanceof Error ? err.message : String(err))?.startsWith('Failed to decode')
        ) {
            return NextResponse.json(
                { success: false, error: 'Blockchain verification unavailable' },
                { status: 503 },
            );
        }
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 },
        );
    }
}
