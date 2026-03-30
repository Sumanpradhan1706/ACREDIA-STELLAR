import { upload, download } from "thirdweb/storage";
import { createThirdwebClient } from "thirdweb";

const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

/**
 * Upload file to IPFS using Thirdweb Storage
 * Make sure your API key has localhost:3000 in allowed domains
 */
export async function uploadToIPFS(file: File): Promise<string> {
    try {
        const uri = await upload({
            client,
            files: [file],
        });
        // Extract full path from URI (ipfs://CID/filename)
        const fullPath = uri.replace('ipfs://', '');
        console.log('✅ Uploaded to IPFS:', fullPath);
        return fullPath; // Return full path including filename
    } catch (error) {
        console.error('Error uploading to IPFS with Thirdweb:', error);
        console.log('Trying fallback method...');
        // Fallback to NFT.Storage
        return await uploadToNFTStorage(file);
    }
}

/**
 * Fallback: Upload using NFT.Storage free API
 */
async function uploadToNFTStorage(file: File): Promise<string> {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('https://api.nft.storage/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_NFT_STORAGE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDhEODc4NDMzODlCNjE0NjhFNjgxRjI2ODBCNjY4RTQ2RTQwRTQwNkIiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYzMjE1NTQzMjQ4NCwibmFtZSI6ImRlbW8ifQ.fEcSw_MQjKiUDGhKYqweHqgfY3VfFCXZRQcJoFtYA5U'}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`NFT.Storage upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        return result.value.cid;
    } catch (error) {
        console.error('Error with NFT.Storage fallback:', error);
        throw new Error('Failed to upload to IPFS - all methods failed');
    }
}

export async function uploadJSONToIPFS(data: any): Promise<string> {
    try {
        // Convert JSON to file for upload
        const jsonString = JSON.stringify(data);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const file = new File([blob], 'metadata.json', { type: 'application/json' });

        const uri = await upload({
            client,
            files: [file],
        });
        const fullPath = uri.replace('ipfs://', '');
        console.log('✅ Uploaded JSON to IPFS:', fullPath);
        return fullPath; // Return full path including filename
    } catch (error) {
        console.error('Error uploading JSON to IPFS with Thirdweb:', error);
        console.log('Trying fallback method...');
        // Fallback
        return await uploadToIPFS(new File([JSON.stringify(data)], 'metadata.json', { type: 'application/json' }));
    }
}

export function getIPFSUrl(cidOrUri: string): string {
    // Handle undefined, null, or empty string
    if (!cidOrUri || cidOrUri.trim() === '') {
        return '#'; // Return placeholder to avoid broken links
    }

    // Remove ipfs:// prefix if present
    let fullPath = cidOrUri.replace('ipfs://', '');

    // Split CID and path (e.g., "QmXXX/metadata.json" -> ["QmXXX", "/metadata.json"])
    const parts = fullPath.split('/');
    const cid = parts[0];
    const path = parts.length > 1 ? '/' + parts.slice(1).join('/') : '';

    // Validate CID is not empty
    if (!cid || cid === 'undefined' || cid === 'null') {
        return '#';
    }

    /**
     * IPFS Gateway Selection:
     * 
     * Thirdweb's subdomain gateway (*.ipfscdn.io) only works with CIDv1 (starts with 'bafy')
     * CIDv0 (starts with 'Qm') doesn't work with subdomain gateways due to case-sensitivity
     * 
     * Solution: Use path-based gateway format which works with both CIDv0 and CIDv1
     */

    // Use ipfs.io public gateway with path format (works with all CID versions)
    return `https://ipfs.io/ipfs/${cid}${path}`;

    // Alternative reliable gateways (all use path format):
    // return `https://gateway.pinata.cloud/ipfs/${cid}${path}`;
    // return `https://cloudflare-ipfs.com/ipfs/${cid}${path}`;
    // return `https://dweb.link/ipfs/${cid}${path}`;

    // Thirdweb's gateway with path format (works but may have rate limits):
    // return `https://ipfs.thirdwebcdn.com/ipfs/${cid}${path}`;
} export async function fetchFromIPFS(cid: string): Promise<any> {
    try {
        // Try Thirdweb's download method first (faster)
        try {
            const ipfsUri = `ipfs://${cid}`;
            const response = await download({
                client,
                uri: ipfsUri,
            });
            const data = await response.json();
            return data;
        } catch (thirdwebError) {
            console.warn('Thirdweb download failed, trying public gateway...', thirdwebError);
        }

        // Fallback to public gateway
        const url = getIPFSUrl(cid);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching from IPFS:', error);
        throw new Error('Failed to fetch from IPFS');
    }
}
