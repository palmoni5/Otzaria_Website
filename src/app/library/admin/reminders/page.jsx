'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function BookReminderPage() {
    const { data: session } = useSession();
    
    // רשימות נתונים
    const [books, setBooks] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    
    // בחירות המשתמש
    const [selectedBookPath, setSelectedBookPath] = useState('');
    const [customMessage, setCustomMessage] = useState('שמנו לב כי ישנם עמודים שתפסת לעריכה וטרם הושלמו.\nנודה לך מאוד אם תוכל להיכנס למערכת ולהשלים את העבודה עליהם בהקדם, כדי שנוכל לקדם את הספר לפרסום לטובת הכלל.');
    
    // נתונים מחושבים
    const [recipients, setRecipients] = useState([]);
    const [isCheckingRecipients, setIsCheckingRecipients] = useState(false);
    
    // סטטוס כללי
    const [status, setStatus] = useState({
        loading: false,
        error: '',
        success: ''
    });

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const booksRes = await fetch('/api/library/list');
                const booksData = await booksRes.json();
                if (booksData.success) {
                    const booksWithWork = booksData.books.filter(book => 
                        (book.inProgressPages && book.inProgressPages > 0) || 
                        (book.completedPages < book.totalPages)
                    );
                    setBooks(booksWithWork);
                }

                const usersRes = await fetch('/api/admin/users');
                const usersData = await usersRes.json();
                if (usersData.success && Array.isArray(usersData.users)) {
                    setAllUsers(usersData.users);
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
                    const emails = new Set();
                    
                    data.pages.forEach(page => {
                        if (page.status === 'in-progress') {
                            
                            const userId = page.claimedById || (page.holder && page.holder._id);

                            if (userId) {
                                const userDetails = allUsers.find(u => u._id === userId || u.id === userId);
                                if (userDetails && userDetails.email) {
                                    emails.add(userDetails.email);
                                }
                            }
                        }
                    });
                    
                    setRecipients(Array.from(emails));
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

    // 3. יצירת HTML מעוצב
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
                    text: customMessage
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'שגיאה בשליחה');
            }

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
                שליחת תזכורות למתנדבים
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
                                    לא נמצאו נמענים פעילים בספר זה (או שחסרים פרטי אימייל)
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
        </div>
    );
}
