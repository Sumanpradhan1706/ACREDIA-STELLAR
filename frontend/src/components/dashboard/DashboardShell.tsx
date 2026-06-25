'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { ConnectWallet } from '@/components/ui/ConnectWallet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardTopbarProps {
    brandBadge?: string;
    brandBadgeClassName?: string;
    onSignOut: () => void;
}

interface DashboardPageHeaderProps {
    title: ReactNode;
    subtitle?: ReactNode;
    icon?: ReactNode;
    className?: string;
}

interface DashboardShellProps extends DashboardTopbarProps, DashboardPageHeaderProps {
    children: ReactNode;
    contentClassName?: string;
}

export function DashboardTopbar({
    brandBadge,
    brandBadgeClassName,
    onSignOut,
}: DashboardTopbarProps) {
    return (
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
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-linear-to-r from-teal-600 to-cyan-600 bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
                                ACREDIA
                            </span>
                            {brandBadge && (
                                <span
                                    className={cn(
                                        'rounded-full bg-red-600 px-2 py-1 text-xs font-semibold text-white',
                                        brandBadgeClassName,
                                    )}
                                >
                                    {brandBadge}
                                </span>
                            )}
                        </div>
                    </Link>
                    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap sm:space-x-4">
                        <ConnectWallet />
                        <Button
                            onClick={onSignOut}
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
    );
}

export function DashboardPageHeader({
    title,
    subtitle,
    icon,
    className,
}: DashboardPageHeaderProps) {
    return (
        <div className={cn('mb-8', className)}>
            <div className={cn('mb-2', icon && 'flex items-center space-x-3')}>
                {icon}
                <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{title}</h1>
            </div>
            {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
        </div>
    );
}

export function DashboardShell({
    children,
    contentClassName,
    title,
    subtitle,
    icon,
    className,
    brandBadge,
    brandBadgeClassName,
    onSignOut,
}: DashboardShellProps) {
    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 via-teal-50 to-cyan-50">
            <DashboardTopbar
                brandBadge={brandBadge}
                brandBadgeClassName={brandBadgeClassName}
                onSignOut={onSignOut}
            />
            <main className={cn('container mx-auto px-4 py-8', contentClassName)}>
                <DashboardPageHeader
                    title={title}
                    subtitle={subtitle}
                    icon={icon}
                    className={className}
                />
                {children}
            </main>
        </div>
    );
}
