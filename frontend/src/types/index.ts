export type UserRole = 'institution' | 'student' | 'verifier';

export interface Institution {
    id: string;
    email: string;
    name: string;
    wallet_address?: string;
    verified: boolean;
    created_at: string;
}

export interface Student {
    id: string;
    email: string;
    name: string;
    wallet_address?: string;
    created_at: string;
}

export interface Credential {
    id: string;
    student_id: string;
    institution_id: string;
    token_id: string;
    ipfs_hash: string;
    blockchain_hash: string;
    metadata: CredentialMetadata;
    issued_at: string;
    revoked: boolean;
}

export interface CredentialMetadata {
    student_name: string;
    institution_name: string;
    credential_type: string;
    degree?: string;
    field_of_study?: string;
    graduation_date?: string;
    gpa?: number;
    description?: string;
    image_url?: string;
}

export interface VerificationResult {
    valid: boolean;
    credential?: Credential;
    institution?: Institution;
    message: string;
    verified_at: string;
}

export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    profile?: Institution | Student;
}
