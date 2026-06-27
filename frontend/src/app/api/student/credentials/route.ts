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
                { status: authCheck.status },
            );
        }

        const authHeader = request.headers.get('authorization') || '';
        const accessToken = authHeader.toLowerCase().startsWith('bearer ')
            ? authHeader.slice(7)
            : '';

        const supabase = hasServiceRoleEnv()
            ? getServiceRoleClient()
            : createUserScopedServerClient(accessToken);

        // ── Pagination & filter params ────────────────────────────────────────
        const { searchParams } = new URL(request.url);
        const rawPage     = parseInt(searchParams.get('page')     ?? '1');
        const rawPageSize = parseInt(searchParams.get('pageSize') ?? '20');
        const page     = Math.max(1, isNaN(rawPage)     ? 1  : rawPage);
        const pageSize = Math.min(100, Math.max(1, isNaN(rawPageSize) ? 20 : rawPageSize));
        const search   = searchParams.get('search')   ?? '';
        const status   = searchParams.get('status')   ?? 'all';
        const dateFrom = searchParams.get('dateFrom') ?? '';
        const dateTo   = searchParams.get('dateTo')   ?? '';
        const offset   = (page - 1) * pageSize;

        // ── Resolve student row ───────────────────────────────────────────────
        const { data: initialStudentRow, error: studentError } = await supabase
            .from('students')
            .select('id, wallet_address')
            .eq('auth_user_id', authCheck.userId)
            .maybeSingle();

        let studentRow = initialStudentRow;

        if (studentError) {
            console.error('[student/credentials] Error fetching student row:', studentError);
            return NextResponse.json(
                { success: false, error: 'Failed to load student profile' },
                { status: 500 },
            );
        }

        // ── Auto-create student row if missing ────────────────────────────────
        if (!studentRow) {
            console.warn(
                '[student/credentials] No student row found for userId:',
                authCheck.userId,
                '— attempting auto-create',
            );

            const serviceClient = hasServiceRoleEnv() ? getServiceRoleClient() : null;
            if (serviceClient) {
                const { data: authUser } = await serviceClient.auth.admin.getUserById(
                    authCheck.userId,
                );
                const userEmail = authUser?.user?.email ?? '';
                const userName =
                    authUser?.user?.user_metadata?.name ?? userEmail.split('@')[0] ?? 'Student';

                if (userEmail) {
                    const { data: newStudent, error: createError } = await serviceClient
                        .from('students')
                        .upsert(
                            { auth_user_id: authCheck.userId, name: userName, email: userEmail },
                            { onConflict: 'email', ignoreDuplicates: false },
                        )
                        .select('id, wallet_address')
                        .maybeSingle();

                    if (!createError && newStudent) {
                        studentRow = newStudent;
                        // eslint-disable-next-line no-console
                        console.log(
                            '[student/credentials] Auto-created student row:',
                            newStudent.id,
                        );
                    } else {
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

        if (!studentRow?.id) {
            return NextResponse.json({ success: true, credentials: [], total: 0, page, pageSize, totalPages: 0 });
        }

        // ── Build paginated query ─────────────────────────────────────────────
        let query = supabase
            .from('credentials')
            .select(
                `id, token_id, ipfs_hash, blockchain_hash, metadata, issued_at, revoked,
                 institution:institutions(name)`,
                { count: 'exact' }
            )
            .eq('student_id', studentRow.id)
            .order('issued_at', { ascending: false })
            .range(offset, offset + pageSize - 1);

        if (status === 'active')  query = query.eq('revoked', false);
        if (status === 'revoked') query = query.eq('revoked', true);
        if (dateFrom) query = query.gte('issued_at', dateFrom);
        if (dateTo)   query = query.lte('issued_at', dateTo + 'T23:59:59Z');
        if (search.trim()) {
            const term = search.trim();
            query = query.or(
                `token_id.ilike.%${term}%,` +
                `metadata->credentialData->>institutionName.ilike.%${term}%,` +
                `metadata->credentialData->>credentialType.ilike.%${term}%,` +
                `metadata->credentialData->>degree.ilike.%${term}%`
            );
        }

        const { data, error, count } = await query;
        if (error) throw error;

        const credentials = (data || []).map((c: CredentialRow) => ({
            ...c,
            institution: Array.isArray(c.institution)
                ? c.institution[0] || null
                : c.institution || null,
        }));

        return NextResponse.json({
            success: true,
            credentials,
            total: count ?? 0,
            page,
            pageSize,
            totalPages: Math.ceil((count ?? 0) / pageSize),
        });

    } catch (err) {
        console.error('[student/credentials] Unhandled error:', err);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch student credentials' },
            { status: 500 },
        );
    }
}