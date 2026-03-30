'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { getIPFSUrl } from '@/lib/ipfs';
import {
    Award,
    Search,
    ExternalLink,
    QrCode,
    Share2,
    Download,
    Calendar,
    Building2,
    GraduationCap,
    RefreshCw,
    AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import QRCodeModal from './QRCodeModal';

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
            if (!studentWallet) {
                console.log('⚠️ No wallet connected');
                setCredentials([]);
                setLoading(false);
                return;
            }

            console.log('🔍 Fetching credentials for wallet:', studentWallet);

            // Fetch credentials by wallet address (case-insensitive)
            const { data, error: fetchError } = await supabase
                .from('credentials')
                .select(`
                    *,
                    institution:institutions(name)
                `)
                .ilike('student_wallet_address', studentWallet)
                .order('issued_at', { ascending: false });

            if (fetchError) {
                console.error('❌ Fetch error:', fetchError);
                throw fetchError;
            }

            console.log('✅ Credentials fetched:', data?.length || 0, 'credentials');
            console.log('📊 Full data:', data);

            setCredentials(data || []);
        } catch (err: any) {
            console.error('Error loading credentials:', err);
            setError(err.message || 'Failed to load credentials');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCredentials();
    }, [studentWallet]);

    // Filter credentials based on search
    const filteredCredentials = credentials.filter((cred) => {
        const metadata = cred.metadata?.credentialData;
        const searchLower = searchQuery.toLowerCase();

        return (
            metadata?.credentialType?.toLowerCase().includes(searchLower) ||
            metadata?.degree?.toLowerCase().includes(searchLower) ||
            metadata?.major?.toLowerCase().includes(searchLower) ||
            metadata?.institutionName?.toLowerCase().includes(searchLower) ||
            cred.token_id?.toLowerCase().includes(searchLower)
        );
    });

    if (loading) {
        return (
            <Card className="p-8 bg-white border-gray-200 shadow-lg">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                    <p className="ml-4 text-gray-600">Loading your credentials...</p>
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

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Search by type, degree, major, or institution..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-teal-50 rounded-lg p-4">
                    <p className="text-sm text-teal-700 font-medium">Total Credentials</p>
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
                    <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
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
        ? `https://sepolia.mantlescan.xyz/tx/${credential.blockchain_hash}`
        : null;

    const [showQRModal, setShowQRModal] = useState(false);

    const handleShare = () => {
        const shareUrl = `${window.location.origin}/verify?token=${credential.token_id}`;
        navigator.clipboard.writeText(shareUrl);
        // TODO: Add toast notification
        alert('Share link copied to clipboard!');
    };

    const handleGenerateQR = () => {
        console.log('🔍 Opening QR modal for credential:', {
            id: credential.id,
            token_id: credential.token_id,
            full_credential: credential
        });
        setShowQRModal(true);
    };

    return (
        <>
            <QRCodeModal
                open={showQRModal}
                onClose={() => setShowQRModal(false)}
                credential={credential}
            />
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

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {metadata.degree && (
                                <div className="flex items-center space-x-2">
                                    <GraduationCap className="h-4 w-4 text-gray-500" />
                                    <span>
                                        <span className="font-medium">Degree:</span> {metadata.degree}
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

                        {/* Token ID */}
                        <div className="text-xs text-gray-500 font-mono">
                            Token ID: {credential.token_id || 'Pending...'}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 ml-4">
                        <Button
                            onClick={handleGenerateQR}
                            variant="outline"
                            size="sm"
                            className="border-teal-600 text-teal-600 hover:bg-teal-50"
                        >
                            <QrCode className="h-4 w-4 mr-1" />
                            QR Code
                        </Button>
                        <Button
                            onClick={handleShare}
                            variant="outline"
                            size="sm"
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                        </Button>
                        {ipfsUrl && (
                            <a href={ipfsUrl} target="_blank" rel="noopener noreferrer">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-purple-600 text-purple-600 hover:bg-purple-50 w-full"
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
                                    className="border-cyan-600 text-cyan-600 hover:bg-cyan-50 w-full"
                                >
                                    <ExternalLink className="h-4 w-4 mr-1" />
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
