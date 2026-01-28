'use client';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function ReminderGuard({ children }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (status === 'loading') return;

        const exemptPaths = [
            '/library/auth/login', 
            '/library/auth/register', 
            '/library/auth/approve-terms',
            '/library/auth/verify-request',
            '/library/auth/verify-success'
        ];

        if (exemptPaths.includes(pathname) || pathname?.startsWith('/api') || status !== 'authenticated') {
            return;
        }

        if (!session?.user?.isVerified) {
            router.replace('/library/auth/verify-request');
            return;
        }

        if (!session?.user?.acceptReminders) {
            router.replace('/library/auth/approve-terms');
        }

    }, [status, session, router, pathname]);

    if (status === 'authenticated') {
        const isVerified = session?.user?.isVerified;
        const acceptReminders = session?.user?.acceptReminders;
        
        if (!isVerified && pathname !== '/library/auth/verify-request' && pathname !== '/library/auth/verify-success') {
            return <LoadingScreen />;
        }

        if (isVerified && !acceptReminders && pathname !== '/library/auth/approve-terms') {
            return <LoadingScreen />;
        }
    }

    return children;
}

function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        </div>
    );
}