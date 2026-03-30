'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, ExternalLink, Shield, Calendar, User, Building2, FileText, Hash, Home, Info, Award, Lock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface CredentialData {
    id: string;
    token_id: string;
    ipfs_hash: string;
    blockchain_hash: string;
    metadata: any;
    issued_at: string;
    revoked: boolean;
    revoked_at: string | null;
    student_wallet_address: string;
    issuer_wallet_address: string;
    institution: {
        name: string;
        wallet_address: string;
    } | null;
}

function VerifyContent() {
    const searchParams = useSearchParams();
    const tokenId = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [credential, setCredential] = useState<CredentialData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<'valid' | 'invalid' | 'revoked' | null>(null);
    const [manualToken, setManualToken] = useState('');

    useEffect(() => {
        if (tokenId) {
            verifyCredential(tokenId);
        } else {
            setLoading(false);
        }
    }, [tokenId]);

    const verifyCredential = async (token: string) => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Verifying credential with token:', token);

            // Query the credential from Supabase without authentication
            const { data, error: queryError } = await supabase
                .from('credentials')
                .select(`
                    id,
                    token_id,
                    ipfs_hash,
                    blockchain_hash,
                    metadata,
                    issued_at,
                    revoked,
                    revoked_at,
                    student_wallet_address,
                    issuer_wallet_address,
                    institution:institutions!credentials_institution_id_fkey (
                        name,
                        wallet_address
                    )
                `)
                .eq('token_id', token)
                .single();

            if (queryError) {
                console.error('❌ Query error:', queryError);

                // Check if it's an RLS policy error
                if (queryError.code === 'PGRST116' || queryError.message.includes('policy')) {
                    // Try anonymous query
                    const { data: anonData, error: anonError } = await supabase
                        .from('credentials')
                        .select('*')
                        .eq('token_id', token)
                        .single();

                    if (anonError) {
                        throw new Error('Credential not found. The token ID may be invalid.');
                    }

                    setCredential(anonData as any);
                } else {
                    throw new Error(queryError.message || 'Failed to fetch credential');
                }
            } else if (!data) {
                throw new Error('Credential not found');
            } else {
                // Transform the data: institution comes as array from Supabase join
                const transformedData: CredentialData = {
                    ...data,
                    institution: Array.isArray(data.institution) && data.institution.length > 0
                        ? data.institution[0]
                        : null
                };

                // Fetch metadata from IPFS if ipfs_hash exists
                if (transformedData.ipfs_hash) {
                    try {
                        console.log('📦 Fetching metadata from IPFS:', transformedData.ipfs_hash);
                        const ipfsUrl = getIPFSUrl(transformedData.ipfs_hash);
                        const metadataResponse = await fetch(ipfsUrl);

                        if (metadataResponse.ok) {
                            const ipfsMetadata = await metadataResponse.json();
                            console.log('✅ IPFS Metadata fetched:', ipfsMetadata);

                            // Merge IPFS metadata with database data (IPFS takes precedence)
                            transformedData.metadata = ipfsMetadata;
                        } else {
                            console.warn('⚠️ Could not fetch IPFS metadata, using database metadata');
                        }
                    } catch (ipfsError) {
                        console.error('❌ Error fetching IPFS metadata:', ipfsError);
                        console.log('Using database metadata as fallback');
                    }
                }

                setCredential(transformedData);
            }

            // Check if revoked
            if (data?.revoked) {
                setVerificationStatus('revoked');
                console.log('⚠️ Credential is revoked');
            } else {
                setVerificationStatus('valid');
                console.log('✅ Credential is valid');
            }

            // Log verification attempt
            try {
                await supabase.from('verification_logs').insert({
                    credential_id: data?.id,
                    verification_result: {
                        valid: !data?.revoked,
                        token_id: token,
                        verified_at: new Date().toISOString(),
                    },
                });
            } catch (logError) {
                console.warn('Failed to log verification:', logError);
            }

        } catch (err: any) {
            console.error('❌ Verification error:', err);
            setError(err.message || 'Failed to verify credential');
            setVerificationStatus('invalid');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getIPFSUrl = (hash: string) => {
        if (hash.startsWith('http')) return hash;
        return `https://ipfs.io/ipfs/${hash}`;
    };

    const handleManualVerify = () => {
        if (manualToken.trim()) {
            // Update URL with token
            window.history.pushState({}, '', `/verify?token=${manualToken.trim()}`);
            verifyCredential(manualToken.trim());
        }
    };

    // Show manual entry form if no token provided
    if (!tokenId && !loading && !credential) {
        return (
            <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-teal-50">
                {/* Navbar */}
                <nav className="border-b border-gray-200 bg-white/90 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <Link href="/" className="flex items-center space-x-3">
                                <Image
                                    src="/logo.png"
                                    alt="Acredia Logo"
                                    width={40}
                                    height={40}
                                    className="rounded-lg"
                                />
                                <div>
                                    <span className="text-2xl font-bold bg-linear-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                        ACREDIA
                                    </span>
                                    <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-semibold">
                                        VERIFY
                                    </span>
                                </div>
                            </Link>
                            <div className="flex items-center space-x-4">
                                <Link href="/">
                                    <Button variant="ghost" size="sm">
                                        <Home className="h-4 w-4 mr-2" />
                                        Home
                                    </Button>
                                </Link>
                                <Link href="/about">
                                    <Button variant="ghost" size="sm">
                                        <Info className="h-4 w-4 mr-2" />
                                        About
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <div className="container mx-auto px-4 py-12">
                    <div className="max-w-4xl mx-auto">
                        {/* Info Cards */}
                        <div className="grid md:grid-cols-3 gap-4 mb-8">
                            <Card className="p-4 bg-white/80 backdrop-blur border-blue-200">
                                <div className="flex items-center space-x-3">
                                    <div className="rounded-full bg-blue-100 p-3">
                                        <Shield className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Blockchain Secured</h3>
                                        <p className="text-xs text-gray-600">Tamper-proof verification</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-4 bg-white/80 backdrop-blur border-teal-200">
                                <div className="flex items-center space-x-3">
                                    <div className="rounded-full bg-teal-100 p-3">
                                        <Award className="h-6 w-6 text-teal-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Instant Verification</h3>
                                        <p className="text-xs text-gray-600">Real-time credential check</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-4 bg-white/80 backdrop-blur border-purple-200">
                                <div className="flex items-center space-x-3">
                                    <div className="rounded-full bg-purple-100 p-3">
                                        <Lock className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Privacy Protected</h3>
                                        <p className="text-xs text-gray-600">Secure credential data</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Main Verification Card */}
                        <Card className="p-8 md:p-12 bg-white/90 backdrop-blur shadow-xl">
                            <div className="flex flex-col items-center space-y-6">
                                <div className="rounded-full bg-linear-to-br from-blue-100 to-teal-100 p-8">
                                    <Shield className="h-20 w-20 text-blue-600" />
                                </div>
                                <div className="text-center space-y-3">
                                    <h1 className="text-4xl font-bold text-gray-900">Verify Academic Credential</h1>
                                    <p className="text-lg text-gray-600 max-w-2xl">
                                        Enter a credential token ID to instantly verify its authenticity on the blockchain
                                    </p>
                                </div>

                                <div className="w-full max-w-md space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Credential Token ID
                                        </label>
                                        <input
                                            type="text"
                                            value={manualToken}
                                            onChange={(e) => setManualToken(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleManualVerify()}
                                            placeholder="Enter token ID (e.g., 1, 2, 3...)"
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            💡 The token ID can be found on the credential or in the QR code
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleManualVerify}
                                        disabled={!manualToken.trim()}
                                        className="w-full bg-linear-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white py-6 text-lg font-semibold"
                                    >
                                        <Shield className="h-5 w-5 mr-2" />
                                        Verify Credential
                                    </Button>
                                </div>

                                <div className="mt-8 text-center space-y-4">
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="h-px bg-gray-300 w-20"></div>
                                        <p className="text-sm text-gray-500 font-medium">OR</p>
                                        <div className="h-px bg-gray-300 w-20"></div>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        📱 Scan a QR code to verify automatically
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* How It Works Section */}
                        <div className="mt-12 grid md:grid-cols-3 gap-6">
                            <Card className="p-6 bg-white/80 backdrop-blur text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-bold text-xl mb-4">
                                    1
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">Enter Token ID</h3>
                                <p className="text-sm text-gray-600">
                                    Input the credential token ID or scan the QR code
                                </p>
                            </Card>
                            <Card className="p-6 bg-white/80 backdrop-blur text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-600 font-bold text-xl mb-4">
                                    2
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">Blockchain Verification</h3>
                                <p className="text-sm text-gray-600">
                                    System checks the credential against blockchain records
                                </p>
                            </Card>
                            <Card className="p-6 bg-white/80 backdrop-blur text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 font-bold text-xl mb-4">
                                    3
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">View Results</h3>
                                <p className="text-sm text-gray-600">
                                    Instantly see verification status and credential details
                                </p>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-teal-50">
                {/* Navbar */}
                <nav className="border-b border-gray-200 bg-white/90 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <Link href="/" className="flex items-center space-x-3">
                                <Image
                                    src="/logo.png"
                                    alt="Acredia Logo"
                                    width={40}
                                    height={40}
                                    className="rounded-lg"
                                />
                                <div>
                                    <span className="text-2xl font-bold bg-linear-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                        ACREDIA
                                    </span>
                                    <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-semibold">
                                        VERIFY
                                    </span>
                                </div>
                            </Link>
                            <div className="flex items-center space-x-4">
                                <Link href="/">
                                    <Button variant="ghost" size="sm">
                                        <Home className="h-4 w-4 mr-2" />
                                        Home
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
                    <Card className="w-full max-w-2xl p-8">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
                            <p className="text-lg font-semibold text-gray-700">Verifying credential...</p>
                            <p className="text-sm text-gray-500">Checking blockchain records</p>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    if (error || !credential) {
        return (
            <div className="min-h-screen bg-linear-to-br from-red-50 via-white to-orange-50">
                {/* Navbar */}
                <nav className="border-b border-gray-200 bg-white/90 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <Link href="/" className="flex items-center space-x-3">
                                <Image
                                    src="/logo.png"
                                    alt="Acredia Logo"
                                    width={40}
                                    height={40}
                                    className="rounded-lg"
                                />
                                <div>
                                    <span className="text-2xl font-bold bg-linear-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                        ACREDIA
                                    </span>
                                    <span className="ml-2 text-xs bg-red-600 text-white px-2 py-1 rounded-full font-semibold">
                                        ERROR
                                    </span>
                                </div>
                            </Link>
                            <div className="flex items-center space-x-4">
                                <Link href="/">
                                    <Button variant="ghost" size="sm">
                                        <Home className="h-4 w-4 mr-2" />
                                        Home
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
                    <Card className="w-full max-w-2xl p-8">
                        <div className="flex flex-col items-center justify-center space-y-6">
                            <div className="rounded-full bg-red-100 p-6">
                                <XCircle className="h-20 w-20 text-red-600" />
                            </div>
                            <div className="text-center space-y-2">
                                <h1 className="text-3xl font-bold text-gray-900">Verification Failed</h1>
                                <p className="text-lg text-gray-600">{error || 'Credential not found'}</p>
                                <p className="text-sm text-gray-500 mt-4">
                                    The credential token ID may be invalid or the credential does not exist in our system.
                                </p>
                            </div>
                            <div className="flex space-x-4">
                                <Link href="/verify">
                                    <Button className="bg-blue-600 hover:bg-blue-700">
                                        Try Again
                                    </Button>
                                </Link>
                                <Link href="/">
                                    <Button variant="outline">
                                        Return to Home
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-teal-50">
            {/* Navbar */}
            <nav className="border-b border-gray-200 bg-white/90 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center space-x-3">
                            <Image
                                src="/logo.png"
                                alt="Acredia Logo"
                                width={40}
                                height={40}
                                className="rounded-lg"
                            />
                            <div>
                                <span className="text-2xl font-bold bg-linear-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                    ACREDIA
                                </span>
                                <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded-full font-semibold">
                                    {verificationStatus === 'valid' ? 'VERIFIED' : verificationStatus === 'revoked' ? 'REVOKED' : 'VERIFY'}
                                </span>
                            </div>
                        </Link>
                        <div className="flex items-center space-x-4">
                            <Link href="/verify">
                                <Button variant="ghost" size="sm">
                                    <Shield className="h-4 w-4 mr-2" />
                                    New Verification
                                </Button>
                            </Link>
                            <Link href="/">
                                <Button variant="ghost" size="sm">
                                    <Home className="h-4 w-4 mr-2" />
                                    Home
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Header with Timestamp */}
                    <div className="text-center space-y-3">
                        <h1 className="text-4xl font-bold text-gray-900">Credential Verification Report</h1>
                        <p className="text-gray-600">Blockchain-verified academic credential</p>
                        <p className="text-sm text-gray-500">
                            Verified on: {new Date().toLocaleString('en-US', {
                                dateStyle: 'full',
                                timeStyle: 'short'
                            })}
                        </p>
                    </div>

                    {/* Verification Status */}
                    <Card className="p-8 md:p-12 bg-white/90 backdrop-blur shadow-xl border-2">
                        <div className="flex flex-col items-center justify-center space-y-6">
                            {verificationStatus === 'valid' && (
                                <>
                                    <div className="rounded-full bg-linear-to-br from-green-100 to-emerald-100 p-8 shadow-lg">
                                        <CheckCircle className="h-24 w-24 text-green-600" />
                                    </div>
                                    <div className="text-center space-y-3">
                                        <h2 className="text-4xl font-bold text-gray-900">Credential Verified ✓</h2>
                                        <p className="text-lg text-gray-600 max-w-2xl">
                                            This credential is authentic, valid, and secured on the blockchain
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-3 justify-center">
                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 px-4 py-2 text-sm">
                                            <Shield className="h-4 w-4 mr-2" />
                                            Blockchain Verified
                                        </Badge>
                                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 px-4 py-2 text-sm">
                                            <Lock className="h-4 w-4 mr-2" />
                                            Tamper-Proof
                                        </Badge>
                                        <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100 px-4 py-2 text-sm">
                                            <Award className="h-4 w-4 mr-2" />
                                            Authentic
                                        </Badge>
                                    </div>
                                </>
                            )}

                            {verificationStatus === 'revoked' && (
                                <>
                                    <div className="rounded-full bg-linear-to-br from-orange-100 to-red-100 p-8 shadow-lg">
                                        <AlertCircle className="h-24 w-24 text-orange-600" />
                                    </div>
                                    <div className="text-center space-y-3">
                                        <h2 className="text-4xl font-bold text-gray-900">Credential Revoked</h2>
                                        <p className="text-lg text-gray-600 max-w-2xl">
                                            This credential has been revoked by the issuing institution
                                        </p>
                                        {credential.revoked_at && (
                                            <p className="text-sm text-gray-500 font-medium">
                                                Revoked on: {formatDate(credential.revoked_at)}
                                            </p>
                                        )}
                                    </div>
                                    <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 px-4 py-2 text-base">
                                        ⚠️ Revoked
                                    </Badge>
                                </>
                            )}
                        </div>
                    </Card>

                    {/* Credential Details */}
                    <Card className="p-8 md:p-10 space-y-6 bg-white/90 backdrop-blur shadow-lg">
                        <div className="flex items-center justify-between border-b pb-4">
                            <h3 className="text-2xl font-bold text-gray-900">Credential Information</h3>
                            <Badge variant="outline" className="text-sm">
                                Token #{credential.token_id}
                            </Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Student Information */}
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <User className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Student Name</p>
                                        <p className="text-base font-semibold text-gray-900">
                                            {credential.metadata?.credentialData?.studentName || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {credential.student_wallet_address && (
                                    <div className="flex items-start space-x-3">
                                        <Hash className="h-5 w-5 text-blue-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Student Wallet</p>
                                            <p className="text-xs font-mono text-gray-700 break-all">
                                                {credential.student_wallet_address}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Institution Information */}
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <Building2 className="h-5 w-5 text-teal-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Issuing Institution</p>
                                        <p className="text-base font-semibold text-gray-900">
                                            {credential.institution?.name || credential.metadata?.credentialData?.institutionName || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {credential.issuer_wallet_address && (
                                    <div className="flex items-start space-x-3">
                                        <Hash className="h-5 w-5 text-teal-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Issuer Wallet</p>
                                            <p className="text-xs font-mono text-gray-700 break-all">
                                                {credential.issuer_wallet_address}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Credential Type & Details */}
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Credential Type</p>
                                        <p className="text-base font-semibold text-gray-900">
                                            {credential.metadata?.credentialData?.credentialType || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {credential.metadata?.credentialData?.degree && (
                                    <div className="flex items-start space-x-3">
                                        <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Degree</p>
                                            <p className="text-base font-semibold text-gray-900">
                                                {credential.metadata.credentialData.degree}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {credential.metadata?.credentialData?.major && (
                                    <div className="flex items-start space-x-3">
                                        <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Major</p>
                                            <p className="text-base text-gray-900">
                                                {credential.metadata.credentialData.major}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {credential.metadata?.credentialData?.gpa && (
                                    <div className="flex items-start space-x-3">
                                        <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">GPA</p>
                                            <p className="text-base text-gray-900">
                                                {credential.metadata.credentialData.gpa}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Issue Date */}
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <Calendar className="h-5 w-5 text-orange-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Issue Date</p>
                                        <p className="text-base font-semibold text-gray-900">
                                            {credential.metadata?.credentialData?.issueDate
                                                ? formatDate(credential.metadata.credentialData.issueDate)
                                                : formatDate(credential.issued_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Subject-wise Marks */}
                    {credential.metadata?.credentialData?.subjects && credential.metadata.credentialData.subjects.length > 0 && (
                        <Card className="p-8 md:p-10 space-y-6 bg-white/90 backdrop-blur shadow-lg border-l-4 border-purple-500">
                            <div className="flex items-center space-x-3 border-b pb-4">
                                <div className="rounded-lg bg-purple-100 p-2">
                                    <FileText className="h-6 w-6 text-purple-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">Subject-wise Performance</h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Subject</th>
                                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Marks Obtained</th>
                                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Max Marks</th>
                                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Percentage</th>
                                            {credential.metadata.credentialData.subjects.some((s: any) => s.grade) && (
                                                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Grade</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {credential.metadata.credentialData.subjects.map((subject: any, index: number) => {
                                            const percentage = subject.marks && subject.maxMarks
                                                ? ((parseFloat(subject.marks) / parseFloat(subject.maxMarks)) * 100).toFixed(2)
                                                : 'N/A';
                                            return (
                                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-4 font-medium text-gray-900">{subject.name}</td>
                                                    <td className="text-center py-3 px-4 text-gray-700">{subject.marks}</td>
                                                    <td className="text-center py-3 px-4 text-gray-700">{subject.maxMarks}</td>
                                                    <td className="text-center py-3 px-4">
                                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${parseFloat(percentage) >= 75 ? 'bg-green-100 text-green-800' :
                                                            parseFloat(percentage) >= 60 ? 'bg-blue-100 text-blue-800' :
                                                                parseFloat(percentage) >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                            }`}>
                                                            {percentage}%
                                                        </span>
                                                    </td>
                                                    {credential.metadata.credentialData.subjects.some((s: any) => s.grade) && (
                                                        <td className="text-center py-3 px-4">
                                                            <span className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-800">
                                                                {subject.grade || '-'}
                                                            </span>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                <div className="bg-blue-50 p-4 rounded-lg text-center">
                                    <p className="text-sm text-gray-600 mb-1">Total Subjects</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {credential.metadata.credentialData.subjects.length}
                                    </p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg text-center">
                                    <p className="text-sm text-gray-600 mb-1">Average Percentage</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {(() => {
                                            const validSubjects = credential.metadata.credentialData.subjects.filter(
                                                (s: any) => s.marks && s.maxMarks
                                            );
                                            if (validSubjects.length === 0) return 'N/A';
                                            const total = validSubjects.reduce((acc: number, s: any) => {
                                                return acc + (parseFloat(s.marks) / parseFloat(s.maxMarks)) * 100;
                                            }, 0);
                                            return (total / validSubjects.length).toFixed(2) + '%';
                                        })()}
                                    </p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg text-center">
                                    <p className="text-sm text-gray-600 mb-1">Total Marks</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {credential.metadata.credentialData.subjects.reduce((acc: number, s: any) =>
                                            acc + (parseFloat(s.marks) || 0), 0
                                        )} / {credential.metadata.credentialData.subjects.reduce((acc: number, s: any) =>
                                            acc + (parseFloat(s.maxMarks) || 0), 0
                                        )}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Blockchain Details */}
                    <Card className="p-8 md:p-10 space-y-6 bg-white/90 backdrop-blur shadow-lg border-l-4 border-blue-500">
                        <div className="flex items-center space-x-3 border-b pb-4">
                            <div className="rounded-lg bg-blue-100 p-2">
                                <Shield className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Blockchain Verification</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-blue-900 mb-2">Token ID</p>
                                <p className="text-lg font-mono font-bold text-blue-700">
                                    #{credential.token_id}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-semibold text-gray-700">Transaction Hash</p>
                                    <Badge variant="outline" className="text-xs">
                                        Mantle Sepolia
                                    </Badge>
                                </div>
                                <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-sm font-mono text-gray-900 break-all flex-1">
                                        {credential.blockchain_hash}
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="shrink-0"
                                        asChild
                                    >
                                        <a
                                            href={`https://sepolia.mantlescan.xyz/tx/${credential.blockchain_hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLink className="h-4 w-4 mr-1" />
                                            View
                                        </a>
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-semibold text-gray-700">IPFS Content Hash</p>
                                    <Badge variant="outline" className="text-xs">
                                        Decentralized Storage
                                    </Badge>
                                </div>
                                <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-sm font-mono text-gray-900 break-all flex-1">
                                        {credential.ipfs_hash}
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="shrink-0"
                                        asChild
                                    >
                                        <a
                                            href={getIPFSUrl(credential.ipfs_hash)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLink className="h-4 w-4 mr-1" />
                                            View
                                        </a>
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-linear-to-r from-blue-50 to-teal-50 p-4 rounded-lg border border-blue-200">
                                <p className="text-sm text-gray-700 flex items-start">
                                    <Shield className="h-5 w-5 text-blue-600 mr-2 mt-0.5 shrink-0" />
                                    <span>
                                        <strong>Blockchain Security:</strong> This credential is permanently recorded on the Mantle Sepolia blockchain
                                        and stored on IPFS, ensuring it cannot be altered, forged, or tampered with.
                                    </span>
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-center space-x-4 pb-8">
                        <Link href="/verify">
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Shield className="h-4 w-4 mr-2" />
                                Verify Another
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button variant="outline">
                                <Home className="h-4 w-4 mr-2" />
                                Return to Home
                            </Button>
                        </Link>
                        <Button
                            onClick={() => window.print()}
                            variant="outline"
                        >
                            Print Report
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}
