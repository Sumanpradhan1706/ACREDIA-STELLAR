'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { List, Shield, Upload, User, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { CredentialUploadForm } from '@/components/institution/CredentialUploadForm';
import { IssuedCredentialsList } from '@/components/institution/IssuedCredentialsList';
import StudentCredentialsList from '@/components/student/StudentCredentialsList';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
        <DashboardShell
            title={<>Welcome, {user?.user_metadata?.name || 'User'}</>}
            subtitle={<span className="capitalize">{userRole} Dashboard</span>}
            onSignOut={handleSignOut}
        >
            {userRole === 'institution' && (
                <div className="space-y-6">
                    {loadingInstitution && (
                        <Card className="border-gray-200 bg-white p-6 shadow-lg">
                            <Skeleton className="h-7 w-48 mb-4" />
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-5 w-32" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-5 w-24" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-5 w-40" />
                                </div>
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
                                            <span className="text-orange-600">Not Connected</span>
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
                                        You need to connect your wallet to issue credentials on the
                                        blockchain. Click the "Connect Wallet" button in the top
                                        right corner.
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
                                <Shield className="h-11 w-11 text-red-600" />
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
                                    <Shield className="mb-3 h-11 w-11 text-red-600 transition-transform group-hover:scale-110" />
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
                                <User className="mb-3 h-11 w-11 text-teal-600" />
                                <h3 className="mb-1 font-bold text-gray-900">Connected Wallet</h3>
                                <p className="mb-2 text-sm text-gray-500">Your Stellar address:</p>
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
                                        the blockchain. Click the "Connect Wallet" button in the top
                                        right corner.
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
        </DashboardShell>
    );
}

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}
