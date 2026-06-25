import { NextRequest, NextResponse } from 'next/server';
import {
    createUserScopedServerClient,
    getServiceRoleClient,
    hasServiceRoleEnv,
    requireAuthenticatedRequest,
} from '@/lib/serverAuth';
import { enforceRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const STUDENT_CREDENTIALS_RATE_LIMIT = {
    windowSeconds: 60,
    maxRequests: 60,
    prefix: 'student-credentials',
} as const;

type CredentialRow = {
    id: string;
    token_id: string;
    ipfs_hash: string;
    blockchain_hash: string;
    metadata: unknown;
    issued_at: string;
    revoked: boolean;
    institution?: { name?: string }[] | { name?: string } | null;
};

export async function GET(request: NextRequest) {
    try {
        const rateLimitResponse = enforceRateLimit(request, STUDENT_CREDENTIALS_RATE_LIMIT);
        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        const authCheck = await requireAuthenticatedRequest(request);
        if (!authCheck.ok) {
            return NextResponse.json(
                { success: false, error: authCheck.error },
                { status: authCheck.status }
            );
        }

        const authHeader = request.headers.get('authorization') || '';
        const accessToken = authHeader.toLowerCase().startsWith('bearer ')
            ? authHeader.slice(7)
            : '';

        // Always prefer the service role client on the server side so RLS
        // never blocks legitimate server-to-server reads.
        // Falls back to a user-scoped client when the key is not configured.
        const supabase = hasServiceRoleEnv()
            ? getServiceRoleClient()
            : createUserScopedServerClient(accessToken);

        let { data: studentRow, error: studentError } = await supabase
            .from('students')
            .select('id, wallet_address')
            .eq('auth_user_id', authCheck.userId)
            .maybeSingle();

        if (studentError) {
            console.error('[student/credentials] Error fetching student row:', studentError);
            return NextResponse.json(
                { success: false, error: 'Failed to load student profile' },
                { status: 500 }
            );
        }

        // ── Auto-create the student row if it is missing ──────────────────────
        // This fixes students who registered after the secure RLS migration was
        // applied — their signUp() INSERT was silently blocked because auth.uid()
        // is NULL when using the anon client directly after supabase.auth.signUp().
        if (!studentRow) {
            console.warn(
                '[student/credentials] No student row found for userId:',
                authCheck.userId,
                '— attempting auto-create'
            );

            const serviceClient = hasServiceRoleEnv() ? getServiceRoleClient() : null;
            if (serviceClient) {
                const { data: authUser } = await serviceClient.auth.admin.getUserById(
                    authCheck.userId
                );
                const userEmail = authUser?.user?.email ?? '';
                const userName =
                    authUser?.user?.user_metadata?.name ??
                    userEmail.split('@')[0] ??
                    'Student';

                if (userEmail) {
                    const { data: newStudent, error: createError } = await serviceClient
                        .from('students')
                        .upsert(
                            { auth_user_id: authCheck.userId, name: userName, email: userEmail },
                            { onConflict: 'email', ignoreDuplicates: false }
                        )
                        .select('id, wallet_address')
                        .maybeSingle();

                    if (!createError && newStudent) {
                        studentRow = newStudent;
                        console.log(
                            '[student/credentials] Auto-created student row:',
                            newStudent.id
                        );
                    } else {
                        // E-mail collision — row exists with a different auth_user_id,
                        // try fetching the row by email and adopt it.
                        const { data: byEmail } = await serviceClient
                            .from('students')
                            .select('id, wallet_address')
                            .eq('email', userEmail)
                            .maybeSingle();
                        if (byEmail) studentRow = byEmail;
                    }
                }
            }
        }

        const fetchByStudentId = async (): Promise<CredentialRow[]> => {
            if (!studentRow?.id) return [];

            const { data, error } = await supabase
                .from('credentials')
                .select(
                    `id, token_id, ipfs_hash, blockchain_hash, metadata, issued_at, revoked,
                     institution:institutions(name)`
                )
                .eq('student_id', studentRow.id)
                .order('issued_at', { ascending: false });

            if (error) throw error;
            return (data || []) as CredentialRow[];
        };

        const fetchByWallet = async (): Promise<CredentialRow[]> => {
            if (!studentRow?.wallet_address) return [];

            const { data, error } = await supabase
                .from('credentials')
                .select(
                    `id, token_id, ipfs_hash, blockchain_hash, metadata, issued_at, revoked,
                     institution:institutions(name)`
                )
                .eq('student_wallet_address', studentRow.wallet_address)
                .order('issued_at', { ascending: false });

            if (error) throw error;
            return (data || []) as CredentialRow[];
        };

        const [byStudentId, byWallet] = await Promise.all([
            fetchByStudentId(),
            fetchByWallet(),
        ]);

        const merged = new Map<string, CredentialRow>();
        [...byStudentId, ...byWallet].forEach((c) => merged.set(c.id, c));

        const credentials = Array.from(merged.values())
            .map((c) => ({
                ...c,
                institution: Array.isArray(c.institution)
                    ? c.institution[0] || null
                    : c.institution || null,
            }))
            .sort(
                (a, b) =>
                    new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
            );

        return NextResponse.json({ success: true, credentials });
    } catch (err) {
        console.error('[student/credentials] Unhandled error:', err);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch student credentials' },
            { status: 500 }
        );
    }
}
