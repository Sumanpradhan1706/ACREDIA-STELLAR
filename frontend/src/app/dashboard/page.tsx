'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { List, LogOut, Shield, Upload, User, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { CredentialUploadForm } from '@/components/institution/CredentialUploadForm';
import { IssuedCredentialsList } from '@/components/institution/IssuedCredentialsList';
import StudentCredentialsList from '@/components/student/StudentCredentialsList';
import { ConnectWallet } from '@/components/ui/ConnectWallet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { debugLog, debugWarn } from '@/lib/debug';
import { supabase } from '@/lib/supabase';
import { useStellarAccount } from '@/contexts/StellarContext';
import { ProtectedRoute, useAuth } from '@/contexts/AuthContext';

function DashboardContent() {
    const { user, userRole, signOut } = useAuth();
    const router = useRouter();
    const { address } = useStellarAccount();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [institutionId, setInstitutionId] = useState('');
    const [loadingInstitution, setLoadingInstitution] = useState(true);

    useEffect(() => {
        const fetchInstitutionId = async () => {
            if (!user || userRole !== 'institution') {
                setLoadingInstitution(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('institutions')
                    .select('id, wallet_address')
                    .eq('auth_user_id', user.id)
                    .maybeSingle();

                if (error) {
                    console.error('Error fetching institution:', error);
                    toast.error('Failed to load institution data');
                    return;
                }

                if (data) {
                    setInstitutionId(data.id);
                    debugLog('Institution profile loaded for dashboard.');
                    return;
                }

                debugWarn('Institution record was missing and will be created.');
                toast.warning('Institution record not found. Creating profile...');

                const { data: newInstitution, error: createError } = await supabase
                    .from('institutions')
                    .insert([
                        {
                            auth_user_id: user.id,
                            email: user.email,
                            name: user.email?.split('@')[0] || 'Institution',
                        },
                    ])
                    .select('id')
                    .single();

                if (createError) {
                    console.error('Error creating institution:', createError);
                    toast.error('Failed to create institution profile');
                    return;
                }

                if (newInstitution) {
                    setInstitutionId(newInstitution.id);
                    toast.success('Institution profile created');
                }
            } catch (error) {
                console.error('Error loading institution:', error);
                toast.error('An unexpected error occurred');
            } finally {
                setLoadingInstitution(false);
            }
        };

        fetchInstitutionId();
    }, [user, userRole]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    const handleCredentialIssued = () => {
        setRefreshTrigger((previous) => previous + 1);
        toast.success('Credential list will refresh!');
    };

    const institutionName = user?.user_metadata?.name || 'Institution';
    const institutionWallet = address || '';

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 via-teal-50 to-cyan-50">
            <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur-lg">
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
                            <span className="bg-linear-to-r from-teal-600 to-cyan-600 bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
                                ACREDIA
                            </span>
                        </Link>
                        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap sm:space-x-4">
                            <ConnectWallet />
                            <Button
                                onClick={handleSignOut}
                                variant="ghost"
                                className="px-3 text-sm text-gray-700 hover:text-red-600 sm:px-4 sm:text-base"
                            >
                                <LogOut className="mr-2 h-5 w-5" />
                                <span className="hidden sm:inline">Sign Out</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
                        Welcome, {user?.user_metadata?.name || 'User'}
                    </h1>
                    <p className="text-lg capitalize text-gray-600">{userRole} Dashboard</p>
                </div>

                {userRole === 'institution' && (
                    <div className="space-y-6">
                        {loadingInstitution && (
                            <Card className="border-gray-200 bg-white p-6 shadow-lg">
                                <div className="flex items-center justify-center py-8">
                                    <div className="mr-3 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                                    <p className="text-gray-600">Loading institution data...</p>
                                </div>
                            </Card>
                        )}

                        {institutionId && (
                            <Card className="border-gray-200 bg-white p-6 shadow-lg">
                                <h3 className="mb-4 text-xl font-bold text-gray-900">
                                    Account Information
                                </h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium text-gray-900">{user?.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Role</p>
                                        <p className="font-medium capitalize text-gray-900">
                                            {userRole}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Wallet Status</p>
                                        <p className="font-medium text-gray-900">
                                            {address ? (
                                                <span className="text-teal-600">
                                                    Connected: {address.slice(0, 6)}...
                                                    {address.slice(-4)}
                                                </span>
                                            ) : (
                                                <span className="text-orange-600">
                                                    Not Connected
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {institutionId && !address && (
                            <Card className="border-orange-200 bg-orange-50 p-6">
                                <div className="flex items-start space-x-3">
                                    <Wallet className="mt-1 h-6 w-6 text-orange-600" />
                                    <div>
                                        <h3 className="mb-2 text-lg font-bold text-orange-900">
                                            Connect Your Wallet
                                        </h3>
                                        <p className="mb-4 text-orange-800">
                                            You need to connect your wallet to issue credentials on
                                            the blockchain. Click the "Connect Wallet" button in the
                                            top right corner.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {institutionId && (
                            <Tabs defaultValue="issue" className="w-full">
                                <TabsList className="grid w-full max-w-2xl grid-cols-2">
                                    <TabsTrigger value="issue" className="flex items-center space-x-2">
                                        <Upload className="h-4 w-4" />
                                        <span>Issue Credential</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="view" className="flex items-center space-x-2">
                                        <List className="h-4 w-4" />
                                        <span>View Issued</span>
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="issue" className="mt-6">
                                    <CredentialUploadForm
                                        institutionId={institutionId}
                                        institutionName={institutionName}
                                        institutionWallet={institutionWallet}
                                        account={address}
                                        onSuccess={handleCredentialIssued}
                                    />
                                </TabsContent>

                                <TabsContent value="view" className="mt-6">
                                    <IssuedCredentialsList
                                        institutionId={institutionId}
                                        refreshTrigger={refreshTrigger}
                                    />
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
                )}

                {userRole === 'admin' && (
                    <div className="space-y-6">
                        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-8 shadow-lg">
                            <div className="mb-6 flex items-center space-x-4">
                                <div className="rounded-2xl bg-red-100 p-3">
                                    <Shield className="h-10 w-10 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        You&apos;re an Admin
                                    </h2>
                                    <p className="text-gray-600">
                                        Access the Admin Panel to manage institutions and authorize
                                        issuers.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Link href="/admin">
                                    <div className="group cursor-pointer rounded-xl border border-red-200 bg-white p-6 transition-all hover:border-red-400 hover:shadow-md">
                                        <Shield className="mb-3 h-8 w-8 text-red-600 transition-transform group-hover:scale-110" />
                                        <h3 className="mb-1 font-bold text-gray-900">
                                            Admin Dashboard
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Authorize institutions, view system stats, and manage the
                                            contract.
                                        </p>
                                        <span className="mt-2 inline-block text-xs font-semibold text-red-600">
                                            Open Admin Panel -&gt;
                                        </span>
                                    </div>
                                </Link>
                                <div className="rounded-xl border border-gray-200 bg-white p-6">
                                    <User className="mb-3 h-8 w-8 text-teal-600" />
                                    <h3 className="mb-1 font-bold text-gray-900">Connected Wallet</h3>
                                    <p className="mb-2 text-sm text-gray-500">
                                        Your Stellar address:
                                    </p>
                                    <p className="break-all text-xs font-mono text-gray-700">
                                        {address || (
                                            <span className="text-orange-500">
                                                Not connected - click "Connect Wallet" above
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {userRole === 'student' && (
                    <div className="space-y-6">
                        <Card className="border-gray-200 bg-white p-6 shadow-lg">
                            <h3 className="mb-4 text-xl font-bold text-gray-900">
                                Account Information
                            </h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium text-gray-900">{user?.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Name</p>
                                    <p className="font-medium text-gray-900">
                                        {user?.user_metadata?.name || 'Not set'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Wallet Status</p>
                                    <p className="font-medium text-gray-900">
                                        {address ? (
                                            <span className="text-teal-600">
                                                Connected: {address.slice(0, 6)}...
                                                {address.slice(-4)}
                                            </span>
                                        ) : (
                                            <span className="text-orange-600">Not Connected</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {!address && (
                            <Card className="border-orange-200 bg-orange-50 p-6">
                                <div className="flex items-start space-x-3">
                                    <Wallet className="mt-1 h-6 w-6 text-orange-600" />
                                    <div>
                                        <h3 className="mb-2 text-lg font-bold text-orange-900">
                                            Connect Your Wallet
                                        </h3>
                                        <p className="mb-4 text-orange-800">
                                            You need to connect your wallet to view your credentials on
                                            the blockchain. Click the "Connect Wallet" button in the
                                            top right corner.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}

                        <StudentCredentialsList
                            studentId={user?.id || ''}
                            studentWallet={address || undefined}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}
