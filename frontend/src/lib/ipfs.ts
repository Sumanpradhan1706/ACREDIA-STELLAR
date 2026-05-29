import { debugLog } from './debug';

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || '';
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';

export async function uploadToIPFS(file: File): Promise<string> {
    if (!PINATA_JWT) {
        throw new Error(
            'Pinata JWT not configured. Please set NEXT_PUBLIC_PINATA_JWT in your .env.local file. ' +
                'Get a free API key at https://pinata.cloud'
        );
    }

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('pinataMetadata', JSON.stringify({ name: file.name }));
        formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PINATA_JWT}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Pinata API error:', response.status, errorBody);
            throw new Error(`IPFS upload failed (${response.status}): ${response.statusText}`);
        }

        const result = await response.json();
        const cid = result.IpfsHash;
        debugLog('File uploaded to IPFS via Pinata.');
        return cid;
    } catch (error: any) {
        console.error('Error uploading file to IPFS:', error);
        throw new Error(`Failed to upload to IPFS: ${error.message}`);
    }
}

export async function uploadJSONToIPFS(data: any): Promise<string> {
    if (!PINATA_JWT) {
        throw new Error(
            'Pinata JWT not configured. Please set NEXT_PUBLIC_PINATA_JWT in your .env.local file. ' +
                'Get a free API key at https://pinata.cloud'
        );
    }

    try {
        const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${PINATA_JWT}`,
            },
            body: JSON.stringify({
                pinataMetadata: { name: 'credential-metadata.json' },
                pinataOptions: { cidVersion: 1 },
                pinataContent: data,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Pinata API error:', response.status, errorBody);
            throw new Error(`IPFS JSON upload failed (${response.status}): ${response.statusText}`);
        }

        const result = await response.json();
        const cid = result.IpfsHash;
        debugLog('JSON uploaded to IPFS via Pinata.');
        return cid;
    } catch (error: any) {
        console.error('Error uploading JSON to IPFS:', error);
        throw new Error(`Failed to upload JSON to IPFS: ${error.message}`);
    }
}

export function getIPFSUrl(cidOrUri: string): string {
    if (!cidOrUri || cidOrUri.trim() === '') {
        return '#';
    }

    const fullPath = cidOrUri.replace('ipfs://', '');
    const parts = fullPath.split('/');
    const cid = parts[0];
    const path = parts.length > 1 ? '/' + parts.slice(1).join('/') : '';

    if (!cid || cid === 'undefined' || cid === 'null') {
        return '#';
    }

    return `${PINATA_GATEWAY}/ipfs/${cid}${path}`;
}

export async function fetchFromIPFS(cid: string): Promise<any> {
    try {
        const url = getIPFSUrl(cid);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error('Error fetching from IPFS:', error);
        throw new Error(`Failed to fetch from IPFS: ${error.message}`);
    }
}
