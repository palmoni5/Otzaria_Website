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
            '/library/auth/approve-terms'
        ];

        if (exemptPaths.includes(pathname) || pathname?.startsWith('/api') || status !== 'authenticated') {
            return;
        }

        if (!session?.user?.acceptReminders) {
            router.replace('/library/auth/approve-terms');
        }

    }, [status, session, router, pathname]);

    if (status === 'authenticated' && !session?.user?.acceptReminders && pathname !== '/library/auth/approve-terms') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
        );
    }

    return children;
}
