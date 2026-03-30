'use client';

import { ThirdwebProvider } from 'thirdweb/react';
import { stellarTestnet } from '@/lib/thirdweb';
import { AuthProvider } from '@/contexts/AuthContext';

/**
 * Root Providers Component
 * 
 * Note: For Stellar Network integration, we're using Thirdweb as a fallback.
 * Consider using stellar-sdk directly for native Stellar functionality.
 * 
 * Stellar SDK Integration (recommended):
 * - Install: npm install stellar-sdk
 * - Use StellarProvider context for wallet management
 * - Utilize Horizon API for querying account data
 * - Use Soroban SDK for smart contract interactions
 */
export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThirdwebProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
        </ThirdwebProvider>
    );
}
