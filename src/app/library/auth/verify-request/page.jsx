'use client';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function VerifyRequestPage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [status, setStatus] = useState({ loading: false, message: '', error: '' });

    useEffect(() => {
        if (session?.user?.isVerified) {
            router.push('/library/dashboard');
        }
    }, [session, router]);

    useEffect(() => {
        if (session && !session.user.emailVerified) {
            const interval = setInterval(async () => {
                const newSession = await update();
                if (session?.user?.isVerified) {
                    router.push('/library/dashboard');
                }
            }, 5000); 

            return () => clearInterval(interval);
        }
    }, [session, update, router]);

    const handleSendVerification = async () => {
        setStatus({ loading: true, message: '', error: '' });

        try {
            const res = await fetch('/api/auth/verify/send', { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                setStatus({ 
                    loading: false, 
                    message: 'מייל לאימות נשלח בהצלחה! אנא בדוק את תיבת הדואר שלך (וגם את הספאם) ולחץ על הקישור.\nהקישור תקף לשעה אחת.', 
                    error: '' 
                });
            } else {
                setStatus({ loading: false, message: '', error: data.error || 'שגיאה בשליחה' });
            }
        } catch (error) {
            setStatus({ loading: false, message: '', error: 'שגיאת תקשורת' });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-in fade-in zoom-in-95 duration-300">
                
                <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-yellow-100">
                    <span className="material-symbols-outlined text-5xl text-yellow-600">mark_email_unread</span>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-2">נדרש אימות כתובת מייל</h1>
                <p className="text-gray-600 mb-6">
                    החשבון שלך (<strong>{session?.user?.email}</strong>) טרם אומת.
                    <br/>
                    כדי להגן על המערכת ולוודא שהכתובת בבעלותך, עליך לבצע אימות.
                </p>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 text-sm text-blue-800 text-right">
                    <strong>שים לב:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>לחיצה על הכפתור למטה תשלח אליך קישור חד-פעמי למייל.</li>
                        <li>בעת השליחה, אתה מצהיר כי כתובת המייל הזו בבעלותך.</li>
                        <li>לאחר הלחיצה על הקישור במייל, חשבונך יאושר בשרת באופן מיידי.</li>
                    </ul>
                </div>

                <button 
                    onClick={handleSendVerification}
                    disabled={status.loading || status.message}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all shadow-md flex items-center justify-center gap-2
                        ${status.message 
                            ? 'bg-green-600 text-white cursor-default' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'}`}
                >
                    {status.loading ? (
                        <>
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                            שולח מייל...
                        </>
                    ) : status.message ? (
                        <>
                            <span className="material-symbols-outlined">check_circle</span>
                            נשלח! ממתין לאימות שלך...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined">send</span>
                            שלח לי מייל לאימות
                        </>
                    )}
                </button>

                {status.message && (
                    <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-xl text-sm border border-green-200 animate-in slide-in-from-top-2">
                        {status.message}
                    </div>
                )}

                {status.error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-xl text-sm border border-red-200">
                        {status.error}
                    </div>
                )}
                
                <div className="mt-8 border-t pt-4">
                    <button 
                        onClick={() => signOut({ callbackUrl: '/library/auth/login' })}
                        className="text-gray-400 hover:text-gray-600 text-sm flex items-center justify-center gap-1 mx-auto"
                    >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        התנתק בינתיים
                    </button>
                </div>
            </div>
        </div>
    );
}