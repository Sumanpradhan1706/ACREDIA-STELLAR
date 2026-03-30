'use client';

import { ThirdwebProvider } from 'thirdweb/react';
import { mantleSepolia } from '@/lib/thirdweb';
import { AuthProvider } from '@/contexts/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThirdwebProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
        </ThirdwebProvider>
    );
}
