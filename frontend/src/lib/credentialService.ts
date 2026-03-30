import { supabase } from './supabase';
import { uploadToIPFS, uploadJSONToIPFS, getIPFSUrl } from './ipfs';
import { issueCredentialNFT, registerCredential, generateCredentialHash, revokeCredential, getCredentialIssuer } from './contracts';

export interface Subject {
    id: string;
    name: string;
    marks: string;
    maxMarks: string;
    grade?: string;
}

export interface CredentialData {
    // Student info
    studentName: string;
    studentWallet: string;
    studentEmail?: string;

    // Credential details
    credentialType: string;
    degree: string;
    major?: string;
    gpa?: string;
    issueDate: string;
    subjects?: Subject[];

    // Institution info
    institutionId: string;
    institutionName: string;
    institutionWallet: string;

    // File
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

/**
 * Issue a complete credential - Full workflow
 * 1. Upload credential file to IPFS
 * 2. Generate metadata and upload to IPFS
 * 3. Mint NFT on blockchain
 * 4. Register in credential registry
 * 5. Save to Supabase database
 */
export async function issueCredential(
    data: CredentialData,
    account: any
): Promise<{
    tokenId: string;
    transactionHash: string;
    ipfsHash: string;
    metadataHash: string;
}> {
    try {
        // Step 1: Upload credential file to IPFS
        console.log('📤 Uploading credential file to IPFS...');
        const fileCID = await uploadToIPFS(data.file);
        const fileUrl = getIPFSUrl(fileCID);
        console.log('✅ File uploaded:', fileUrl);

        // Step 2: Generate and upload metadata to IPFS
        console.log('📝 Generating metadata...');
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

        console.log('📤 Uploading metadata to IPFS...');
        const metadataPath = await uploadJSONToIPFS(metadata);
        const metadataUrl = `ipfs://${metadataPath}`; // Full path: ipfs://QmXXX/metadata.json
        console.log('✅ Metadata uploaded:', metadataUrl);

        // Step 3: Generate credential hash
        console.log('🔐 Generating credential hash...');
        const credentialHash = generateCredentialHash(metadata);
        console.log('✅ Hash generated:', credentialHash);

        // Step 4: Mint NFT on blockchain
        console.log('⛓️ Minting NFT on blockchain...');
        const { tokenId, transactionHash } = await issueCredentialNFT(
            data.studentWallet,
            credentialHash,
            metadataUrl,
            account
        );
        console.log('✅ NFT minted! Token ID:', tokenId);
        console.log('✅ Transaction:', transactionHash);

        // Step 5: Register in credential registry
        try {
            console.log('📝 Registering in credential registry...');
            await registerCredential(
                tokenId,
                data.studentWallet,
                data.institutionWallet,
                credentialHash,
                metadataPath,
                account
            );
            console.log('✅ Registered in registry');
        } catch (error) {
            console.warn('⚠️ Registry registration failed (non-critical):', error);
        }

        // Step 6: Save to Supabase database
        console.log('💾 Saving to database...');

        // Try to find student by wallet address
        const { data: studentData } = await supabase
            .from('students')
            .select('id')
            .eq('wallet_address', data.studentWallet)
            .single();

        const { error: dbError } = await supabase.from('credentials').insert({
            student_id: studentData?.id || null,
            student_wallet_address: data.studentWallet, // Store wallet for lookup
            institution_id: data.institutionId,
            issuer_wallet_address: data.institutionWallet, // Store issuer wallet
            token_id: tokenId,
            ipfs_hash: metadataPath, // Store full path (CID/filename)
            blockchain_hash: transactionHash,
            metadata: metadata,
            issued_at: new Date().toISOString(),
            revoked: false,
        }); if (dbError) {
            console.error('Database save error:', dbError);
            throw new Error('Failed to save credential to database');
        }

        console.log('✅ Credential saved to database');

        return {
            tokenId,
            transactionHash,
            ipfsHash: fileCID,
            metadataHash: metadataPath,
        };
    } catch (error) {
        console.error('❌ Error issuing credential:', error);
        throw error;
    }
}

/**
 * Get all credentials issued by an institution
 */
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

/**
 * Get a single credential by ID
 */
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

/**
 * Revoke a credential
 */
export async function revokeCredentialById(
    credentialId: string,
    account: any
): Promise<void> {
    try {
        // Get credential from database
        const credential = await getCredentialById(credentialId);
        if (!credential) {
            throw new Error('Credential not found');
        }

        if (credential.revoked) {
            throw new Error('Credential is already revoked');
        }

        // Validate wallet authorization
        const connectedWallet = account?.address?.toLowerCase();
        const issuerWallet = credential.issuer_wallet_address?.toLowerCase();

        console.log('🔐 Validating wallet authorization...');
        console.log('Connected wallet:', connectedWallet);
        console.log('Issuer wallet:', issuerWallet);

        if (!connectedWallet) {
            throw new Error('No wallet connected. Please connect your wallet first.');
        }

        if (connectedWallet !== issuerWallet) {
            throw new Error(
                `Authorization failed: You must use the same wallet that issued this credential.\n` +
                `Expected: ${issuerWallet}\n` +
                `Connected: ${connectedWallet}`
            );
        }

        // Revoke on blockchain (requires token_id)
        if (credential.token_id) {
            console.log('⛓️ Revoking credential on blockchain...');

            // Check who is stored as issuer on blockchain
            try {
                const blockchainIssuer = await getCredentialIssuer(credential.token_id);
                console.log('📋 Blockchain stored issuer:', blockchainIssuer);
                console.log('📋 Connected wallet:', connectedWallet);

                if (blockchainIssuer.toLowerCase() !== connectedWallet) {
                    throw new Error(
                        `Blockchain authorization mismatch!\n` +
                        `The blockchain has a different issuer stored for this credential.\n` +
                        `Blockchain issuer: ${blockchainIssuer}\n` +
                        `Connected wallet: ${connectedWallet}\n\n` +
                        `Please use the wallet: ${blockchainIssuer}\n` +
                        `Or use the contract owner wallet to revoke.`
                    );
                }
            } catch (err: any) {
                if (err.message?.includes('Blockchain authorization mismatch')) {
                    throw err;
                }
                console.warn('Could not verify blockchain issuer:', err);
            }

            await revokeCredential(credential.token_id, account);
            console.log('✅ Credential revoked on blockchain');
        }

        // Update in database
        const { error } = await supabase
            .from('credentials')
            .update({
                revoked: true,
                revoked_at: new Date().toISOString()
            })
            .eq('id', credentialId);

        if (error) throw error;

        console.log('✅ Credential revoked successfully in database');
    } catch (error) {
        console.error('Error revoking credential:', error);
        throw error;
    }
}
