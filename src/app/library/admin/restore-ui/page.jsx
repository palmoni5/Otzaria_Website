'use client'

import { useState } from 'react'
import { uploadFileAction } from './action'

export default function RestoreUIPage() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setStatus('מעלה... (זה עשוי לקחת זמן לקבצים גדולים)')

    const formData = new FormData()
    formData.append('file', file)

    try {
      // קריאה לפונקציית השרת
      const result = await uploadFileAction(formData)
      
      if (result.success) {
        setStatus(`✅ הקובץ ${file.name} הועלה בהצלחה!`)
        setFile(null)
        // איפוס האינפוט
        document.getElementById('fileInput').value = ''
      } else {
        setStatus('❌ שגיאה: ' + result.error)
      }
    } catch (err) {
      setStatus('❌ שגיאה בתקשורת: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-10 max-w-md mx-auto bg-white rounded-xl shadow-lg mt-10 text-center">
      <h1 className="text-2xl font-bold mb-4">העלאת קובץ גיבוי לשרת</h1>
      <p className="text-sm text-gray-500 mb-6">יש להעלות את הקבצים: files.json, messages.json, backups.json</p>
      
      <form onSubmit={handleUpload} className="space-y-4">
        <input 
          id="fileInput"
          type="file" 
          accept=".json"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button 
          type="submit" 
          disabled={!file || loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 w-full flex justify-center"
        >
          {loading ? 'מעלה...' : 'העלה קובץ'}
        </button>
      </form>
      {status && <div className="mt-4 font-bold text-gray-700 break-words">{status}</div>}
    </div>
  )
}