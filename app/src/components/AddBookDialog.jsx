'use client'

import { useState, useEffect } from 'react'

export default function AddBookDialog({ isOpen, onClose, onBookAdded }) {
    const [mode, setMode] = useState('single') // 'single' = ספר אחד עם מספר PDFs, 'multi' = מספר ספרים
    const [bookName, setBookName] = useState('')
    const [files, setFiles] = useState([])
    const [serverOnline, setServerOnline] = useState(false)
    const [isConverting, setIsConverting] = useState(false)
    const [progress, setProgress] = useState(null)
    const [error, setError] = useState(null)

    // בדוק סטטוס שרת
    useEffect(() => {
        if (!isOpen) return
        
        const checkServer = async () => {
            try {
                const res = await fetch('http://localhost:5000/health')
                const data = await res.json()
                setServerOnline(data.status === 'ok')
            } catch {
                setServerOnline(false)
            }
        }
        
        checkServer()
        const interval = setInterval(checkServer, 3000)
        return () => clearInterval(interval)
    }, [isOpen])

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files).filter(
            file => file.type === 'application/pdf'
        )
        setFiles(prev => [...prev, ...selectedFiles])
        
        // אם מצב יחיד ואין שם, קח משם הקובץ הראשון
        if (mode === 'single' && !bookName && selectedFiles.length > 0) {
            setBookName(selectedFiles[0].name.replace('.pdf', '').replace(/[_-]\d+$/, ''))
        }
    }

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if (files.length === 0) {
            setError('נא לבחור לפחות קובץ PDF אחד')
            return
        }

        if (mode === 'single' && !bookName.trim()) {
            setError('נא להזין שם ספר')
            return
        }

        setIsConverting(true)
        setError(null)

        if (mode === 'single') {
            // ספר אחד עם מספר קבצים
            await processSingleBook()
        } else {
            // מספר ספרים נפרדים
            await processMultipleBooks()
        }

        setIsConverting(false)
    }

    const processSingleBook = async () => {
        try {
            setProgress({ step: 'uploading', message: 'שולח קבצים לשרת...' })

            const formData = new FormData()
            // הוסף את כל הקבצים
            files.forEach(file => {
                formData.append('pdf', file)
            })
            formData.append('bookName', bookName.trim())

            const res = await fetch('http://localhost:5000/convert', {
                method: 'POST',
                body: formData
            })

            const result = await res.json()
            
            if (!result.success) {
                throw new Error(result.error || 'שגיאה בהתחלת המרה')
            }

            const jobResult = await pollJobStatus(result.job_id)
            
            // הוסף את הספר למערכת עם המיפוי
            await fetch('/api/admin/books/update-mapping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    bookId: jobResult?.book_id,
                    bookName: bookName.trim(),
                    totalPages: jobResult?.total_pages || 0
                })
            })

            if (onBookAdded) onBookAdded()
            handleClose()

        } catch (err) {
            setError(err.message)
        }
    }

    const processMultipleBooks = async () => {
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const name = file.name.replace('.pdf', '')

            try {
                setProgress({ 
                    step: 'uploading', 
                    message: `מעבד ${name} (${i + 1}/${files.length})...`,
                    currentFile: i + 1,
                    totalFiles: files.length
                })

                const formData = new FormData()
                formData.append('pdf', file)
                formData.append('bookName', name)

                const res = await fetch('http://localhost:5000/convert', {
                    method: 'POST',
                    body: formData
                })

                const result = await res.json()
                
                if (!result.success) {
                    console.error(`Error with ${name}:`, result.error)
                    continue
                }

                const jobResult = await pollJobStatus(result.job_id)
                
                // הוסף את הספר למערכת עם המיפוי
                await fetch('/api/admin/books/update-mapping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        bookId: jobResult?.book_id,
                        bookName: name,
                        totalPages: jobResult?.total_pages || 0
                    })
                })

            } catch (err) {
                console.error(`Error processing ${name}:`, err)
            }
        }

        if (onBookAdded) onBookAdded()
        handleClose()
    }

    const pollJobStatus = async (jobId) => {
        return new Promise((resolve, reject) => {
            let attempts = 0
            const maxAttempts = 600

            const poll = async () => {
                if (attempts >= maxAttempts) {
                    reject(new Error('התהליך לקח יותר מדי זמן'))
                    return
                }

                try {
                    const res = await fetch(`http://localhost:5000/status/${jobId}`)
                    const result = await res.json()

                    if (!result.success) {
                        throw new Error('שגיאה בקבלת סטטוס')
                    }

                    const job = result.job
                    setProgress(prev => ({
                        ...prev,
                        step: job.status,
                        message: job.message,
                        totalPages: job.total_pages,
                        convertedPages: job.converted_pages,
                        totalImages: job.total_images,
                        uploadedImages: job.uploaded_images
                    }))

                    if (job.status === 'completed') {
                        // החזר את פרטי ה-job
                        resolve({
                            book_id: job.book_id,
                            total_pages: job.total_pages
                        })
                        return
                    }

                    if (job.status === 'error') {
                        reject(new Error(job.error || 'שגיאה בתהליך'))
                        return
                    }

                    attempts++
                    setTimeout(poll, 1000)

                } catch (err) {
                    reject(err)
                }
            }

            poll()
        })
    }

    const handleClose = () => {
        if (isConverting) return
        setMode('single')
        setBookName('')
        setFiles([])
        setProgress(null)
        setError(null)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">הוסף ספרים</h2>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                        serverOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {serverOnline ? 'שרת מחובר' : 'שרת לא מחובר'}
                    </div>
                </div>

                {!serverOnline && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <p className="font-bold text-yellow-800 mb-2">השרת המקומי לא רץ</p>
                        <p className="text-sm text-yellow-700">
                            הרץ: <code className="bg-yellow-100 px-2 py-1 rounded">start-converter-server.bat</code>
                        </p>
                    </div>
                )}

                {!isConverting && (
                    <>
                        {/* בחירת מצב */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setMode('single')}
                                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                                    mode === 'single' 
                                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="font-medium">ספר אחד</div>
                                <div className="text-xs text-gray-500">מספר PDFs → ספר אחד</div>
                            </button>
                            <button
                                onClick={() => setMode('multi')}
                                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                                    mode === 'multi' 
                                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="font-medium">מספר ספרים</div>
                                <div className="text-xs text-gray-500">כל PDF = ספר נפרד</div>
                            </button>
                        </div>

                        {/* שם ספר (רק במצב יחיד) */}
                        {mode === 'single' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">שם הספר</label>
                                <input
                                    type="text"
                                    value={bookName}
                                    onChange={(e) => setBookName(e.target.value)}
                                    placeholder="לדוגמה: חוות דעת"
                                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        )}

                        {/* בחירת קבצים */}
                        <div className="mb-4">
                            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    multiple
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="pdf-input"
                                />
                                <label htmlFor="pdf-input" className="cursor-pointer">
                                    <p className="text-gray-600 font-medium mb-1">לחץ לבחירת קבצי PDF</p>
                                    <p className="text-sm text-gray-400">
                                        {mode === 'single' 
                                            ? 'בחר מספר קבצים שיתאחדו לספר אחד (לפי סדר השמות)'
                                            : 'כל קובץ יהפוך לספר נפרד'
                                        }
                                    </p>
                                </label>
                            </div>
                        </div>

                        {/* רשימת קבצים */}
                        {files.length > 0 && (
                            <div className="mb-4 border rounded-lg p-3 max-h-48 overflow-y-auto">
                                <div className="text-sm font-medium mb-2">
                                    {files.length} קבצים נבחרו
                                    {mode === 'single' && ' (יתאחדו לספר אחד)'}
                                </div>
                                {files.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between py-1 text-sm">
                                        <span className="text-gray-600">
                                            {index + 1}. {file.name}
                                        </span>
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="text-red-500 hover:text-red-700 px-2"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* התקדמות */}
                {isConverting && progress && (
                    <div className="text-center py-8">
                        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-lg font-medium mb-2">{progress.message}</p>
                        
                        {progress.totalPages && (
                            <div className="mb-3">
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>המרת עמודים</span>
                                    <span>{progress.convertedPages || 0} / {progress.totalPages}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                        style={{ width: `${((progress.convertedPages || 0) / progress.totalPages) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {progress.totalImages && (
                            <div>
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>העלאה לגיטהאב</span>
                                    <span>{progress.uploadedImages || 0} / {progress.totalImages}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-green-600 h-2 rounded-full transition-all"
                                        style={{ width: `${((progress.uploadedImages || 0) / progress.totalImages) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-800">
                        {error}
                    </div>
                )}

                {/* כפתורים */}
                <div className="flex gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={!serverOnline || files.length === 0 || isConverting || (mode === 'single' && !bookName.trim())}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {isConverting ? 'מעבד...' : `התחל המרה (${files.length} קבצים)`}
                    </button>
                    <button
                        onClick={handleClose}
                        disabled={isConverting}
                        className="px-4 py-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        ביטול
                    </button>
                </div>
            </div>
        </div>
    )
}
