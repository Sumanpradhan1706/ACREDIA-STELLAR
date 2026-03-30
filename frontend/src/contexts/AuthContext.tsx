'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, signOut } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    userRole: 'institution' | 'student' | null;
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
    const [userRole, setUserRole] = useState<'institution' | 'student' | null>(null);

    useEffect(() => {
        // Check active sessions
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setUserRole(session?.user?.user_metadata?.role ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setUserRole(session?.user?.user_metadata?.role ?? null);
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
    allowedRoles?: ('institution' | 'student')[];
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
