'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function BookReminderPage() {
    const { data: session } = useSession();
    
    const [books, setBooks] = useState([]);
    const [allUsers, setAllUsers] = useState([]); 
    const [history, setHistory] = useState([]);
    
    const [selectedBookPath, setSelectedBookPath] = useState('');
    const [customMessage, setCustomMessage] = useState('שמנו לב כי ישנם עמודים שתפסת לעריכה וטרם הושלמו.\nנודה לך מאוד אם תוכל להיכנס למערכת ולהשלים את העבודה עליהם בהקדם, כדי שנוכל לקדם את הספר לפרסום לטובת הכלל.');
    
    const [recipients, setRecipients] = useState([]);
    const [isCheckingRecipients, setIsCheckingRecipients] = useState(false);
    
    const [status, setStatus] = useState({
        loading: false,
        error: '',
        success: ''
    });

    const normalizeId = (id) => {
        if (!id) return null;
        return String(id).toString();
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'ממש עכשיו';
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `לפני ${minutes} דקות`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `לפני ${hours === 1 ? 'שעה' : hours + ' שעות'}`;
        
        const days = Math.floor(hours / 24);
        return `לפני ${days === 1 ? 'יום אחד' : days + ' ימים'}`;
    };

    const handleDeleteHistory = async (id) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק רשומה זו מההיסטוריה?')) return;

        try {
            setHistory(prev => prev.filter(item => item.id !== id));

            const res = await fetch(`/api/admin/history?id=${id}`, {
                method: 'DELETE',
            });
            
            const data = await res.json();
            if (!data.success) {
                console.error('Failed to delete history item');
            }
        } catch (error) {
            console.error('Error deleting history:', error);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const booksRes = await fetch('/api/library/list');
                const booksData = await booksRes.json();
                if (booksData.success) {
                    const booksWithWork = booksData.books.filter(book => 
                        !book.isHidden &&
                        (
                            (book.inProgressPages && book.inProgressPages > 0) || 
                            (book.completedPages < book.totalPages)
                        )
                    );
                    setBooks(booksWithWork);
                }

                const usersRes = await fetch('/api/admin/users');
                const usersData = await usersRes.json();
                if (usersData.success && Array.isArray(usersData.users)) {
                    setAllUsers(usersData.users);
                }

                try {
                    const historyRes = await fetch('/api/admin/history');
                    if (historyRes.ok) {
                        const historyText = await historyRes.text();
                        if (historyText) {
                            const historyData = JSON.parse(historyText);
                            if (historyData.success) {
                                setHistory(historyData.history);
                            }
                        }
                    }
                } catch (e) {
                    console.error('History fetch failed:', e);
                }

            } catch (error) {
                console.error('Error loading initial data:', error);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        if (!selectedBookPath) {
            setRecipients([]);
            return;
        }

        const fetchRecipients = async () => {
            setIsCheckingRecipients(true);
            setRecipients([]);

            try {
                const response = await fetch(`/api/book/${encodeURIComponent(selectedBookPath)}`);
                const data = await response.json();

                if (data.success && data.pages) {
                    const userMap = new Map();
                    allUsers.forEach(u => {
                        if (u._id) userMap.set(normalizeId(u._id), u);
                        if (u.id) userMap.set(normalizeId(u.id), u);
                    });

                    const foundEmails = new Set();
                    
                    data.pages.forEach(page => {
                        if (page.status === 'in-progress') {
                            let rawUserId = page.claimedById || page.holder;
                            if (rawUserId && typeof rawUserId === 'object' && rawUserId._id) {
                                rawUserId = rawUserId._id;
                            }
                            const userId = normalizeId(rawUserId);

                            if (userId) {
                                const userDetails = userMap.get(userId);
                                if (userDetails && userDetails.email && userDetails.acceptReminders && userDetails.isVerified) {
                                    foundEmails.add(userDetails.email);
                                }
                            }
                        }
                    });

                    setRecipients(Array.from(foundEmails));
                }
            } catch (error) {
                console.error('Error fetching recipients:', error);
            } finally {
                setIsCheckingRecipients(false);
            }
        };

        if (allUsers.length > 0) {
            fetchRecipients();
        }
    }, [selectedBookPath, allUsers]);

    const generateEmailHtml = (bookName, messageBody) => {
        const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const formattedBody = messageBody.replace(/\n/g, '<br/>');

        return `
        <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 40px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                <div style="background-color: #ffffff; padding: 20px; border-bottom: 3px solid #d4a373;">
                    <img src="https://www.otzaria.org/logo.svg" alt="Otzaria Logo" style="width: 120px; height: auto;">
                </div>
                <div style="padding: 30px; color: #333333;">
                    <h1 style="color: #2c3e50; font-size: 24px; margin-bottom: 10px;">הודעה בנוגע לספר: ${bookName}</h1>
                    <div style="font-size: 18px; line-height: 1.6; text-align: right; margin-bottom: 30px;">
                        ${formattedBody}
                    </div>
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${siteUrl}/library/books" style="background-color: #d4a373; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                            כנס לספרייה
                        </a>
                    </div>
                </div>
                <div style="background-color: #f0f0f0; padding: 15px; font-size: 12px; color: #888888;">
                    הודעה זו נשלחה אליך ממערכת ספריית אוצריא.<br>
                    תודה על תרומתך!
                </div>
            </div>
        </div>
        `;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedBookPath || recipients.length === 0) return;

        setStatus({ loading: true, error: '', success: '' });

        try {
            const selectedBook = books.find(b => b.path === selectedBookPath);
            const emailHtml = generateEmailHtml(selectedBook.name, customMessage);
            const emailSubject = `הודעה מערכת בנוגע לספר "${selectedBook.name}"`;

            const response = await fetch('/api/admin/send-email', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bcc: recipients,
                    subject: emailSubject,
                    html: emailHtml,
                    text: customMessage,
                    bookName: selectedBook.name,
                    bookPath: selectedBook.path
                }),
            });

            const textResponse = await response.text();
            let result;
            try {
                result = textResponse ? JSON.parse(textResponse) : {};
            } catch (e) {
                console.error('Failed to parse response:', textResponse);
                throw new Error('התקבלה תשובה לא תקינה מהשרת');
            }

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'שגיאה בשליחה');
            }

            const newHistoryItem = {
                id: Date.now().toString(),
                adminName: session?.user?.name || 'אדמין',
                bookName: selectedBook.name,
                timestamp: new Date().toISOString()
            };
            
            setHistory(prev => [newHistoryItem, ...prev]);

            setStatus({ 
                loading: false, 
                error: '', 
                success: `המיילים נשלחו בהצלחה ל-${recipients.length} משתמשים!` 
            });

        } catch (error) {
            setStatus({ loading: false, error: error.message, success: '' });
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-8 bg-white shadow-xl rounded-2xl mt-10">
            <h1 className="text-3xl font-bold mb-2 text-gray-800 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-4xl">forward_to_inbox</span>
                שליחת תזכורות לעורכים
            </h1>
            <p className="text-gray-500 mb-8">
                המערכת תאתר אוטומטית את המשתמשים שעובדים כרגע על הספר הנבחר ותשלח להם את ההודעה.
            </p>

            <form onSubmit={handleSubmit} className="space-y-8">
                
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        1. בחר ספר (מוצגים רק ספרים בטיפול)
                    </label>
                    <select
                        value={selectedBookPath}
                        onChange={(e) => setSelectedBookPath(e.target.value)}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white transition-all"
                    >
                        <option value="">-- בחר ספר מהרשימה --</option>
                        {books.map(book => (
                            <option key={book.id} value={book.path}>
                                {book.name} ({book.category})
                            </option>
                        ))}
                    </select>

                    {selectedBookPath && (
                        <div className="mt-3 flex items-center gap-2 text-sm animate-in fade-in">
                            {isCheckingRecipients ? (
                                <span className="text-blue-600 flex items-center gap-2">
                                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                    מאתר נמענים...
                                </span>
                            ) : recipients.length > 0 ? (
                                <span className="text-green-600 font-bold flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                                    <span className="material-symbols-outlined text-sm">group</span>
                                    נמצאו {recipients.length} נמענים פעילים
                                </span>
                            ) : (
                                <span className="text-red-500 flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                                    <span className="material-symbols-outlined text-sm">warning</span>
                                    לא נמצאו נמענים פעילים בספר זה שאישרו תזכורות ואימתו את כתובתם
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        2. תוכן ההודעה (משתלב בתוך התבנית הקבועה)
                    </label>
                    <textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        required
                        rows="5"
                        placeholder="כתוב כאן את המסר שלך למתנדבים..."
                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none resize-y text-base leading-relaxed"
                    ></textarea>
                </div>

                <button
                    type="submit"
                    disabled={status.loading || recipients.length === 0}
                    className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform active:scale-[0.98]
                        ${status.loading || recipients.length === 0 
                            ? 'bg-gray-400 cursor-not-allowed opacity-70' 
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'}`}
                >
                    {status.loading ? (
                        <>
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                            שולח הודעות...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined">send</span>
                            שלח תזכורת ל-{recipients.length} משתמשים
                        </>
                    )}
                </button>

                {status.success && (
                    <div className="p-4 bg-green-50 text-green-800 rounded-xl border border-green-200 flex items-center gap-3 animate-in slide-in-from-bottom-2">
                        <span className="material-symbols-outlined text-2xl text-green-600">check_circle</span>
                        <div>
                            <p className="font-bold">השליחה בוצעה!</p>
                            <p className="text-sm">{status.success}</p>
                        </div>
                    </div>
                )}
                
                {status.error && (
                    <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 flex items-center gap-3 animate-in slide-in-from-bottom-2">
                        <span className="material-symbols-outlined text-2xl text-red-600">error</span>
                        <div>
                            <p className="font-bold">שגיאה בשליחה</p>
                            <p className="text-sm">{status.error}</p>
                        </div>
                    </div>
                )}
            </form>

            {history.length > 0 && (
                <div className="mt-12 border-t pt-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-500">history</span>
                        היסטוריית שליחות אחרונות
                    </h2>
                    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                        {history.map((item) => (
                            <div key={item.id} className="p-4 border-b border-gray-100 last:border-0 hover:bg-white transition-colors flex items-center justify-between group">
                                <div>
                                    <div className="font-bold text-gray-800">{item.bookName}</div>
                                    <div className="text-sm text-gray-500">נשלח על ידי: {item.adminName}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-left">
                                        <div className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block">
                                            {formatTimeAgo(item.timestamp)}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1" dir="ltr">
                                            {new Date(item.timestamp).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleDeleteHistory(item.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100"
                                        title="מחק מההיסטוריה"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}