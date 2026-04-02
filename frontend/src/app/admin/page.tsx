'use client';

import { useAuth, ProtectedRoute } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthorizeIssuer } from '@/components/institution/AuthorizeIssuer';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut, Shield, Users, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useStellarAccount } from '@/contexts/StellarContext';
import { ConnectWallet } from '@/components/ui/ConnectWallet';
import { getContractAddress } from '@/lib/stellar';
import { getContractOwner } from '@/lib/contracts';
import { toast } from 'sonner';

interface AdminStats {
    totalInstitutions: number;
    authorizedInstitutions: number;
    totalCredentials: number;
    activeCredentials: number;
    totalStudents: number;
}

function AdminDashboardContent() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const { address } = useStellarAccount();
    const [contractOwner, setContractOwner] = useState<string>('');
    const [isOwner, setIsOwner] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [stats, setStats] = useState<AdminStats>({
        totalInstitutions: 0,
        authorizedInstitutions: 0,
        totalCredentials: 0,
        activeCredentials: 0,
        totalStudents: 0,
    });
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        const checkOwnership = async () => {
            if (!address) {
                setIsChecking(false);
                return;
            }

            try {
                const owner = await getContractOwner(address);

                setContractOwner(owner);
                const ownerCheck = address.toLowerCase() === owner.toLowerCase();
                setIsOwner(ownerCheck);

                if (!ownerCheck) {
                    console.log('❌ Wallet verification failed:');
                    console.log('Your wallet:', address);
                    console.log('Contract owner:', owner);
                    toast.error('⚠️ This wallet is not the contract owner');
                    toast.info('Connect the wallet that deployed the contracts');
                } else {
                    console.log('✅ Wallet verified as contract owner');
                    toast.success('✅ Verified as Contract Owner!');
                }
            } catch (error) {
                console.error('Error checking ownership:', error);
                toast.error('Failed to verify ownership: ' + (error as Error).message);
            } finally {
                setIsChecking(false);
            }
        };

        checkOwnership();
    }, [address, router]);

    // Fetch admin statistics
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoadingStats(true);
                const response = await fetch('/api/admin/stats');
                const data = await response.json();

                if (data.success) {
                    setStats(data.stats);
                    console.log('📊 Admin stats loaded:', data.stats);
                } else {
                    console.error('Failed to fetch stats:', data.error);
                    toast.error('Failed to load statistics');
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
                toast.error('Failed to load statistics');
            } finally {
                setLoadingStats(false);
            }
        };

        if (isOwner) {
            fetchStats();
            // Refresh stats every 30 seconds
            const interval = setInterval(fetchStats, 30000);
            return () => clearInterval(interval);
        }
    }, [isOwner]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    // Prevent rendering if not owner
    if (isChecking) {
        return (
            <div className="min-h-screen bg-linear-to-br from-gray-50 via-teal-50 to-cyan-50 flex items-center justify-center">
                <Card className="p-8">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                        <p className="text-gray-600">Verifying admin access...</p>
                    </div>
                </Card>
            </div>
        );
    }

    if (!address) {
        return (
            <div className="min-h-screen bg-linear-to-br from-gray-50 via-teal-50 to-cyan-50 flex items-center justify-center">
                <Card className="p-8 max-w-md">
                    <Shield className="h-16 w-16 text-orange-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
                        Admin Access Required
                    </h2>
                    <p className="text-gray-600 text-center mb-6">
                        Please connect your wallet to access the admin dashboard
                    </p>
                    <div className="flex justify-center">
                        <ConnectWallet />
                    </div>
                </Card>
            </div>
        );
    }



    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 via-teal-50 to-cyan-50">
            {/* Navigation */}
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
                                    ADMIN
                                </span>
                            </div>
                        </Link>
                        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap sm:space-x-4">
                            <ConnectWallet />
                            <Button
                                onClick={handleSignOut}
                                variant="ghost"
                                className="text-gray-700 hover:text-red-600 text-sm sm:text-base px-3 sm:px-4"
                            >
                                <LogOut className="h-5 w-5 mr-2" />
                                <span className="hidden sm:inline">Sign Out</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Admin Dashboard Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <Shield className="h-10 w-10 text-red-600" />
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                            Admin Dashboard
                        </h1>
                    </div>
                    <p className="text-gray-600 text-lg">
                        Manage institution authorizations and system settings
                    </p>
                </div>

                {!isOwner && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start space-x-3">
                            <Shield className="h-6 w-6 text-red-600 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-red-900 mb-1">
                                    Read-Only Mode: Not Contract Owner
                                </h3>
                                <p className="text-xs text-red-700 mt-1">
                                    You are viewing the dashboard, but you cannot authorize new institutions because your currently connected wallet ({address?.slice(0, 6)}...{address?.slice(-4)}) is not the contract owner.
                                    <br />
                                    Actual Owner: <span className="font-mono bg-red-100 px-1 rounded">{contractOwner || 'Could not fetch'}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Admin Info Card */}
                <Card className="border-red-200 bg-red-50 p-6 mb-6">
                    <div className="flex items-start space-x-4">
                        <CheckCircle2 className="h-6 w-6 text-red-600 mt-1" />
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-red-900 mb-2">
                                Contract Owner (Admin)
                            </h3>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm text-red-700 font-medium">Email:</p>
                                    <p className="text-sm text-red-800">{user?.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-red-700 font-medium">Wallet Address:</p>
                                    <p className="text-xs font-mono text-red-800 break-all">
                                        {address}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-red-700 font-medium">Contract Address:</p>
                                    <p className="text-xs font-mono text-red-800 break-all">
                                        {process.env.NEXT_PUBLIC_CREDENTIAL_NFT_CONTRACT}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="p-6 bg-white border-gray-200 shadow-lg">
                        <div className="flex items-center space-x-3 mb-2">
                            <Users className="h-8 w-8 text-teal-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Total Institutions
                            </h3>
                        </div>
                        {loadingStats ? (
                            <div className="animate-pulse">
                                <div className="h-10 bg-gray-200 rounded w-16 mb-2"></div>
                            </div>
                        ) : (
                            <>
                                <p className="text-3xl font-bold text-teal-600">
                                    {stats.totalInstitutions}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">Registered institutions</p>
                            </>
                        )}
                    </Card>

                    <Card className="p-6 bg-white border-gray-200 shadow-lg">
                        <div className="flex items-center space-x-3 mb-2">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Authorized
                            </h3>
                        </div>
                        {loadingStats ? (
                            <div className="animate-pulse">
                                <div className="h-10 bg-gray-200 rounded w-16 mb-2"></div>
                            </div>
                        ) : (
                            <>
                                <p className="text-3xl font-bold text-green-600">
                                    {stats.authorizedInstitutions}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">Authorized to issue</p>
                            </>
                        )}
                    </Card>

                    <Card className="p-6 bg-white border-gray-200 shadow-lg">
                        <div className="flex items-center space-x-3 mb-2">
                            <Shield className="h-8 w-8 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Total Credentials
                            </h3>
                        </div>
                        {loadingStats ? (
                            <div className="animate-pulse">
                                <div className="h-10 bg-gray-200 rounded w-16 mb-2"></div>
                            </div>
                        ) : (
                            <>
                                <p className="text-3xl font-bold text-blue-600">
                                    {stats.totalCredentials}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {stats.activeCredentials} active, {stats.totalCredentials - stats.activeCredentials} revoked
                                </p>
                            </>
                        )}
                    </Card>
                </div>

                {/* Authorization Management */}
                <AuthorizeIssuer />
            </div>
        </div>
    );
}

export default function AdminDashboardPage() {
    return (
        <ProtectedRoute>
            <AdminDashboardContent />
        </ProtectedRoute>
    );
}