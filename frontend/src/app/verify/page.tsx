'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, ExternalLink, Shield, Calendar, User, Building2, FileText, Hash, Home, Info, Award, Lock, Camera, ScanLine, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { extractTokenFromQrPayload } from '@/lib/verification';

interface CredentialData {
    token_id: string;
    ipfs_hash?: string | null;
    blockchain_hash?: string | null;
    metadata?: {
        credentialData?: {
            studentName?: string;
            credentialType?: string;
            degree?: string;
            major?: string;
            gpa?: string;
            issueDate?: string;
            institutionName?: string;
            subjects?: Array<{
                name?: string;
                marks?: string;
                maxMarks?: string;
                grade?: string;
            }>;
        };
    };
    issued_at: string;
    revoked: boolean;
    revoked_at: string | null;
    student_wallet_address?: string;
    issuer_wallet_address?: string;
    institution: {
        name: string;
    } | null;
}

type ScanState = 'idle' | 'requesting' | 'scanning' | 'success' | 'permission-denied' | 'no-camera' | 'invalid' | 'unsupported' | 'error';

const QR_READER_ID = 'credential-qr-reader';

function VerifyContent() {
    const searchParams = useSearchParams();
    const tokenId = searchParams.get('token');
    const scannerRef = useRef<any>(null);

    const [loading, setLoading] = useState(true);
    const [credential, setCredential] = useState<CredentialData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<'valid' | 'invalid' | 'revoked' | null>(null);
    const [manualToken, setManualToken] = useState('');
    const [scanMode, setScanMode] = useState(false);
    const [scanState, setScanState] = useState<ScanState>('idle');
    const [scanMessage, setScanMessage] = useState('Scan the credential QR code to verify it instantly.');

    useEffect(() => {
        if (tokenId) {
            verifyCredential(tokenId);
        } else {
            setLoading(false);
        }
    }, [tokenId]);

    const stopScanner = useCallback(async () => {
        const scanner = scannerRef.current;

        if (!scanner) {
            return;
        }

        try {
            if (scanner.isScanning) {
                await scanner.stop();
            }
        } catch (err) {
            console.warn('Unable to stop QR scanner:', err);
        }

        try {
            await scanner.clear();
        } catch (err) {
            console.warn('Unable to clear QR scanner:', err);
        }

        scannerRef.current = null;
    }, []);

    useEffect(() => {
        return () => {
            void stopScanner();
        };
    }, [stopScanner]);

    useEffect(() => {
        if (!scanMode) {
            void stopScanner();
            setScanState('idle');
            setScanMessage('Scan the credential QR code to verify it instantly.');
        }
    }, [scanMode, stopScanner]);

    const verifyCredential = async (token: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/verify/${encodeURIComponent(token)}`);
            const payload = await response.json();

            if (!response.ok || !payload?.success || !payload?.credential) {
                throw new Error(payload?.error || 'Credential not found. The token ID may be invalid.');
            }

            const safe = payload.credential;
            const transformedData: CredentialData = {
                token_id: safe.tokenId,
                issued_at: safe.issuedAt,
                revoked: Boolean(safe.revoked),
                revoked_at: safe.revokedAt || null,
                institution: safe.institutionName
                    ? { name: safe.institutionName }
                    : null,
                metadata: {
                    credentialData: {
                        credentialType: safe.credentialType || undefined,
                        degree: safe.degree || undefined,
                        major: safe.major || undefined,
                        issueDate: safe.issueDate || undefined,
                        institutionName: safe.institutionName || undefined,
                    },
                },
            };

            setCredential(transformedData);

            if (safe.revoked) {
                setVerificationStatus('revoked');
            } else {
                setVerificationStatus('valid');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to verify credential');
            setVerificationStatus('invalid');
        } finally {
            setLoading(false);
        }
    };

    const verifyToken = useCallback((token: string) => {
        const cleanedToken = token.trim();

        if (!cleanedToken) {
            return;
        }

        window.history.pushState({}, '', `/verify?token=${encodeURIComponent(cleanedToken)}`);
        verifyCredential(cleanedToken);
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getIPFSUrl = (hash?: string | null) => {
        if (!hash) return '#';
        if (hash.startsWith('http')) return hash;
        return `https://ipfs.io/ipfs/${hash}`;
    };

    const handleManualVerify = () => {
        if (manualToken.trim()) {
            verifyToken(manualToken);
        }
    };

    const startScanner = async () => {
        if (!scanMode) {
            setScanMode(true);
            await new Promise<void>((resolve) => {
                requestAnimationFrame(() => resolve());
            });
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setScanState('unsupported');
            setScanMessage('This browser does not support camera scanning. Enter the token ID manually.');
            return;
        }

        setScanState('requesting');
        setScanMessage('Waiting for camera permission...');
        await stopScanner();

        try {
            const { Html5Qrcode } = await import('html5-qrcode');
            const cameras = await Html5Qrcode.getCameras();

            if (!cameras.length) {
                setScanState('no-camera');
                setScanMessage('No camera was found on this device. Enter the token ID manually.');
                return;
            }

            const readerElement = document.getElementById(QR_READER_ID);

            if (!readerElement) {
                setScanState('error');
                setScanMessage('The scanner could not be initialized. Please try again.');
                return;
            }

            const preferredCamera = cameras.find((camera) =>
                /back|rear|environment/i.test(camera.label)
            ) || cameras[0];
            const scanner = new Html5Qrcode(QR_READER_ID, false);
            scannerRef.current = scanner;
            setScanState('scanning');
            setScanMessage('Point your camera at the credential QR code.');

            await scanner.start(
                preferredCamera.id,
                {
                    fps: 10,
                    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        const qrboxSize = Math.floor(minEdge * 0.72);
                        return { width: qrboxSize, height: qrboxSize };
                    },
                    aspectRatio: 1,
                },
                async (decodedText: string) => {
                    const scannedToken = extractTokenFromQrPayload(decodedText);

                    if (!scannedToken) {
                        setScanState('invalid');
                        setScanMessage('This QR code does not contain a valid Acredia verification URL or token ID.');
                        return;
                    }

                    setScanState('success');
                    setScanMessage('QR code found. Loading the verification report...');
                    await stopScanner();
                    verifyToken(scannedToken);
                },
                () => undefined
            );
        } catch (err: any) {
            const errorName = err?.name || '';
            const errorMessage = String(err?.message || err || '');

            if (errorName === 'NotAllowedError' || errorMessage.toLowerCase().includes('permission')) {
                setScanState('permission-denied');
                setScanMessage('Camera permission was denied. Allow camera access in your browser settings or enter the token ID manually.');
                return;
            }

            if (errorName === 'NotFoundError' || errorMessage.toLowerCase().includes('not found')) {
                setScanState('no-camera');
                setScanMessage('No camera was found on this device. Enter the token ID manually.');
                return;
            }

            setScanState('error');
            setScanMessage('The camera scanner could not start. Check browser permissions and try again.');
        }
    };

    // Show manual entry form if no token provided
    if (!tokenId && !loading && !credential) {
        return (
            <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-teal-50">
                {/* Navbar */}
                <nav className="border-b border-gray-200 bg-white/90 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <Link href="/" className="flex items-center space-x-3">
                                <Image
                                    src="/logo.png"
                                    alt="Acredia Logo"
                                    width={40}
                                    height={40}
                                    className="rounded-lg"
                                />
                                <div>
                                    <span className="text-xl sm:text-2xl font-bold bg-linear-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                        ACREDIA
                                    </span>
                                    <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-semibold">
                                        VERIFY
                                    </span>
                                </div>
                            </Link>
                            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap sm:space-x-4">
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
                                            onKeyDown={(e) => e.key === 'Enter' && handleManualVerify()}
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

                                <div className="w-full max-w-xl rounded-xl border border-blue-100 bg-blue-50/60 p-3 sm:p-4">
                                    {!scanMode ? (
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="rounded-full bg-white p-3 text-blue-600 shadow-sm">
                                                    <Camera className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">Camera QR scan</p>
                                                    <p className="text-sm text-gray-600">
                                                        Camera permission is requested only when you start scanning.
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={startScanner}
                                                className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto"
                                            >
                                                <ScanLine className="mr-2 h-4 w-4" />
                                                Start Scan
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold text-gray-900">Scan credential QR</p>
                                                    <p className="text-sm text-gray-600">{scanMessage}</p>
                                                </div>
                                                <Button
                                                    onClick={() => setScanMode(false)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="shrink-0"
                                                >
                                                    Stop
                                                </Button>
                                            </div>

                                            <div className="relative overflow-hidden rounded-lg border border-blue-200 bg-gray-950">
                                                <div id={QR_READER_ID} className="min-h-[280px] w-full sm:min-h-[340px]" />
                                                {(scanState === 'requesting' || scanState === 'scanning') && (
                                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                        <div className="h-52 w-52 rounded-2xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.28)]" />
                                                    </div>
                                                )}
                                                {scanState === 'requesting' && (
                                                    <div className="absolute inset-x-0 bottom-0 bg-black/70 px-4 py-3 text-center text-sm font-medium text-white">
                                                        Requesting camera access...
                                                    </div>
                                                )}
                                            </div>

                                            <div
                                                className={`rounded-lg border px-4 py-3 text-sm ${
                                                    scanState === 'permission-denied' || scanState === 'no-camera' || scanState === 'invalid' || scanState === 'unsupported' || scanState === 'error'
                                                        ? 'border-red-200 bg-red-50 text-red-800'
                                                        : scanState === 'success'
                                                            ? 'border-green-200 bg-green-50 text-green-800'
                                                            : 'border-blue-200 bg-white text-gray-700'
                                                }`}
                                                role="status"
                                            >
                                                <div className="flex items-start gap-2">
                                                    {scanState === 'success' ? (
                                                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                                    ) : scanState === 'permission-denied' || scanState === 'no-camera' || scanState === 'invalid' || scanState === 'unsupported' || scanState === 'error' ? (
                                                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                                    ) : (
                                                        <ScanLine className="mt-0.5 h-4 w-4 shrink-0" />
                                                    )}
                                                    <span>{scanMessage}</span>
                                                </div>
                                            </div>

                                            {(scanState === 'permission-denied' || scanState === 'no-camera' || scanState === 'invalid' || scanState === 'unsupported' || scanState === 'error') && (
                                                <Button
                                                    onClick={startScanner}
                                                    variant="outline"
                                                    className="w-full"
                                                >
                                                    <RotateCcw className="mr-2 h-4 w-4" />
                                                    Try Scanner Again
                                                </Button>
                                            )}
                                        </div>
                                    )}
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
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <Link href="/" className="flex items-center space-x-3">
                                <Image
                                    src="/logo.png"
                                    alt="Acredia Logo"
                                    width={40}
                                    height={40}
                                    className="rounded-lg"
                                />
                                <div>
                                    <span className="text-xl sm:text-2xl font-bold bg-linear-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                        ACREDIA
                                    </span>
                                    <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-semibold">
                                        VERIFY
                                    </span>
                                </div>
                            </Link>
                            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap sm:space-x-4">
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
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <Link href="/" className="flex items-center space-x-3">
                                <Image
                                    src="/logo.png"
                                    alt="Acredia Logo"
                                    width={40}
                                    height={40}
                                    className="rounded-lg"
                                />
                                <div>
                                    <span className="text-xl sm:text-2xl font-bold bg-linear-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                        ACREDIA
                                    </span>
                                    <span className="ml-2 text-xs bg-red-600 text-white px-2 py-1 rounded-full font-semibold">
                                        ERROR
                                    </span>
                                </div>
                            </Link>
                            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap sm:space-x-4">
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
                            <div className="flex w-full flex-col sm:w-auto sm:flex-row gap-3 sm:space-x-4">
                                <Link href="/verify">
                                    <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                                        Try Again
                                    </Button>
                                </Link>
                                <Link href="/">
                                    <Button variant="outline" className="w-full sm:w-auto">
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
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Link href="/" className="flex items-center space-x-3">
                            <Image
                                src="/logo.png"
                                alt="Acredia Logo"
                                width={40}
                                height={40}
                                className="rounded-lg"
                            />
                            <div>
                                <span className="text-xl sm:text-2xl font-bold bg-linear-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                    ACREDIA
                                </span>
                                <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded-full font-semibold">
                                    {verificationStatus === 'valid' ? 'VERIFIED' : verificationStatus === 'revoked' ? 'REVOKED' : 'VERIFY'}
                                </span>
                            </div>
                        </Link>
                        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap sm:space-x-4">
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
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Credential Verification Report</h1>
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
                                            {credential.metadata?.credentialData?.subjects?.some((s: any) => s.grade) && (
                                                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Grade</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {credential.metadata?.credentialData?.subjects?.map((subject: any, index: number) => {
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
                                                    {credential.metadata?.credentialData?.subjects?.some((s: any) => s.grade) && (
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
                                        {credential.metadata?.credentialData?.subjects?.length || 0}
                                    </p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg text-center">
                                    <p className="text-sm text-gray-600 mb-1">Average Percentage</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {(() => {
                                            const validSubjects = (credential.metadata?.credentialData?.subjects || []).filter(
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
                                        {(credential.metadata?.credentialData?.subjects || []).reduce((acc: number, s: any) =>
                                            acc + (parseFloat(s.marks) || 0), 0
                                        )} / {(credential.metadata?.credentialData?.subjects || []).reduce((acc: number, s: any) =>
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

                            {credential.blockchain_hash && (
                                <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-semibold text-gray-700">Transaction Hash</p>
                                    <Badge variant="outline" className="text-xs">
                                        Stellar Testnet
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
                                            href={`https://stellar.expert/explorer/testnet/tx/${credential.blockchain_hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLink className="h-4 w-4 mr-1" />
                                            View
                                        </a>
                                    </Button>
                                </div>
                                </div>
                            )}

                            {credential.ipfs_hash && (
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
                            )}

                            <div className="bg-linear-to-r from-blue-50 to-teal-50 p-4 rounded-lg border border-blue-200">
                                <p className="text-sm text-gray-700 flex items-start">
                                    <Shield className="h-5 w-5 text-blue-600 mr-2 mt-0.5 shrink-0" />
                                    <span>
                                        <strong>Blockchain Security:</strong> This credential is permanently recorded on the Stellar testnet blockchain
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
