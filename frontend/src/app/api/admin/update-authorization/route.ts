import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const { walletAddress, transactionHash } = await request.json();

        if (!walletAddress) {
            return NextResponse.json(
                { success: false, error: 'Wallet address is required' },
                { status: 400 }
            );
        }

        // Find institution by wallet address and update/verify them
        const { data: institution, error: findError } = await supabase
            .from('institutions')
            .select('*')
            .eq('wallet_address', walletAddress)
            .single();

        if (findError && findError.code !== 'PGRST116') {
            console.error('Error finding institution:', findError);
            return NextResponse.json(
                { success: false, error: 'Failed to find institution' },
                { status: 500 }
            );
        }

        if (institution) {
            // Update existing institution to mark as verified and store transaction hash
            const updateData: any = { verified: true };
            if (transactionHash) {
                updateData.authorization_tx_hash = transactionHash;
            }

            const { error: updateError } = await supabase
                .from('institutions')
                .update(updateData)
                .eq('id', institution.id);

            if (updateError) {
                console.error('Error updating institution:', updateError);
                return NextResponse.json(
                    { success: false, error: 'Failed to update institution' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Institution verified successfully',
                institution,
                transactionHash,
            });
        }

        // If no institution found with this wallet, return info but don't fail
        return NextResponse.json({
            success: true,
            message: 'Wallet authorized on blockchain. Institution will be linked when they connect.',
            wallet: walletAddress,
            transactionHash,
        });
    } catch (error) {
        console.error('Error in update-authorization:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to update authorization',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
