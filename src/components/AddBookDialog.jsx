'use client'

import { useState } from 'react'
import { uploadBookAction } from '@/app/library/admin/upload-action'
import { validateRequired, validateFile } from '@/lib/validation-utils'
import Modal from './Modal'

export default function AddBookDialog({ isOpen, onClose, onBookAdded }) {
    const [bookName, setBookName] = useState('')
    const [file, setFile] = useState(null)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState(null)

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            if (!bookName) {
                setBookName(e.target.files[0].name.replace('.pdf', ''))
            }
        }
    }

    const handleSubmit = async () => {
        // Validation
        const bookNameCheck = validateRequired(bookName, 'שם הספר')
        if (!bookNameCheck.isValid) {
            setError(bookNameCheck.error)
            return
        }

        const fileCheck = validateFile(file)
        if (!fileCheck.isValid) {
            setError(fileCheck.error)
            return
        }

        setIsUploading(true)
        setError(null)

        const formData = new FormData()
        formData.append('pdf', file)
        formData.append('bookName', bookName)

        try {
            const result = await uploadBookAction(formData)

            if (!result.success) {
                throw new Error(result.error || 'שגיאה בהעלאה')
            }

            if (onBookAdded) onBookAdded()
            onClose()
            setFile(null)
            setBookName('')

        } catch (err) {
            console.error(err)
            setError('שגיאה בתהליך: ' + err.message)
        } finally {
            setIsUploading(false)
        }
    }

    const handleClose = () => {
        if (!isUploading) {
            setError(null)
            setFile(null)
            setBookName('')
            onClose()
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="הוספת ספר חדש"
            size="md"
            closeable={!isUploading}
            buttons={[
                {
                    label: isUploading ? 'מעבד...' : 'העלה והמר',
                    onClick: handleSubmit,
                    disabled: isUploading,
                    variant: 'primary'
                },
                {
                    label: 'ביטול',
                    onClick: handleClose,
                    disabled: isUploading,
                    variant: 'secondary'
                }
            ]}
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">שם הספר</label>
                    <input
                        type="text"
                        value={bookName}
                        onChange={(e) => setBookName(e.target.value)}
                        disabled={isUploading}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                        placeholder="הכנס שם ספר..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">קובץ PDF</label>
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                        className="w-full block text-sm text-slate-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100
                          disabled:opacity-50"
                    />
                </div>

                {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200 flex items-start gap-2">
                        <span className="material-symbols-outlined text-lg flex-shrink-0 mt-0.5">error</span>
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </Modal>
    )
}