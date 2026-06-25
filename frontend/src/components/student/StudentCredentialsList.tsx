'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
    AlertCircle,
    Award,
    Building2,
    Calendar,
    ExternalLink,
    GraduationCap,
    QrCode,
    RefreshCw,
    Search,
    Share2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import QRCodeModal from './QRCodeModal';
import { getIPFSUrl } from '@/lib/ipfs';
import { debugLog } from '@/lib/debug';
import { safeGetSession, supabase } from '@/lib/supabase';

interface Credential {
    id: string;
    token_id: string;
    ipfs_hash: string;
    blockchain_hash: string;
    metadata: {
        name: string;
        description: string;
        credentialData: {
            studentName: string;
            studentWallet: string;
            degree: string;
            major?: string;
            gpa?: string;
            issueDate: string;
            institutionName: string;
            credentialType: string;
        };
    };
    issued_at: string;
    revoked: boolean;
    institution?: {
        name: string;
    };
}

interface StudentCredentialsListProps {
    studentId: string;
    studentWallet?: string;
}

export default function StudentCredentialsList({
    studentId,
    studentWallet,
}: StudentCredentialsListProps) {
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const loadCredentials = async () => {
        setLoading(true);
        setError(null);

        try {
            if (!studentId) {
                setCredentials([]);
                return;
            }

            if (studentWallet) {
                await supabase
                    .from('students')
                    .update({ wallet_address: studentWallet })
                    .eq('auth_user_id', studentId);
            }

            const {
                data: { session },
                error: sessionError,
            } = await safeGetSession();

            if (sessionError) {
                throw new Error('Failed to refresh your session');
            }

            let accessToken = session?.access_token;

            if (!accessToken) {
                setCredentials([]);
                return;
            }

            let response = await fetch('/api/student/credentials', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            let payload = await response.json();

            if (response.status === 401 && payload?.error === 'Invalid or expired access token') {
                const { data: refreshed, error: refreshError } =
                    await supabase.auth.refreshSession();
                accessToken = refreshed.session?.access_token;

                if (refreshError || !accessToken) {
                    throw new Error('Your session expired. Please sign in again.');
                }

                response = await fetch('/api/student/credentials', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                payload = await response.json();
            }

            if (!response.ok || !payload?.success) {
                throw new Error(payload?.error || 'Failed to load credentials');
            }

            const data = ((payload.credentials || []) as Credential[]).sort(
                (a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime(),
            );

            debugLog(`Fetched ${data.length} credentials for the student dashboard.`);
            setCredentials(data);
        } catch (error: unknown) {
            console.error('Error loading credentials:', error);
            setError((error instanceof Error ? error.message : String(error)) || 'Failed to load credentials');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCredentials();
    }, [studentId, studentWallet]);

    const filteredCredentials = credentials.filter((credential) => {
        const metadata = credential.metadata?.credentialData;
        const searchLower = searchQuery.toLowerCase();

        return (
            metadata?.credentialType?.toLowerCase().includes(searchLower) ||
            metadata?.degree?.toLowerCase().includes(searchLower) ||
            metadata?.major?.toLowerCase().includes(searchLower) ||
            metadata?.institutionName?.toLowerCase().includes(searchLower) ||
            credential.token_id?.toLowerCase().includes(searchLower)
        );
    });

    if (loading) {
        return (
            <Card className="border-gray-200 bg-white p-6 shadow-lg">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">My Credentials</h2>
                    <Skeleton className="h-9 w-24" />
                </div>
                
                <div className="mb-6">
                    <Skeleton className="h-10 w-full" />
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                </div>

                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-40 w-full rounded-xl" />
                    ))}
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="border-gray-200 bg-white p-8 shadow-lg">
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
        <Card className="border-gray-200 bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">My Credentials</h2>
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

            <div className="mb-6">
                <div className="relative">
                    <label htmlFor="student-credential-search" className="sr-only">
                        Search credentials
                    </label>
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                        id="student-credential-search"
                        placeholder="Search by type, degree, major, or institution..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        aria-label="Search credentials"
                    />
                </div>
            </div>

            <div
                className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3"
                role="region"
                aria-label="Credential statistics"
            >
                <div className="rounded-lg bg-teal-50 p-4">
                    <p className="text-sm font-medium text-teal-700">Total Credentials</p>
                    <p className="text-3xl font-bold text-teal-900">{credentials.length}</p>
                </div>
                <div className="rounded-lg bg-green-50 p-4">
                    <p className="text-sm font-medium text-green-700">Active</p>
                    <p className="text-3xl font-bold text-green-900">
                        {credentials.filter((credential) => !credential.revoked).length}
                    </p>
                </div>
                <div className="rounded-lg bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-700">Revoked</p>
                    <p className="text-3xl font-bold text-red-900">
                        {credentials.filter((credential) => credential.revoked).length}
                    </p>
                </div>
            </div>

            {filteredCredentials.length === 0 ? (
                <div className="py-12 text-center" aria-live="polite">
                    <Award className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                    <p className="text-lg text-gray-500">
                        {searchQuery
                            ? 'No credentials found matching your search'
                            : 'No credentials issued yet'}
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
                        <CredentialCard key={credential.id} credential={credential} />
                    ))}
                </div>
            )}
        </Card>
    );
}

function CredentialCard({ credential }: { credential: Credential }) {
    const metadata = credential.metadata?.credentialData || {};
    const ipfsUrl = credential.ipfs_hash ? getIPFSUrl(credential.ipfs_hash) : null;
    const blockchainUrl = credential.blockchain_hash
        ? `https://stellar.expert/explorer/testnet/tx/${credential.blockchain_hash}`
        : null;

    const [showQRModal, setShowQRModal] = useState(false);

    const handleShare = () => {
        const shareUrl = `${window.location.origin}/verify?token=${credential.token_id}`;
        navigator.clipboard.writeText(shareUrl);
        alert('Share link copied to clipboard!');
    };

    const handleGenerateQR = () => {
        debugLog('Opening credential QR modal.');
        setShowQRModal(true);
    };

    return (
        <>
            <QRCodeModal
                open={showQRModal}
                onClose={() => setShowQRModal(false)}
                credential={credential}
            />
            <div className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-teal-500">
                <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
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

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {metadata.degree && (
                                <div className="flex items-center space-x-2">
                                    <GraduationCap className="h-4 w-4 text-gray-500" />
                                    <span>
                                        <span className="font-medium">Degree:</span>{' '}
                                        {metadata.degree}
                                    </span>
                                </div>
                            )}
                            {metadata.major && (
                                <div>
                                    <span className="font-medium">Major:</span> {metadata.major}
                                </div>
                            )}
                            {metadata.gpa && (
                                <div>
                                    <span className="font-medium">GPA:</span> {metadata.gpa}
                                </div>
                            )}
                            {metadata.institutionName && (
                                <div className="flex items-center space-x-2">
                                    <Building2 className="h-4 w-4 text-gray-500" />
                                    <span>{metadata.institutionName}</span>
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

                        <div className="font-mono text-xs text-gray-500">
                            Token ID: {credential.token_id || 'Pending...'}
                        </div>
                    </div>

                    <div className="ml-4 flex flex-col space-y-2">
                        <Button
                            onClick={handleGenerateQR}
                            variant="outline"
                            size="sm"
                            className="border-teal-600 text-teal-600 hover:bg-teal-50"
                        >
                            <QrCode className="mr-1 h-4 w-4" />
                            QR Code
                        </Button>
                        <Button
                            onClick={handleShare}
                            variant="outline"
                            size="sm"
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                            <Share2 className="mr-1 h-4 w-4" />
                            Share
                        </Button>
                        {ipfsUrl && (
                            <a href={ipfsUrl} target="_blank" rel="noopener noreferrer">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
                                >
                                    <ExternalLink className="mr-1 h-4 w-4" />
                                    IPFS
                                </Button>
                            </a>
                        )}
                        {blockchainUrl && (
                            <a href={blockchainUrl} target="_blank" rel="noopener noreferrer">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-cyan-600 text-cyan-600 hover:bg-cyan-50"
                                >
                                    <ExternalLink className="mr-1 h-4 w-4" />
                                    Blockchain
                                </Button>
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
