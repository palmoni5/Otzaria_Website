import { useRef, useCallback, useState } from 'react'

export function useAutoSave() {
  const timeoutRef = useRef(null)
  // סטטוסים אפשריים: 'saved', 'unsaved', 'saving', 'error'
  const [status, setStatus] = useState('saved')

  const saveContent = useCallback(async ({
    bookPath,
    pageNumber,
    content,
    leftColumn,
    rightColumn,
    twoColumns,
    isContentSplit,
    rightColumnName,
    leftColumnName
  }) => {
    setStatus('saving')
    try {
      const response = await fetch('/api/page-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookPath,
          pageNumber,
          content,
          leftColumn,
          rightColumn,
          twoColumns,
          isContentSplit,
          rightColumnName,
          leftColumnName
        })
      })
      
      if (!response.ok) throw new Error('Network response was not ok')
      
      setStatus('saved')
      console.log('✅ Auto-saved')
    } catch (error) {
      console.error('Auto-save error:', error)
      setStatus('error')
    }
  }, [])

  const debouncedSave = useCallback((data) => {
    // עדכון מיידי שהתוכן לא שמור
    setStatus('unsaved')

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      saveContent(data)
    }, 2000) // שמירה אחרי 2 שניות ללא הקלדה
  }, [saveContent])

  // מחזירים אובייקט במקום רק פונקציה
  return { save: debouncedSave, status }
}