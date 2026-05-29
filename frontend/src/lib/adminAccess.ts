const TRUSTED_ADMIN_ENV_VARS = ['ADMIN_EMAIL_ALLOWLIST', 'SUPABASE_SERVICE_ROLE_KEY'];

export function adminSetupRequirements() {
    return TRUSTED_ADMIN_ENV_VARS;
}

export function normalizePublicSignupRole(role: unknown): 'institution' | 'student' {
    return role === 'institution' ? 'institution' : 'student';
}
