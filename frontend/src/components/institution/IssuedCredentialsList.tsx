'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { getInstitutionCredentials, revokeCredentialById } from '@/lib/credentialService';
import { getIPFSUrl } from '@/lib/ipfs';
import {
    ExternalLink,
    Search,
    FileText,
    Calendar,
    User,
    Award,
    Loader2,
    RefreshCw,
    AlertCircle,
    XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useActiveAccount } from 'thirdweb/react';
import { toast } from 'sonner';

interface IssuedCredentialsListProps {
    institutionId: string;
    refreshTrigger?: number;
}

interface Credential {
    id: string;
    token_id: string;
    ipfs_hash: string;
    blockchain_hash: string;
    metadata: any;
    issued_at: string;
    revoked: boolean;
}

export function IssuedCredentialsList({ institutionId, refreshTrigger }: IssuedCredentialsListProps) {
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [filteredCredentials, setFilteredCredentials] = useState<Credential[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
    const [credentialToRevoke, setCredentialToRevoke] = useState<Credential | null>(null);
    const [isRevoking, setIsRevoking] = useState(false);
    const account = useActiveAccount();

    const loadCredentials = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getInstitutionCredentials(institutionId);
            setCredentials(data || []);
            setFilteredCredentials(data || []);
        } catch (err: any) {
            console.error('Error loading credentials:', err);
            setError(err.message || 'Failed to load credentials');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevokeClick = (credential: Credential) => {
        setCredentialToRevoke(credential);
        setRevokeDialogOpen(true);
    };

    const handleRevokeConfirm = async () => {
        if (!account) {
            toast.error('Please connect your wallet first');
            return;
        }

        if (!credentialToRevoke) {
            toast.error('No credential selected');
            return;
        }

        setIsRevoking(true);
        try {
            await revokeCredentialById(credentialToRevoke.id, account);
            toast.success('Credential revoked successfully on blockchain and database');
            setRevokeDialogOpen(false);
            setCredentialToRevoke(null);
            await loadCredentials(); // Refresh list
        } catch (err: any) {
            console.error('Error revoking credential:', err);

            // Show user-friendly error messages
            let errorMessage = 'Failed to revoke credential';

            if (err.message?.includes('same wallet')) {
                errorMessage = 'You must connect the same wallet that issued this credential';
            } else if (err.message?.includes('Not authorized')) {
                errorMessage = 'Only the institution that issued this credential can revoke it';
            } else if (err.message?.includes('already revoked')) {
                errorMessage = 'This credential has already been revoked';
            } else if (err.message) {
                errorMessage = err.message;
            }

            toast.error(errorMessage, { duration: 5000 });
        } finally {
            setIsRevoking(false);
        }
    };

    useEffect(() => {
        loadCredentials();
    }, [institutionId, refreshTrigger]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredCredentials(credentials);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = credentials.filter((cred) => {
            const studentName = cred.metadata?.credentialData?.studentName?.toLowerCase() || '';
            const degree = cred.metadata?.credentialData?.degree?.toLowerCase() || '';
            const credentialType = cred.metadata?.credentialData?.credentialType?.toLowerCase() || '';
            const tokenId = cred.token_id?.toLowerCase() || '';

            return (
                studentName.includes(query) ||
                degree.includes(query) ||
                credentialType.includes(query) ||
                tokenId.includes(query)
            );
        });

        setFilteredCredentials(filtered);
    }, [searchQuery, credentials]);

    if (isLoading) {
        return (
            <Card className="p-8 bg-white border-gray-200 shadow-lg">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-12 w-12 text-teal-600 animate-spin" />
                    <p className="text-gray-600">Loading credentials...</p>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="p-8 bg-white border-gray-200 shadow-lg">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <p className="text-red-600">{error}</p>
                    <Button
                        onClick={loadCredentials}
                        variant="outline"
                        className="border-teal-600 text-teal-600 hover:bg-teal-50"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6 bg-white border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Issued Credentials</h2>
                <Button
                    onClick={loadCredentials}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Search by student name, degree, or token ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-teal-50 rounded-lg p-4">
                    <p className="text-sm text-teal-700 font-medium">Total Issued</p>
                    <p className="text-3xl font-bold text-teal-900">{credentials.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-700 font-medium">Active</p>
                    <p className="text-3xl font-bold text-green-900">
                        {credentials.filter((c) => !c.revoked).length}
                    </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-red-700 font-medium">Revoked</p>
                    <p className="text-3xl font-bold text-red-900">
                        {credentials.filter((c) => c.revoked).length}
                    </p>
                </div>
            </div>

            {/* Credentials List */}
            {filteredCredentials.length === 0 ? (
                <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                        {searchQuery ? 'No credentials found matching your search' : 'No credentials issued yet'}
                    </p>
                    {searchQuery && (
                        <Button
                            onClick={() => setSearchQuery('')}
                            variant="link"
                            className="mt-2 text-teal-600"
                        >
                            Clear search
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredCredentials.map((credential) => (
                        <CredentialCard
                            key={credential.id}
                            credential={credential}
                            onRevoke={handleRevokeClick}
                        />
                    ))}
                </div>
            )}

            {/* Revoke Confirmation Dialog */}
            <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Revoke Credential</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to revoke this credential? This action cannot be undone.
                            The credential will be marked as revoked on the blockchain and in the database.
                        </DialogDescription>
                    </DialogHeader>
                    {credentialToRevoke && (
                        <div className="py-4 space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <p className="text-sm">
                                    <span className="font-medium">Student:</span>{' '}
                                    {credentialToRevoke.metadata?.credentialData?.studentName || 'Unknown'}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium">Credential:</span>{' '}
                                    {credentialToRevoke.metadata?.credentialData?.credentialType || 'N/A'}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium">Token ID:</span>{' '}
                                    {credentialToRevoke.token_id}
                                </p>
                            </div>

                            {/* Wallet warning */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <div className="flex items-start space-x-2">
                                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-yellow-800">
                                        <p className="font-medium mb-1">Important:</p>
                                        <p>You must use the same wallet that issued this credential.</p>
                                        {account?.address && (
                                            <p className="mt-1 font-mono text-xs break-all">
                                                Connected: {account.address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRevokeDialogOpen(false)}
                            disabled={isRevoking}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRevokeConfirm}
                            disabled={isRevoking}
                        >
                            {isRevoking ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Revoking...
                                </>
                            ) : (
                                <>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Revoke Credential
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

function CredentialCard({ credential, onRevoke }: { credential: Credential; onRevoke: (credential: Credential) => void }) {
    const metadata = credential.metadata?.credentialData || {};
    const ipfsUrl = credential.ipfs_hash ? getIPFSUrl(credential.ipfs_hash) : null;
    const blockchainUrl = credential.blockchain_hash
        ? `https://sepolia.mantlescan.xyz/tx/${credential.blockchain_hash}`
        : null;

    return (
        <div className="border border-gray-200 rounded-lg p-4 hover:border-teal-500 transition-colors">
            <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center space-x-3">
                        <Award className="h-5 w-5 text-teal-600" />
                        <h3 className="font-semibold text-gray-900">
                            {metadata.credentialType || 'Credential'}
                        </h3>
                        {credential.revoked ? (
                            <Badge variant="destructive">Revoked</Badge>
                        ) : (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                Active
                            </Badge>
                        )}
                    </div>

                    {/* Student Info */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span className="font-medium">Student:</span>
                        <span>{metadata.studentName || 'Unknown'}</span>
                    </div>

                    {/* Degree Info */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">Degree:</span>
                        <span>{metadata.degree || 'N/A'}</span>
                        {metadata.major && (
                            <span className="text-gray-500">({metadata.major})</span>
                        )}
                    </div>

                    {/* Additional Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {metadata.gpa && (
                            <div>
                                <span className="font-medium">GPA:</span> {metadata.gpa}
                            </div>
                        )}
                        <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                                {metadata.issueDate
                                    ? format(new Date(metadata.issueDate), 'MMM d, yyyy')
                                    : 'Unknown date'}
                            </span>
                        </div>
                    </div>

                    {/* Token ID */}
                    <div className="text-xs text-gray-500 font-mono">
                        Token ID: {credential.token_id || 'Pending...'}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2">
                    {ipfsUrl && (
                        <a href={ipfsUrl} target="_blank" rel="noopener noreferrer">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-teal-600 text-teal-600 hover:bg-teal-50"
                            >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                IPFS
                            </Button>
                        </a>
                    )}
                    {blockchainUrl && (
                        <a href={blockchainUrl} target="_blank" rel="noopener noreferrer">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-cyan-600 text-cyan-600 hover:bg-cyan-50"
                            >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Txn
                            </Button>
                        </a>
                    )}
                    {!credential.revoked && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-red-600 text-red-600 hover:bg-red-50"
                            onClick={() => onRevoke(credential)}
                        >
                            <XCircle className="h-4 w-4 mr-1" />
                            Revoke
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
