import { debugLog } from './debug';

const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';
const IPFS_FILE_ROUTE = '/api/ipfs/file';
const IPFS_JSON_ROUTE = '/api/ipfs/json';

export async function uploadToIPFS(file: File): Promise<string> {
    try {
        const formData = new FormData();
        formData.append('file', file, file.name);

        const response = await fetch(IPFS_FILE_ROUTE, {
            method: 'POST',
            body: formData,
        });

        const payload = await response.json();

        if (!response.ok || !payload?.cid) {
            throw new Error(payload?.error || 'IPFS upload failed');
        }

        const cid = payload.cid as string;
        debugLog('File uploaded to IPFS via server IPFS route.');
        return cid;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error uploading file to IPFS:', error);
        // eslint-disable-next-line preserve-caught-error
        throw new Error(`Failed to upload to IPFS: ${error.message}`);
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function uploadJSONToIPFS(data: any): Promise<string> {
    try {
        const response = await fetch(IPFS_JSON_ROUTE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: data }),
        });

        const payload = await response.json();

        if (!response.ok || !payload?.cid) {
            throw new Error(payload?.error || 'IPFS JSON upload failed');
        }

        const cid = payload.cid as string;
        debugLog('JSON uploaded to IPFS via server IPFS route.');
        return cid;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error uploading JSON to IPFS:', error);
        // eslint-disable-next-line preserve-caught-error
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchFromIPFS(cid: string): Promise<any> {
    try {
        const url = getIPFSUrl(cid);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
        }

        return await response.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error fetching from IPFS:', error);
        // eslint-disable-next-line preserve-caught-error
        throw new Error(`Failed to fetch from IPFS: ${error.message}`);
    }
}
