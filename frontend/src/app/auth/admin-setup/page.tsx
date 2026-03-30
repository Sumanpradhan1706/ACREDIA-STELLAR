'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Lock, Mail, Eye, EyeOff, ArrowLeft, User, AlertTriangle } from 'lucide-react';

export default function AdminSetupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

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

            if (data.user) {
                if (data.session) {
                    // No email confirmation needed - user can login immediately
                    toast.success('✅ Admin account created successfully!');
                    toast.info('Redirecting to admin login...');
                    setTimeout(() => router.push('/auth/admin-login'), 2000);
                } else {
                    // Email confirmation required
                    toast.success('✅ Registration successful!');
                    toast.warning('📧 Check your email for confirmation link');
                    toast.info('⚠️ Check spam/junk folder if not in inbox');

                    // Show detailed message
                    console.log('✉️ Confirmation email sent to:', email);
                    console.log('📌 Check your spam folder if you don\'t see it');
                    console.log('🔗 Click the link in the email to verify your account');
                    console.log('⏰ After verification, login at /auth/admin-login');
                }
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            toast.error('Registration failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 via-red-50 to-orange-50 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 right-0 w-96 h-96 bg-red-200/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl"></div>
            </div>

            <Card className="w-full max-w-md p-8 space-y-6 relative z-10 shadow-2xl border-2 border-red-100">
                {/* Logo & Title */}
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
                            <Shield className="absolute -bottom-2 -right-2 h-8 w-8 text-red-600 bg-white rounded-full p-1 shadow-lg" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Admin Registration
                    </h1>
                    <p className="text-gray-600">
                        Create your admin account
                    </p>
                </div>

                {/* Info Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-yellow-900">
                                Email Confirmation Required
                            </p>
                            <p className="text-xs text-yellow-700 mt-1">
                                After registration, check your email (including spam/junk folder) for a confirmation link from Supabase. Click the link to verify your email before logging in.
                            </p>
                            <p className="text-xs text-yellow-700 mt-2 font-semibold">
                                📧 Not receiving emails? Check Supabase Dashboard → Settings → Authentication → SMTP Settings to configure custom email service.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Registration Form */}
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
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="pl-10 border-gray-300 focus:border-red-500 focus:ring-red-500"
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
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="pl-10 border-gray-300 focus:border-red-500 focus:ring-red-500"
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
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="pl-10 pr-10 border-gray-300 focus:border-red-500 focus:ring-red-500"
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
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="pl-10 border-gray-300 focus:border-red-500 focus:ring-red-500"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Creating Account...
                            </>
                        ) : (
                            <>
                                <Shield className="h-4 w-4 mr-2" />
                                Create Admin Account
                            </>
                        )}
                    </Button>
                </form>

                {/* Back Link */}
                <div className="pt-4 border-t border-gray-200 space-y-2">
                    <Link href="/auth/admin-login">
                        <Button
                            variant="ghost"
                            className="w-full text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Admin Login
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}