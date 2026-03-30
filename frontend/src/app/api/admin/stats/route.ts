import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // Fetch total institutions
        const { count: totalInstitutions, error: institutionsError } = await supabase
            .from('institutions')
            .select('*', { count: 'exact', head: true });

        if (institutionsError) {
            console.error('Error fetching institutions:', institutionsError);
        }

        // Fetch authorized institutions (those with wallet_address or verified status)
        // An institution is considered authorized if:
        // 1. They have a wallet_address set, OR
        // 2. They have issued at least one credential

        // First, get institutions with wallet addresses
        const { data: institutionsWithWallet, error: walletError } = await supabase
            .from('institutions')
            .select('id')
            .not('wallet_address', 'is', null);

        if (walletError) {
            console.error('Error fetching institutions with wallet:', walletError);
        }

        // Second, get institutions that have issued credentials
        const { data: institutionsWithCredentials, error: credsError } = await supabase
            .from('credentials')
            .select('institution_id');

        if (credsError) {
            console.error('Error fetching institutions with credentials:', credsError);
        }

        // Combine and deduplicate
        const authorizedInstitutionIds = new Set([
            ...(institutionsWithWallet?.map(i => i.id) || []),
            ...(institutionsWithCredentials?.map(c => c.institution_id) || [])
        ]);

        const authorizedInstitutions = authorizedInstitutionIds.size;

        // Fetch total credentials
        const { count: totalCredentials, error: credentialsError } = await supabase
            .from('credentials')
            .select('*', { count: 'exact', head: true });

        if (credentialsError) {
            console.error('Error fetching credentials:', credentialsError);
        }

        // Fetch active (non-revoked) credentials
        const { count: activeCredentials, error: activeError } = await supabase
            .from('credentials')
            .select('*', { count: 'exact', head: true })
            .eq('revoked', false);

        if (activeError) {
            console.error('Error fetching active credentials:', activeError);
        }

        // Fetch total students
        const { count: totalStudents, error: studentsError } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true });

        if (studentsError) {
            console.error('Error fetching students:', studentsError);
        }

        return NextResponse.json({
            success: true,
            stats: {
                totalInstitutions: totalInstitutions || 0,
                authorizedInstitutions: authorizedInstitutions || 0,
                totalCredentials: totalCredentials || 0,
                activeCredentials: activeCredentials || 0,
                totalStudents: totalStudents || 0,
            },
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch statistics',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
