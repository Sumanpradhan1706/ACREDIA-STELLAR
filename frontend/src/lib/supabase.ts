import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Direct exports for easier imports
export async function signUp(email: string, password: string, options?: { data?: any }) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options,
    });

    // Create student or institution record after successful signup
    if (!error && data.user && options?.data) {
        const { role, name } = options.data;
        const userId = data.user.id;
        const email = data.user.email!;

        if (role === 'student') {
            await supabase
                .from('students')
                .insert([{ auth_user_id: userId, name, email }]);
        } else if (role === 'institution') {
            await supabase
                .from('institutions')
                .insert([{ auth_user_id: userId, name, email }]);
        }
    }

    return { data, error };
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

// Helper functions for authentication
export const authHelpers = {
    async signUp(email: string, password: string, role: 'institution' | 'student') {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role,
                },
            },
        });
        return { data, error };
    },

    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    async getSession() {
        const { data, error } = await supabase.auth.getSession();
        return { data: data.session, error };
    },

    async getUser() {
        const { data, error } = await supabase.auth.getUser();
        return { data: data.user, error };
    },
};

// Database helpers
export const dbHelpers = {
    // Institutions
    async createInstitution(userId: string, name: string, email: string) {
        const { data, error } = await supabase
            .from('institutions')
            .insert([{ auth_user_id: userId, name, email }])
            .select()
            .single();
        return { data, error };
    },

    async getInstitution(userId: string) {
        const { data, error } = await supabase
            .from('institutions')
            .select('*')
            .eq('auth_user_id', userId)
            .single();
        return { data, error };
    },

    async updateInstitutionWallet(institutionId: string, walletAddress: string) {
        const { data, error } = await supabase
            .from('institutions')
            .update({ wallet_address: walletAddress })
            .eq('id', institutionId)
            .select()
            .single();
        return { data, error };
    },

    // Students
    async createStudent(userId: string, name: string, email: string) {
        const { data, error } = await supabase
            .from('students')
            .insert([{ auth_user_id: userId, name, email }])
            .select()
            .single();
        return { data, error };
    },

    async getStudent(userId: string) {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('auth_user_id', userId)
            .single();
        return { data, error };
    },

    async getStudentByWallet(walletAddress: string) {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('wallet_address', walletAddress)
            .single();
        return { data, error };
    },

    async updateStudentWallet(studentId: string, walletAddress: string) {
        const { data, error } = await supabase
            .from('students')
            .update({ wallet_address: walletAddress })
            .eq('id', studentId)
            .select()
            .single();
        return { data, error };
    },

    // Credentials
    async createCredential(credential: {
        student_id: string;
        institution_id: string;
        token_id: string;
        ipfs_hash: string;
        blockchain_hash: string;
        metadata: any;
    }) {
        const { data, error } = await supabase
            .from('credentials')
            .insert([credential])
            .select()
            .single();
        return { data, error };
    },

    async getCredentialsByStudent(studentId: string) {
        const { data, error } = await supabase
            .from('credentials')
            .select(`
        *,
        institutions (
          id,
          name,
          email
        )
      `)
            .eq('student_id', studentId)
            .eq('revoked', false)
            .order('issued_at', { ascending: false });
        return { data, error };
    },

    async getCredentialsByInstitution(institutionId: string) {
        const { data, error } = await supabase
            .from('credentials')
            .select(`
        *,
        students (
          id,
          name,
          email
        )
      `)
            .eq('institution_id', institutionId)
            .order('issued_at', { ascending: false });
        return { data, error };
    },

    async getCredentialByTokenId(tokenId: string) {
        const { data, error } = await supabase
            .from('credentials')
            .select(`
        *,
        institutions (
          id,
          name,
          email,
          wallet_address
        ),
        students (
          id,
          name,
          email
        )
      `)
            .eq('token_id', tokenId)
            .single();
        return { data, error };
    },

    async revokeCredential(credentialId: string) {
        const { data, error } = await supabase
            .from('credentials')
            .update({ revoked: true, revoked_at: new Date().toISOString() })
            .eq('id', credentialId)
            .select()
            .single();
        return { data, error };
    },

    // Verification logs
    async createVerificationLog(log: {
        credential_id: string;
        verifier_email?: string;
        verifier_org?: string;
        verification_result: any;
    }) {
        const { data, error } = await supabase
            .from('verification_logs')
            .insert([log])
            .select()
            .single();
        return { data, error };
    },
};
