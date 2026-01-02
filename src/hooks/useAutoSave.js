import { useRef, useCallback } from 'react'

export function useAutoSave() {
  const timeoutRef = useRef(null)

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
    try {
      await fetch('/api/page-content', {
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
      console.log('✅ Auto-saved')
    } catch (error) {
      console.error('Auto-save error:', error)
    }
  }, [])

  const debouncedSave = useCallback((data) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      saveContent(data)
    }, 2000) // שמירה אחרי 2 שניות
  }, [saveContent])

  return debouncedSave
}