import { supabase } from './supabase';
import { uploadToIPFS, uploadJSONToIPFS, getIPFSUrl } from './ipfs';
import {
    issueCredentialOnStellar,
    generateCredentialHash,
    revokeCredentialOnStellar,
} from './contracts';
import { debugLog } from './debug';

export interface Subject {
    id: string;
    name: string;
    marks: string;
    maxMarks: string;
    grade?: string;
}

export interface CredentialData {
    studentName: string;
    studentWallet: string;
    studentEmail?: string;
    credentialType: string;
    degree: string;
    major?: string;
    gpa?: string;
    issueDate: string;
    subjects?: Subject[];
    institutionId: string;
    institutionName: string;
    institutionWallet: string;
    file: File;
}

export interface CredentialMetadata {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
        trait_type: string;
        value: string;
    }>;
    credentialData: {
        studentName: string;
        studentWallet: string;
        degree: string;
        major?: string;
        gpa?: string;
        issueDate: string;
        institutionName: string;
        credentialType: string;
        subjects?: Subject[];
    };
}

export async function issueCredential(
    data: CredentialData,
    issuerAddress: string
): Promise<{
    tokenId: string;
    transactionHash: string;
    ipfsHash: string;
    metadataHash: string;
}> {
    try {
        debugLog('Uploading credential file to IPFS.');
        const fileCID = await uploadToIPFS(data.file);
        const fileUrl = getIPFSUrl(fileCID);
        debugLog('Credential file uploaded to IPFS.');

        debugLog('Generating credential metadata.');
        const metadata: CredentialMetadata = {
            name: `${data.credentialType} - ${data.studentName}`,
            description: `Academic credential issued by ${data.institutionName} to ${data.studentName}`,
            image: fileUrl,
            attributes: [
                {
                    trait_type: 'Credential Type',
                    value: data.credentialType,
                },
                {
                    trait_type: 'Degree',
                    value: data.degree,
                },
                {
                    trait_type: 'Institution',
                    value: data.institutionName,
                },
                {
                    trait_type: 'Issue Date',
                    value: data.issueDate,
                },
                ...(data.major
                    ? [
                        {
                            trait_type: 'Major',
                            value: data.major,
                        },
                    ]
                    : []),
                ...(data.gpa
                    ? [
                        {
                            trait_type: 'GPA',
                            value: data.gpa,
                        },
                    ]
                    : []),
                ...(data.subjects && data.subjects.length > 0
                    ? [
                        {
                            trait_type: 'Total Subjects',
                            value: data.subjects.length.toString(),
                        },
                    ]
                    : []),
            ],
            credentialData: {
                studentName: data.studentName,
                studentWallet: data.studentWallet,
                degree: data.degree,
                major: data.major,
                gpa: data.gpa,
                issueDate: data.issueDate,
                institutionName: data.institutionName,
                credentialType: data.credentialType,
                subjects: data.subjects,
            },
        };

        debugLog('Uploading credential metadata to IPFS.');
        const metadataPath = await uploadJSONToIPFS(metadata);
        const metadataUrl = `ipfs://${metadataPath}`;
        debugLog('Credential metadata uploaded to IPFS.');

        debugLog('Generating credential hash.');
        const credentialHash = await generateCredentialHash(metadata);
        debugLog('Credential hash generated.');

        debugLog('Issuing credential on Stellar network.');
        const { tokenId, transactionHash } = await issueCredentialOnStellar(
            data.studentWallet,
            credentialHash,
            metadataUrl,
            issuerAddress
        );
        const resolvedTokenId = tokenId && tokenId !== 'pending' ? tokenId : transactionHash;
        debugLog('Credential issued on Stellar network.');

        if (!data.institutionId) {
            throw new Error('Missing institution ID. Please refresh and try again.');
        }

        debugLog('Saving issued credential to the database.');
        const { data: studentData } = await supabase
            .from('students')
            .select('id')
            .eq('wallet_address', data.studentWallet)
            .maybeSingle();

        const { error: dbError } = await supabase.from('credentials').insert({
            student_id: studentData?.id || null,
            student_wallet_address: data.studentWallet,
            institution_id: data.institutionId,
            issuer_wallet_address: data.institutionWallet,
            token_id: resolvedTokenId,
            ipfs_hash: metadataPath,
            blockchain_hash: transactionHash,
            metadata,
            issued_at: new Date().toISOString(),
            revoked: false,
        });

        if (dbError) {
            console.error('Database save error:', dbError);
            const details = [dbError.code, dbError.message, dbError.details]
                .filter(Boolean)
                .join(' | ');
            throw new Error(`Failed to save credential to database: ${details || 'Unknown database error'}`);
        }

        debugLog('Credential saved to the database.');

        return {
            tokenId: resolvedTokenId,
            transactionHash,
            ipfsHash: fileCID,
            metadataHash: metadataPath,
        };
    } catch (error) {
        console.error('Error issuing credential:', error);
        throw error;
    }
}

export async function getInstitutionCredentials(institutionId: string) {
    try {
        const { data, error } = await supabase
            .from('credentials')
            .select('*')
            .eq('institution_id', institutionId)
            .order('issued_at', { ascending: false });

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error fetching institution credentials:', error);
        throw error;
    }
}

export async function getCredentialById(credentialId: string) {
    try {
        const { data, error } = await supabase
            .from('credentials')
            .select('*')
            .eq('id', credentialId)
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error fetching credential:', error);
        throw error;
    }
}

export async function revokeCredentialById(
    credentialId: string,
    issuerAddress: string
): Promise<void> {
    try {
        const credential = await getCredentialById(credentialId);
        if (!credential) {
            throw new Error('Credential not found');
        }

        if (credential.revoked) {
            throw new Error('Credential is already revoked');
        }

        const connectedWallet = issuerAddress?.toLowerCase();
        const storedIssuerWallet = credential.issuer_wallet_address?.toLowerCase();

        debugLog('Validating wallet authorization for credential revocation.');

        if (!connectedWallet) {
            throw new Error('No wallet connected. Please connect your wallet first.');
        }

        if (connectedWallet !== storedIssuerWallet) {
            throw new Error(
                `Authorization failed: You must use the same wallet that issued this credential.\n` +
                    `Expected: ${storedIssuerWallet}\n` +
                    `Connected: ${connectedWallet}`
            );
        }

        if (credential.token_id) {
            await revokeCredentialOnStellar(credential.token_id, issuerAddress);
            debugLog('Credential revoked on Stellar network.');
        }

        const { error } = await supabase
            .from('credentials')
            .update({
                revoked: true,
                revoked_at: new Date().toISOString(),
            })
            .eq('id', credentialId);

        if (error) throw error;

        debugLog('Credential revocation saved to the database.');
    } catch (error) {
        console.error('Error revoking credential:', error);
        throw error;
    }
}
