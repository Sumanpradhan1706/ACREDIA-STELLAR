'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    AlertTriangle,
    ArrowLeft,
    Eye,
    EyeOff,
    Lock,
    Mail,
    Shield,
    User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { debugLog } from '@/lib/debug';
import { supabase } from '@/lib/supabase';

export default function AdminSetupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (event: React.FormEvent) => {
        event.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        role: 'admin',
                    },
                    emailRedirectTo: `${window.location.origin}/auth/admin-login`,
                },
            });

            if (error) {
                toast.error('Registration failed: ' + error.message);
                return;
            }

            if (!data.user) {
                return;
            }

            if (data.session) {
                toast.success('Admin account created successfully!');
                toast.info('Redirecting to admin login...');
                setTimeout(() => router.push('/auth/admin-login'), 2000);
                return;
            }

            toast.success('Registration successful!');
            toast.warning('Check your email for a confirmation link');
            toast.info('Check spam or junk if it does not arrive in your inbox');
            debugLog('Admin registration requires email confirmation.');
        } catch (error: any) {
            console.error('Registration error:', error);
            toast.error('Registration failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 via-red-50 to-orange-50 p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-red-200/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-orange-200/20 blur-3xl"></div>
            </div>

            <Card className="relative z-10 w-full max-w-md space-y-6 border-2 border-red-100 p-8 shadow-2xl">
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="relative">
                            <Image
                                src="/logo.png"
                                alt="Acredia Logo"
                                width={80}
                                height={80}
                                className="rounded-lg"
                            />
                            <Shield className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white p-1 text-red-600 shadow-lg" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Admin Registration</h1>
                    <p className="text-gray-600">Create your admin account</p>
                </div>

                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <div className="flex items-start space-x-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />
                        <div>
                            <p className="text-sm font-semibold text-yellow-900">
                                Email Confirmation Required
                            </p>
                            <p className="mt-1 text-xs text-yellow-700">
                                After registration, check your email, including spam or junk, for a
                                confirmation link from Supabase. Open the link before logging in.
                            </p>
                            <p className="mt-2 text-xs font-semibold text-yellow-700">
                                Not receiving emails? Check Supabase Dashboard -&gt; Settings -&gt;
                                Authentication -&gt; SMTP Settings to configure a custom email
                                service.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-700">
                            Full Name
                        </Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <Input
                                id="name"
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                required
                                className="border-gray-300 pl-10 focus:border-red-500 focus:ring-red-500"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700">
                            Email Address
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                                className="border-gray-300 pl-10 focus:border-red-500 focus:ring-red-500"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-700">
                            Password
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="********"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                                className="border-gray-300 pl-10 pr-10 focus:border-red-500 focus:ring-red-500"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">Minimum 6 characters</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-gray-700">
                            Confirm Password
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <Input
                                id="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="********"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                required
                                className="border-gray-300 pl-10 focus:border-red-500 focus:ring-red-500"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-red-600 text-white hover:bg-red-700"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                Creating Account...
                            </>
                        ) : (
                            <>
                                <Shield className="mr-2 h-4 w-4" />
                                Create Admin Account
                            </>
                        )}
                    </Button>
                </form>

                <div className="space-y-2 border-t border-gray-200 pt-4">
                    <Link href="/auth/admin-login">
                        <Button variant="ghost" className="w-full text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Admin Login
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}
