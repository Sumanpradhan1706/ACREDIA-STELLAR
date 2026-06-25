'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, signOut, safeGetSession } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { resolveUserRoleClient } from '@/lib/roleResolver';
import type { AppRole, RoleState } from '@/types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    userRole: RoleState;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    userRole: 'loading',
    signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<RoleState>('loading');

    const resolveRole = async (nextUser: User | null) => {
        if (!nextUser) {
            setUserRole('unknown');
            return;
        }

        try {
            const role = await resolveUserRoleClient(supabase, nextUser);
            setUserRole(role);
        } catch {
            // Keep the app usable if resolution fails — fall back to unknown.
            setUserRole('unknown');
        }
    };

    useEffect(() => {
        // Check active sessions
        safeGetSession()
            .then(({ data: { session } }) => {
                const nextUser = session?.user ?? null;
                setUser(nextUser);
                resolveRole(nextUser);
                setLoading(false);
            })
            .catch(() => {
                setUser(null);
                setUserRole('unknown');
                setLoading(false);
            });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const nextUser = session?.user ?? null;
            setUser(nextUser);
            resolveRole(nextUser);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        await signOut();
        setUser(null);
        setUserRole('unknown');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                userRole,
                signOut: handleSignOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Protected route component
export function ProtectedRoute({
    children,
    allowedRoles,
}: {
    children: React.ReactNode;
    allowedRoles?: AppRole[];
}) {
    const { user, loading, userRole } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }

        if (
            !loading &&
            user &&
            allowedRoles &&
            userRole !== 'loading' &&
            userRole !== 'unknown' &&
            !allowedRoles.includes(userRole)
        ) {
            router.push('/dashboard');
        }
    }, [user, loading, userRole, router, allowedRoles]);

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md space-y-8 p-8 rounded-xl bg-slate-800/50 border border-slate-700/50 shadow-2xl backdrop-blur-sm">
                    <div className="flex justify-center mb-8">
                        <div className="h-16 w-16 animate-pulse rounded-2xl bg-slate-700"></div>
                    </div>
                    <div className="space-y-4">
                        <div className="h-6 w-3/4 animate-pulse rounded-lg bg-slate-700 mx-auto"></div>
                        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-700 mx-auto"></div>
                    </div>
                    <div className="space-y-4 pt-8 border-t border-slate-700/50">
                        <div className="h-12 w-full animate-pulse rounded-lg bg-slate-700"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (
        allowedRoles &&
        userRole !== 'loading' &&
        userRole !== 'unknown' &&
        !allowedRoles.includes(userRole)
    ) {
        return null;
    }

    return <>{children}</>;
}
