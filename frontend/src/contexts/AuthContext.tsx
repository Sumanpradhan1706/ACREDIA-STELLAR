'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, signOut, safeGetSession } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { normalizePublicSignupRole } from '@/lib/adminAccess';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    userRole: 'institution' | 'student' | 'admin' | null;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    userRole: null,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<'institution' | 'student' | 'admin' | null>(null);

    const resolveUserRole = async (nextUser: User | null) => {
        if (!nextUser) {
            setUserRole(null);
            return;
        }

        const metadataRole = nextUser.user_metadata?.role;
        if (metadataRole) {
            setUserRole(normalizePublicSignupRole(metadataRole));
            return;
        }

        // Fallback role resolution for environments where metadata role is missing.
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', nextUser.id)
            .maybeSingle();

        if (profile?.role === 'admin' || profile?.role === 'institution' || profile?.role === 'student') {
            setUserRole(profile.role);
            return;
        }

        const { data: institutionRow } = await supabase
            .from('institutions')
            .select('id')
            .eq('auth_user_id', nextUser.id)
            .maybeSingle();

        if (institutionRow?.id) {
            setUserRole('institution');
            return;
        }

        const { data: studentRow } = await supabase
            .from('students')
            .select('id')
            .eq('auth_user_id', nextUser.id)
            .maybeSingle();

        if (studentRow?.id) {
            setUserRole('student');
            return;
        }

        // Keep app usable if role data is absent.
        setUserRole('student');
    };

    useEffect(() => {
        // Check active sessions
        safeGetSession().then(({ data: { session } }) => {
            const nextUser = session?.user ?? null;
            setUser(nextUser);
            resolveUserRole(nextUser).catch(() => setUserRole(nextUser ? 'student' : null));
            setLoading(false);
        }).catch(() => {
            setUser(null);
            setUserRole(null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const nextUser = session?.user ?? null;
            setUser(nextUser);
            resolveUserRole(nextUser).catch(() => setUserRole(nextUser ? 'student' : null));
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        await signOut();
        setUser(null);
        setUserRole(null);
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
    allowedRoles?: ('institution' | 'student' | 'admin')[];
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
            userRole &&
            !allowedRoles.includes(userRole)
        ) {
            router.push('/dashboard');
        }
    }, [user, loading, userRole, router, allowedRoles]);

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
        return null;
    }

    return <>{children}</>;
}
