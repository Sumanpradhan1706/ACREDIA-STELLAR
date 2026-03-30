'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';
import { signIn } from '@/lib/supabase';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error } = await signIn(email, password);

            if (error) {
                setError(error.message);
                return;
            }

            // Redirect to dashboard (we'll determine role-based routing later)
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-gray-200 bg-white shadow-2xl p-8">
                <div className="flex flex-col items-center mb-8">
                    <Image
                        src="/logo.png"
                        alt="Acredia Logo"
                        width={80}
                        height={80}
                        className="rounded-xl mb-4"
                    />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                    <p className="text-gray-600 text-center">
                        Sign in to access your Acredia account
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <Label htmlFor="email" className="text-gray-900">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400"
                        />
                    </div>

                    <div>
                        <Label htmlFor="password" className="text-gray-900">
                            Password
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Don't have an account?{' '}
                        <Link
                            href="/auth/register"
                            className="text-blue-400 hover:text-blue-300 font-medium"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                    <Link
                        href="/auth/admin-login"
                        className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center justify-center gap-2"
                    >
                        <Shield className="h-4 w-4" />
                        Admin Access
                    </Link>
                </div>

                <div className="mt-4 text-center">
                    <Link
                        href="/"
                        className="text-slate-400 hover:text-slate-300 text-sm"
                    >
                        ← Back to home
                    </Link>
                </div>
            </Card>
        </div>
    );
}
