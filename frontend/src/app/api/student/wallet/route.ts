import { NextRequest, NextResponse } from 'next/server';
import {
    createUserScopedServerClient,
    getServiceRoleClient,
    hasServiceRoleEnv,
    requireAuthenticatedRequest,
} from '@/lib/serverAuth';
import { isValidAddress } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
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

        const payload = await request.json().catch(() => null);
        const rawWallet = typeof payload?.walletAddress === 'string'
            ? payload.walletAddress.trim()
            : '';

        if (!rawWallet) {
            return NextResponse.json(
                { success: false, error: 'Wallet address is required' },
                { status: 400 }
            );
        }

        const walletAddress = rawWallet.toUpperCase();
        if (!isValidAddress(walletAddress)) {
            return NextResponse.json(
                { success: false, error: 'Invalid wallet address' },
                { status: 400 }
            );
        }

        const supabase = hasServiceRoleEnv()
            ? getServiceRoleClient()
            : createUserScopedServerClient(accessToken);

        const { data: studentRow, error: studentError } = await supabase
            .from('students')
            .select('id, wallet_address')
            .eq('auth_user_id', authCheck.userId)
            .maybeSingle();

        if (studentError) {
            console.error('[student/wallet] Error fetching student row:', studentError);
            return NextResponse.json(
                { success: false, error: 'Failed to load student profile' },
                { status: 500 }
            );
        }

        if (!studentRow) {
            return NextResponse.json(
                { success: false, error: 'Student profile not found' },
                { status: 404 }
            );
        }

        if (studentRow.wallet_address?.toLowerCase() === walletAddress.toLowerCase()) {
            return NextResponse.json({ success: true, walletAddress });
        }

        if (hasServiceRoleEnv()) {
            const { data: existingRow, error: existingError } = await supabase
                .from('students')
                .select('id, auth_user_id, wallet_address')
                .eq('wallet_address', walletAddress)
                .maybeSingle();

            if (existingError) {
                console.error('[student/wallet] Error checking wallet ownership:', existingError);
                return NextResponse.json(
                    { success: false, error: 'Failed to verify wallet ownership' },
                    { status: 500 }
                );
            }

            if (existingRow && existingRow.id !== studentRow.id) {
                return NextResponse.json(
                    { success: false, error: 'Unable to link wallet address' },
                    { status: 409 }
                );
            }
        }

        const { data: updated, error: updateError } = await supabase
            .from('students')
            .update({ wallet_address: walletAddress })
            .eq('id', studentRow.id)
            .select('id, wallet_address')
            .maybeSingle();

        if (updateError) {
            const status = updateError?.code === '23505' ? 409 : 500;
            return NextResponse.json(
                { success: false, error: 'Unable to link wallet address' },
                { status }
            );
        }

        return NextResponse.json({
            success: true,
            walletAddress: updated?.wallet_address ?? walletAddress,
        });
    } catch (error) {
        console.error('[student/wallet] Unhandled error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to link wallet address' },
            { status: 500 }
        );
    }
}
