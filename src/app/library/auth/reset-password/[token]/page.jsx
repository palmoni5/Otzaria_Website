'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function ResetPasswordPage({ params }) {
  const { token } = params
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState({ loading: false, message: '', error: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
        setStatus({ ...status, error: 'הסיסמאות אינן תואמות' })
        return
    }
    
    setStatus({ loading: true, message: '', error: '' })

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })
      const data = await res.json()
      
      if (res.ok) {
        setStatus({ loading: false, message: 'הסיסמה שונתה בהצלחה! מעביר להתחברות...', error: '' })
        setTimeout(() => router.push('/library/auth/login'), 2000)
      } else {
        setStatus({ loading: false, message: '', error: data.error || 'שגיאה בשינוי הסיסמה' })
      }
    } catch (error) {
      setStatus({ loading: false, message: '', error: 'שגיאת תקשורת' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-md w-full glass-strong p-8 rounded-2xl shadow-xl text-center">
        <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="Logo" width={60} height={60} />
        </div>
        <h2 className="text-2xl font-bold mb-4">סיסמה חדשה</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="סיסמה חדשה"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="אימות סיסמה"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
            <button 
                type="submit" 
                disabled={status.loading}
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
                {status.loading ? 'מעדכן...' : 'שנה סיסמה'}
            </button>
        </form>

        {status.message && <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">{status.message}</div>}
        {status.error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">{status.error}</div>}
      </div>
    </div>
  )
}