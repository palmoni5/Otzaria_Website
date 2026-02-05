'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import ChangePasswordForm from '@/components/ChangePasswordForm'
import { useDialog } from '@/components/DialogContext'

export default function DashboardPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { showAlert, showConfirm } = useDialog()
  
  const [stats, setStats] = useState({
    myPages: 0,
    completedPages: 0,
    inProgressPages: 0,
    points: 0,
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [showMessageForm, setShowMessageForm] = useState(false)
  const [messageSubject, setMessageSubject] = useState('')
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  const [myMessages, setMyMessages] = useState([])
  const [showMyMessages, setShowMyMessages] = useState(false)
  const [replyingToMessageId, setReplyingToMessageId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const [showNotifModal, setShowNotifModal] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loadingSub, setLoadingSub] = useState(false)

  const [showEmailModal, setShowEmailModal] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [updatingEmail, setUpdatingEmail] = useState(false)

  useEffect(() => {
      update();
    }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/library/auth/login');
    } else if (status === 'authenticated') {
      const isFirstTime = stats.myPages === 0 && stats.recentActivity.length === 0;
      loadUserStats(isFirstTime); 
      loadMyMessages();
      setNewEmail(session?.user?.email || '');
    }
  }, [status, router, session]);

  const loadUserStats = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      const response = await fetch('/api/user/stats');
      const result = await response.json();
      
      if (result.success) {
        setStats({
          myPages: result.stats?.myPages || 0,
          completedPages: result.stats?.completedPages || 0,
          inProgressPages: result.stats?.inProgressPages || 0,
          points: result.stats?.points || 0,
          recentActivity: result.stats?.recentActivity || []
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyMessages = async () => {
    try {
      const response = await fetch('/api/messages', { cache: 'no-store' })
      const result = await response.json()
      
      if (result.success) {
        setMyMessages(result.messages)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const checkSubscriptionStatus = async () => {
    try {
      setLoadingSub(true)
      const response = await fetch('/api/user/notifications')
      const data = await response.json()
      if (data.success) {
        setIsSubscribed(data.isSubscribed)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingSub(false)
    }
  }

  const toggleSubscription = async () => {
    try {
      setLoadingSub(true)
      const response = await fetch('/api/user/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isSubscribed ? 'unsubscribe' : 'subscribe' })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setIsSubscribed(!isSubscribed)
        showAlert(
            'הצלחה', 
            !isSubscribed ? 'נרשמת בהצלחה לקבלת התראות!' : 'הסרת את הרישום מההתראות.'
        );
        setShowNotifModal(false);
      } else {
        showAlert('שגיאה', 'שגיאה בביצוע הפעולה');
      }
    } catch (error) {
      showAlert('שגיאה', 'שגיאה בתקשורת');
    } finally {
      setLoadingSub(false)
    }
  }

  useEffect(() => {
    if (showNotifModal) {
      checkSubscriptionStatus()
    }
  }, [showNotifModal])

  const handleUpdateEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
        showAlert('שגיאה', 'נא להזין כתובת מייל תקינה');
        return;
    }
    
    if (newEmail === session?.user?.email) {
        setShowEmailModal(false);
        return;
    }

    setUpdatingEmail(true);

    try {
        const res = await fetch('/api/auth/update-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newEmail })
        });
        const data = await res.json();

        if (res.ok) {
            await update();
            showAlert('הצלחה', 'כתובת המייל עודכנה בהצלחה!');
            setShowEmailModal(false);
        } else {
            showAlert('שגיאה', data.error || 'שגיאה בעדכון המייל');
        }
    } catch (error) {
        showAlert('שגיאה', 'שגיאת תקשורת');
    } finally {
        setUpdatingEmail(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageSubject.trim() || !messageText.trim()) {
      showAlert('שגיאה', 'נא למלא את כל השדות')
      return
    }

    try {
      setSendingMessage(true)
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: messageSubject,
          content: messageText,
          recipientId: null 
        })
      })

      const result = await response.json()
      if (result.success) {
        showAlert('הצלחה', 'ההודעה נשלחה בהצלחה למנהלים')
        setMessageSubject('')
        setMessageText('')
        setShowMessageForm(false)
        loadMyMessages()
      } else {
        showAlert('שגיאה', result.error || 'שגיאה בשליחת הודעה')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      showAlert('שגיאה', 'שגיאה בשליחת הודעה')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleSendReply = async (messageId) => {
    if (!replyText.trim()) {
      showAlert('שגיאה', 'נא לכתוב תגובה')
      return
    }

    try {
      setSendingReply(true)
      const response = await fetch('/api/messages/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, reply: replyText })
      })

      const result = await response.json()
      if (result.success) {
        showAlert('הצלחה', 'התגובה נשלחה בהצלחה')
        setReplyText('')
        setReplyingToMessageId(null)
        loadMyMessages()
      } else {
        showAlert('שגיאה', result.error || 'שגיאה בשליחת התגובה')
      }
    } catch (error) {
      console.error('Error sending reply:', error)
      showAlert('שגיאה', 'שגיאה בשליחת התגובה')
    } finally {
      setSendingReply(false)
    }
  }

  const isReadByUser = (message) => {
    const userId = session?.user?._id || session?.user?.id;
    if (message.readBy && Array.isArray(message.readBy)) {
        return message.readBy.includes(userId);
    }
    return message.isRead;
  };

  const markMessagesAsRead = async (messages) => {
      const unreadMessagesIds = messages
          .filter(m => !isReadByUser(m))
          .map(m => m.id);

      if (unreadMessagesIds.length === 0) return;

      try {
          await fetch('/api/messages', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messageIds: unreadMessagesIds })
          });
      } catch (error) {
          console.error('Failed to mark messages as read:', error);
      }
  };

  const handleCloseMessages = () => {
    setShowMyMessages(false);
    loadMyMessages();
  };

  useEffect(() => {
      if (showMyMessages && myMessages.length > 0) {
          markMessagesAsRead(myMessages);
      }
  }, [showMyMessages, myMessages]);

  const unreadCount = myMessages.filter(m => {
      const amISender = m.sender._id === session?.user?.id || m.sender === session?.user?.id;
      if (amISender) {
          return m.status === 'replied' && !isReadByUser(m);
      }
      return !isReadByUser(m);
  }).length;

  const getReplySenderDisplayName = (reply) => {
    const currentUserId = session?.user?._id || session?.user?.id
    const replySenderId = reply?.sender
    if (currentUserId && replySenderId && String(currentUserId) === String(replySenderId)) {
      return 'אתה'
    }
    if (reply?.senderRole === 'admin') {
      return reply?.senderName || 'מנהל'
    }
    return reply?.senderName || 'משתמש'
  }

  const sortedActivity = [...stats.recentActivity].sort((a, b) => {
    return (a.status === 'completed') - (b.status === 'completed');
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedActivity.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedActivity.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-6xl text-primary">
          progress_activity
        </span>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isAdmin = session.user.role === 'admin'

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-on-surface">
            שלום, {session.user.name}!
          </h1>
          <p className="text-on-surface/70 mb-8">
            ברוך הבא לאיזור האישי שלך
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="glass p-6 rounded-xl">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-5xl text-blue-600">
                  edit_note
                </span>
                <div>
                  <p className="text-3xl font-bold text-on-surface">
                    {loading ? '...' : stats.inProgressPages}
                  </p>
                  <p className="text-on-surface/70">עמודים בטיפול</p>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-xl">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-5xl text-green-600">
                  check_circle
                </span>
                <div>
                  <p className="text-3xl font-bold text-on-surface">
                    {loading ? '...' : stats.completedPages}
                  </p>
                  <p className="text-on-surface/70">עמודים שהושלמו</p>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-xl">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-5xl text-primary">
                  description
                </span>
                <div>
                  <p className="text-3xl font-bold text-on-surface">
                    {loading ? '...' : stats.myPages}
                  </p>
                  <p className="text-on-surface/70">סה״כ עמודים שלי</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-strong p-8 rounded-2xl mb-8">
            <h2 className="text-2xl font-bold mb-6 text-on-surface">פעולות מהירות</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/library/books" className="flex flex-col items-center gap-3 p-6 bg-primary-container rounded-xl hover:bg-primary/20 transition-all">
                <span className="material-symbols-outlined text-4xl text-primary">library_books</span>
                <span className="font-medium text-on-surface">הספרייה</span>
              </Link>

              <Link href="/library/upload" className="flex flex-col items-center gap-3 p-6 bg-primary-container rounded-xl hover:bg-primary/20 transition-all">
                <span className="material-symbols-outlined text-4xl text-primary">upload_file</span>
                <span className="font-medium text-on-surface">שליחת ספרים</span>
              </Link>

              <button 
                onClick={() => setShowMessageForm(true)}
                className="flex flex-col items-center gap-3 p-6 bg-primary-container rounded-xl hover:bg-primary/20 transition-all"
              >
                <span className="material-symbols-outlined text-4xl text-primary">mail</span>
                <span className="font-medium text-on-surface">שלח הודעה למנהלים</span>
              </button>

              <button 
                onClick={() => setShowMyMessages(true)}
                className="flex flex-col items-center gap-3 p-6 bg-primary-container rounded-xl hover:bg-primary/20 transition-all relative"
              >
                <span className="material-symbols-outlined text-4xl text-primary">inbox</span>
                <span className="font-medium text-on-surface">ההודעות שלי</span>
  
                {unreadCount > 0 && (
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setShowNotifModal(true)}
                className="flex flex-col items-center gap-3 p-6 bg-primary-container rounded-xl hover:bg-primary/20 transition-all"
              >
                <span className="material-symbols-outlined text-4xl text-primary">campaign</span>
                <span className="font-medium text-on-surface">התראות על ספרים חדשים</span>
              </button>

              <button 
                onClick={() => {
                    setNewEmail(session?.user?.email || '');
                    setShowEmailModal(true);
                }}
                className="flex flex-col items-center gap-3 p-6 bg-primary-container rounded-xl hover:bg-primary/20 transition-all"
              >
                <span className="material-symbols-outlined text-4xl text-primary">manage_accounts</span>
                <span className="font-medium text-on-surface">עדכון כתובת מייל</span>
              </button>

              {isAdmin && (
                <Link href="/library/admin" className="flex flex-col items-center gap-3 p-6 bg-accent/20 rounded-xl hover:bg-accent/30 transition-all">
                  <span className="material-symbols-outlined text-4xl text-accent">admin_panel_settings</span>
                  <span className="font-medium text-on-surface">פאנל ניהול</span>
                </Link>
              )}
            </div>
          </div>

          <div className="glass-strong p-8 rounded-2xl mb-8">
            <h2 className="text-2xl font-bold mb-6 text-on-surface">העמודים שלי</h2>
            {loading ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">
                  progress_activity
                </span>
              </div>
            ) : stats.recentActivity && stats.recentActivity.length > 0 ? (
              <>
                <div className="space-y-4">
                  {currentItems.map((activity) => (
                    <div key={`${activity.bookName}-${activity.pageNumber}`} className="flex items-center gap-4 p-4 bg-surface rounded-lg">
                      <span className={`material-symbols-outlined ${
                        activity.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {activity.status === 'completed' ? 'check_circle' : 'edit_note'}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-on-surface">
                          {activity.bookName} - עמוד {activity.pageNumber}
                        </p>
                        <p className="text-sm text-on-surface/60">
                          {activity.status === 'completed' ? 'הושלם' : 'בטיפול'} • {activity.date}
                        </p>
                      </div>
                      {activity.bookPath && activity.bookPath !== '#' && activity.pageNumber !== null && activity.pageNumber !== undefined ? (
                        <Link 
                          href={`/library/edit/${encodeURIComponent(activity.bookPath)}/${activity.pageNumber}`}
                          className="text-primary hover:text-accent"
                        >
                          <span className="material-symbols-outlined">arrow_back</span>
                        </Link>
                      ) : (
                        <span className="text-on-surface/30 cursor-not-allowed" title="לא ניתן לפתוח עמוד זה (ספר חסר)">
                          <span className="material-symbols-outlined">arrow_back</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => paginate(i + 1)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                          currentPage === i + 1
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-surface-variant text-on-surface hover:bg-primary/20'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-on-surface/20 mb-4 block">
                  description
                </span>
                <p className="text-on-surface/60">עדיין לא תפסת עמודים לעריכה</p>
                <Link 
                  href="/library/books"
                  className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-primary text-on-primary rounded-lg hover:bg-accent transition-colors"
                >
                  <span className="material-symbols-outlined">library_books</span>
                  <span>עבור לספרייה</span>
                </Link>
              </div>
            )}
          </div>

          <ChangePasswordForm />
        </div>
      </div>

      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="flex flex-col bg-white glass-strong rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-surface-variant bg-white/50 rounded-t-2xl flex justify-between items-center">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl text-primary">manage_accounts</span>
                עדכון כתובת מייל
              </h3>
              <button 
                onClick={() => setShowEmailModal(false)} 
                className="text-gray-500 hover:text-gray-800"
                disabled={updatingEmail}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
               <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">כתובת מייל נוכחית</label>
                  <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-600">
                    {session?.user?.email}
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">כתובת מייל חדשה</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="הכנס מייל חדש..."
                    className="w-full px-4 py-3 border border-surface-variant rounded-lg focus:outline-none focus:border-primary bg-white text-on-surface shadow-sm"
                    disabled={updatingEmail}
                    dir="ltr"
                  />
               </div>

              <div className="flex gap-3 pt-2">
                <button
                    onClick={() => setShowEmailModal(false)}
                    disabled={updatingEmail}
                    className="flex-1 px-4 py-2 border border-surface-variant text-on-surface rounded-lg hover:bg-surface-variant transition-colors"
                >
                    ביטול
                </button>
                <button
                    onClick={() => {
                        if (!newEmail || !newEmail.includes('@')) {
                            showAlert('שגיאה', 'נא להזין כתובת מייל תקינה');
                            return;
                        }
                        if (newEmail === session?.user?.email) {
                            setShowEmailModal(false);
                            return;
                        }
                        showConfirm(
                            'עדכון כתובת מייל',
                            'שינוי כתובת המייל ידרוש ביצוע אימות מחדש לכתובת החדשה כדי להמשיך להשתמש בחשבון. האם אתה בטוח?',
                            () => handleUpdateEmail()
                        );
                    }}
                    disabled={updatingEmail || !newEmail || newEmail === session?.user?.email}
                    className="flex-[2] px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-accent transition-colors flex items-center justify-center gap-2 font-bold shadow-md"
                >
                    {updatingEmail ? (
                    <>
                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        <span>מעדכן...</span>
                    </>
                    ) : (
                        'עדכן מייל'
                    )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMyMessages && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleCloseMessages}
        >
          <div
            className="flex flex-col bg-white glass-strong rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-surface-variant flex items-center justify-between flex-shrink-0 bg-white/50 rounded-t-2xl">
              <h3 className="text-2xl font-bold text-on-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-primary">inbox</span>
                ההודעות שלי
              </h3>
              <button
                onClick={handleCloseMessages}
                className="p-2 hover:bg-surface-variant rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-2xl block text-on-surface">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {myMessages.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-on-surface/30 mb-4">
                    inbox
                  </span>
                  <p className="text-on-surface/60">אין הודעות עדיין</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myMessages.map(message => {
                    const isUnread = !isReadByUser(message);
                    return (
                      <div 
                        key={message.id} 
                        className={`glass p-6 rounded-lg border transition-colors duration-300 ${
                          isUnread 
                            ? 'bg-red-50 border-red-200 shadow-sm' 
                            : 'border-surface-variant'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-xl font-bold text-on-surface mb-1 flex items-center gap-2">
                                {message.subject}
                                {isUnread && (
                                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                )}
                            </h4>
                            <p className="text-sm text-on-surface/60">
                              {new Date(message.createdAt).toLocaleDateString('he-IL', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            message.status === 'replied' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {message.status === 'replied' ? 'נענה' : 'נשלח'}
                          </span>
                        </div>
                        
                        <p className="text-on-surface whitespace-pre-wrap mb-4">{message.content}</p>

                        {message.replies && message.replies.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-surface-variant">
                            <h5 className="font-bold text-on-surface mb-3 flex items-center gap-2">
                              <span className="material-symbols-outlined text-green-600">reply</span>
                              תגובות בשרשור:
                            </h5>
                            <div className="space-y-3">
                              {message.replies.map((reply, idx) => (
                                <div
                                  key={reply?.id || idx}
                                  className={`${reply?.senderRole === 'admin' ? 'bg-green-50 border border-green-100' : 'bg-surface border border-surface-variant'} p-4 rounded-lg`}
                                >
                                  <p className="text-sm text-on-surface/60 mb-2">
                                    <span className="font-medium text-primary">{getReplySenderDisplayName(reply)}</span>
                                    <span className="mx-2">•</span>
                                    {new Date(reply.createdAt).toLocaleDateString('he-IL', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                  <p className="text-on-surface whitespace-pre-wrap">{reply.content}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-4">
                          {replyingToMessageId === message.id ? (
                            <div className="animate-in fade-in slide-in-from-top-2">
                              <textarea
                                className="w-full px-4 py-3 border border-surface-variant rounded-lg focus:outline-none focus:border-primary bg-white text-on-surface shadow-inner"
                                placeholder="כתוב תגובה..."
                                rows="4"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                disabled={sendingReply}
                                autoFocus
                              />
                              <div className="flex gap-3 mt-3 justify-end">
                                <button
                                  onClick={() => {
                                    setReplyingToMessageId(null)
                                    setReplyText('')
                                  }}
                                  disabled={sendingReply}
                                  className="px-6 py-2 glass rounded-lg hover:bg-surface-variant transition-colors disabled:opacity-50 text-sm"
                                >
                                  ביטול
                                </button>
                                <button
                                  onClick={() => handleSendReply(message.id)}
                                  disabled={sendingReply}
                                  className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-on-primary rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold shadow-sm"
                                >
                                  <span className="material-symbols-outlined text-sm">send</span>
                                  <span>{sendingReply ? 'שולח...' : 'שלח תגובה'}</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setReplyingToMessageId(message.id)
                                setReplyText('')
                              }}
                              className="flex items-center gap-2 px-4 py-2 glass rounded-lg hover:bg-surface-variant transition-colors text-sm font-medium border border-surface-variant"
                            >
                              <span className="material-symbols-outlined text-lg">reply</span>
                              <span>השב</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="flex flex-col bg-white glass-strong rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-surface-variant bg-white/50 rounded-t-2xl flex justify-between items-center">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl text-primary">notifications_active</span>
                התראות על ספרים חדשים
              </h3>
              <button onClick={() => setShowNotifModal(false)} className="text-gray-500 hover:text-gray-800">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-8 text-center space-y-6">
              <div className={`inline-flex items-center justify-center p-4 rounded-full ${isSubscribed ? 'bg-green-100' : 'bg-gray-100'}`}>
                <span className={`material-symbols-outlined text-5xl ${isSubscribed ? 'text-green-600' : 'text-gray-400'}`}>
                  {isSubscribed ? 'mark_email_read' : 'mail_off'}
                </span>
              </div>

              <div>
                <p className="text-lg font-bold text-on-surface mb-2">
                  סטטוס נוכחי: 
                  <span className={isSubscribed ? 'text-green-600 mr-2' : 'text-gray-500 mr-2'}>
                    {isSubscribed ? 'רשום לקבלת עדכונים' : 'לא רשום'}
                  </span>
                </p>
                <p className="text-sm text-on-surface/70">
                  {isSubscribed 
                    ? 'כתובת המייל שלך נמצאת ברשימת התפוצה. תקבל עדכון במייל כשספרים חדשים עולים לאתר.'
                    : 'הצטרף לרשימת התפוצה כדי לקבל עדכונים על ספרים חדשים ישירות למייל.'}
                </p>
              </div>

              <button
                onClick={toggleSubscription}
                disabled={loadingSub}
                className={`w-full py-3 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                  isSubscribed 
                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                    : 'bg-primary text-on-primary hover:bg-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {loadingSub ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined">
                      {isSubscribed ? 'unsubscribe' : 'add_alert'}
                    </span>
                    {isSubscribed ? 'בטל קבלת התראות' : 'אשר קבלת התראות'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMessageForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="flex flex-col bg-white glass-strong rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-surface-variant bg-white/50 rounded-t-2xl">
              <h3 className="text-2xl font-bold text-on-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-primary">mail</span>
                שלח הודעה למנהלים
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">נושא</label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="נושא ההודעה..."
                  className="w-full px-4 py-3 border border-surface-variant rounded-lg focus:outline-none focus:border-primary bg-white text-on-surface shadow-sm"
                  disabled={sendingMessage}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">הודעה</label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="כתוב את ההודעה שלך כאן..."
                  className="w-full px-4 py-3 border border-surface-variant rounded-lg focus:outline-none focus:border-primary bg-white text-on-surface shadow-sm resize-none"
                  rows="8"
                  disabled={sendingMessage}
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-surface-variant bg-gray-50/50 rounded-b-2xl">
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-lg hover:bg-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-md hover:-translate-y-0.5"
              >
                {sendingMessage ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                    <span>שולח...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">send</span>
                    <span>שלח הודעה</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowMessageForm(false)
                  setMessageSubject('')
                  setMessageText('')
                }}
                disabled={sendingMessage}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}