'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'

import EditorHeader from '@/components/editor/EditorHeader'
import EditorToolbar from '@/components/editor/EditorToolbar'
import ImagePanel from '@/components/editor/ImagePanel'
import TextEditor from '@/components/editor/TextEditor'
import SettingsSidebar from '@/components/editor/SettingsSidebar'
import FindReplaceDialog from '@/components/editor/modals/FindReplaceDialog'
import SplitDialog from '@/components/editor/modals/SplitDialog'
import InfoDialog from '@/components/editor/modals/InfoDialog'
import { useDialog } from '@/components/DialogContext'
import { useLoading } from '@/components/LoadingContext'

import { useAutoSave } from '@/hooks/useAutoSave'
import { useOCR } from '@/hooks/useOCR'

export default function EditPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const bookPath = decodeURIComponent(params.bookPath)
  const pageNumber = parseInt(params.pageNumber)
  const { showAlert, showConfirm } = useDialog()
  const { startLoading, stopLoading } = useLoading()

  const [bookData, setBookData] = useState(null)
  const [pageData, setPageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [globalInstructions, setGlobalInstructions] = useState(null);

  const [content, setContent] = useState('')
  const [leftColumn, setLeftColumn] = useState('')
  const [rightColumn, setRightColumn] = useState('')
  const [twoColumns, setTwoColumns] = useState(false)
  const [activeTextarea, setActiveTextarea] = useState(null)
  const [selectedFont, setSelectedFont] = useState('Times New Roman')
  const allInstructions = useMemo(() => {
      const globalRawSections = globalInstructions?.sections || [];
      const globalData = {
          title: 'הנחיות גלובליות',
          sections: globalRawSections
      };

      const bookInfo = bookData?.editingInfo || {};
      const bookSections = bookInfo.sections || [];
      
      // שינינו את השם כאן ל-bookInstData כדי למנוע התנגשות עם ה-state של bookData
      const bookInstData = {
          title: bookInfo.title || 'הנחיות עריכה לספר זה',
          sections: bookSections
      };

      return {
          bookInstructions: bookInstData,
          globalInstructions: globalData
      };
  }, [bookData, globalInstructions]); // מתעדכן אוטומטית כשהמידע משתנה
   
  const [imageZoom, setImageZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [layoutOrientation, setLayoutOrientation] = useState('vertical')
  const [imagePanelWidth, setImagePanelWidth] = useState(50)
  const [isResizing, setIsResizing] = useState(false)
  const [columnWidth, setColumnWidth] = useState(50)
  const [isColumnResizing, setIsColumnResizing] = useState(false)
  
  const splitContainerRef = useRef(null)
  const textEditorContainerRef = useRef(null)
  
  const imagePanelWidthRef = useRef(imagePanelWidth)
  const columnWidthRef = useRef(columnWidth)

  useEffect(() => { imagePanelWidthRef.current = imagePanelWidth }, [imagePanelWidth])
  useEffect(() => { columnWidthRef.current = columnWidth }, [columnWidth])

  const [swapPanels, setSwapPanels] = useState(false)
  
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false)

  const [showSplitDialog, setShowSplitDialog] = useState(false)
  const [rightColumnName, setRightColumnName] = useState('חלק 1')
  const [leftColumnName, setLeftColumnName] = useState('חלק 2')
  const [splitMode, setSplitMode] = useState('content')
  const [isContentSplit, setIsContentSplit] = useState(false)

  const [showFindReplace, setShowFindReplace] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [useRegex, setUseRegex] = useState(false)
  const [savedSearches, setSavedSearches] = useState([])

  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectionStart, setSelectionStart] = useState(null)
  const [selectionEnd, setSelectionEnd] = useState(null)
  const [selectionRect, setSelectionRect] = useState(null)
  const [ocrMethod, setOcrMethod] = useState('ocrwin')
  const { isProcessing: isOcrProcessing, performGeminiOCR, performTesseractOCR, performOCRWin } = useOCR()

  const [showSettings, setShowSettings] = useState(false)
  const [showInfoDialog, setShowInfoDialog] = useState(false)
  const [userApiKey, setUserApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash')
  const [customPrompt, setCustomPrompt] = useState('The text is in Hebrew, written in Rashi script...') 
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  const { save: debouncedSave, status: saveStatus } = useAutoSave()

  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key')
    const savedPrompt = localStorage.getItem('gemini_prompt')
    const savedModel = localStorage.getItem('gemini_model')
    const savedPanelWidth = localStorage.getItem('imagePanelWidth')
    const savedColumnWidth = localStorage.getItem('columnWidth')
    const savedOrientation = localStorage.getItem('layoutOrientation')
    const savedSwap = localStorage.getItem('swapPanels')
    const savedFont = localStorage.getItem('selectedFont')
    
    if (savedFont) setSelectedFont(savedFont)
    if (savedApiKey) setUserApiKey(savedApiKey)
    if (savedPrompt) setCustomPrompt(savedPrompt)
    if (savedModel) setSelectedModel(savedModel)
    if (savedPanelWidth) setImagePanelWidth(parseFloat(savedPanelWidth))
    if (savedColumnWidth) setColumnWidth(parseFloat(savedColumnWidth))
    if (savedOrientation) setLayoutOrientation(savedOrientation)
    if (savedSwap) setSwapPanels(savedSwap === 'true')

    if (status === 'authenticated') {
        fetch('/api/user/saved-searches')
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.savedSearches)) {
                    setSavedSearches(data.savedSearches);
                }
            })
            .catch(err => console.error('Failed to load saved searches from server:', err));
            
        const isLocallyHidden = localStorage.getItem(`hide_instructions_${bookPath}`);
        
        fetch('/api/user/preferences')
            .then(res => res.json())
            .then(data => {
                const isServerHidden = data.success && data.hiddenBooks && data.hiddenBooks.includes(bookPath);
                
                if (isServerHidden) {
                    localStorage.setItem(`hide_instructions_${bookPath}`, 'true');
                    setShowInfoDialog(false);
                } else {
                    if (!isLocallyHidden) {
                        setShowInfoDialog(true);
                    }
                }
            })
            .catch(err => {
                console.error('Failed to sync preferences:', err);
                if (!isLocallyHidden) setShowInfoDialog(true);
            });
    }
  }, [status, bookPath])

  useEffect(() => {
    if (selectedFont) {
      localStorage.setItem('selectedFont', selectedFont)
    }
  }, [selectedFont])

  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsToolbarCollapsed(true) 
      } else {
        if (document.exitFullscreen) await document.exitFullscreen()
        setIsToolbarCollapsed(false)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullScreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/library/auth/login')
    else if (status === 'authenticated') loadPageData()
  }, [status, bookPath, pageNumber])

  useEffect(() => {
    if (bookData?.name) document.title = `עריכה: ${bookData.name} - עמוד ${pageNumber}`
  }, [bookData, pageNumber])

  const loadPageData = async () => {
    try {
      setLoading(true)
      setError(null)
      const bookRes = await fetch(`/api/book/${encodeURIComponent(bookPath)}`)
      const bookResult = await bookRes.json()

      if (bookResult.success) {
        setBookData(bookResult.book)
        if (bookResult.pages && bookResult.pages.length > 0) {
           const foundPage = bookResult.pages.find(p => p.number === pageNumber);
           if (foundPage) setPageData(foundPage);
        }
      } else {
        throw new Error(bookResult.error)
      }

      const contentRes = await fetch(`/api/page-content?bookPath=${encodeURIComponent(bookPath)}&pageNumber=${pageNumber}`)
      const contentResult = await contentRes.json()

      if (contentResult.success && contentResult.data) {
        const { data } = contentResult
        setPageData(prev => ({...prev, ...data}));
        setContent(data.content || '')
        setLeftColumn(data.leftColumn || '')
        setRightColumn(data.rightColumn || '')
        setRightColumnName(data.rightColumnName || 'חלק 1')
        setLeftColumnName(data.leftColumnName || 'חלק 2')
        setTwoColumns(data.twoColumns || false)
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'שגיאה בטעינה')
    } finally {
      setLoading(false)
    }
  }

  const saveSearchesToServer = async (updatedList) => {
      setSavedSearches(updatedList); 
      try {
          const res = await fetch('/api/user/saved-searches', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ savedSearches: updatedList })
          });
          if (!res.ok) throw new Error('Failed to save');
      } catch (err) {
          console.error('Failed to save searches to server', err);
          showAlert('שגיאה', 'שגיאה בשמירת הנתונים בשרת. הנתונים נשמרו מקומית בלבד עד לריענון.');
      }
  };

  const addSavedSearch = (label, newFindText, newReplaceText, isRegex = false) => {
    const newSearch = {
      id: Date.now().toString(),
      label: label || newFindText,
      findText: newFindText,
      replaceText: newReplaceText,
      isRegex: isRegex
    };
    saveSearchesToServer([...savedSearches, newSearch]);
  };

  const addRemoveDigitsToSaved = () => {
    const newSearch = {
      id: Date.now().toString(),
      label: 'ניקוי ספרות',
      findText: '', 
      replaceText: '',
      isRemoveDigits: true
    };
    saveSearchesToServer([...savedSearches, newSearch]);
  };

  const moveSearch = (index, direction) => {
    const newSearches = [...savedSearches];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newSearches.length) {
      [newSearches[index], newSearches[targetIndex]] = [newSearches[targetIndex], newSearches[index]];
      saveSearchesToServer(newSearches);
    }
  };

  const removeSavedSearch = (id) => {
    saveSearchesToServer(savedSearches.filter(s => s.id !== id));
  };

  const runAllSavedReplacements = () => {
    if (savedSearches.length === 0) return;
    
    const processPattern = (str) => str.replaceAll('^13', '\n');
    
    let tempRight = rightColumn;
    let tempLeft = leftColumn;
    let tempContent = content;

    savedSearches.forEach(search => {
      if (search.isRemoveDigits) {
         const digitRegex = /[0-9]/g;
         if (twoColumns) {
            tempRight = tempRight.replace(digitRegex, '');
            tempLeft = tempLeft.replace(digitRegex, '');
         } else {
            tempContent = tempContent.replace(digitRegex, '');
         }
         return; 
      }

      const f = processPattern(search.findText);
      const r = processPattern(search.replaceText);
      
      if (!f) return;

      let regex;
      try {
          if (search.isRegex) {
              regex = new RegExp(f, 'g');
          } else {
              const escaped = f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              regex = new RegExp(escaped, 'g');
          }
      } catch (e) {
          console.error('Invalid Regex in saved search', e);
          return;
      }

      if (twoColumns) {
        tempRight = tempRight.replace(regex, r);
        tempLeft = tempLeft.replace(regex, r);
      } else {
        tempContent = tempContent.replace(regex, r);
      }
    });
    
    let changesMade = false;

    if (twoColumns) {
      if (tempRight !== rightColumn) {
          updateTextWithHistory(tempRight, 'right');
          changesMade = true;
      }
      if (tempLeft !== leftColumn) {
          updateTextWithHistory(tempLeft, 'left');
          changesMade = true;
      }
    } else {
      if (tempContent !== content) {
          updateTextWithHistory(tempContent, null);
          changesMade = true;
      }
    }

    if (changesMade) {
      showAlert('הצלחה', 'כל הפעולות השמורות בוצעו בהצלחה');
    } else {
      showAlert('לידיעתך', 'לא נמצאו שינויים לביצוע');
    }
  };

  const togglePanelOrder = () => {
    const newState = !swapPanels
    setSwapPanels(newState)
    localStorage.setItem('swapPanels', newState.toString())
  }

  const handleRemoveDigits = () => {
    showConfirm(
        'ניקוי ספרות',
        'האם אתה בטוח שברצונך למחוק את כל הספרות (0-9) מהטקסט?',
        () => {
            const regex = /[0-9]/g; 
            if (twoColumns) {
              const newRight = rightColumn.replace(regex, '');
              const newLeft = leftColumn.replace(regex, '');
              setRightColumn(newRight);
              setLeftColumn(newLeft);
              handleAutoSaveWrapper(content, newLeft, newRight, true);
            } else {
              const newContent = content.replace(regex, '');
              setContent(newContent);
              handleAutoSaveWrapper(newContent, leftColumn, rightColumn, false);
            }
        }
    )
  };

  const handleAutoSaveWrapper = useCallback((newContent, left = leftColumn, right = rightColumn, two = twoColumns) => {
    debouncedSave({
      bookPath, pageNumber, content: newContent, leftColumn: left, rightColumn: right,
      twoColumns: two, isContentSplit, rightColumnName, leftColumnName
    })
  }, [debouncedSave, bookPath, pageNumber, leftColumn, rightColumn, twoColumns, isContentSplit, rightColumnName, leftColumnName]);

  const handleFinishClick = useCallback(() => {
    if (!session) return showAlert('שגיאה', 'אינך מחובר למערכת');
    handleAutoSaveWrapper(content, leftColumn, rightColumn, twoColumns);
    setShowUploadDialog(true);
  }, [session, content, leftColumn, rightColumn, twoColumns, handleAutoSaveWrapper, showAlert]);

  const completePageLogic = async () => {
    const safeBookId = bookData?.id || bookData?._id;
    const safePageId = pageData?.id || pageData?._id;
    if (!safePageId || !safeBookId) return showAlert('שגיאה', 'מזהים חסרים');

    startLoading('מעדכן סטטוס עמוד...');
    try {
      const response = await fetch(`/api/book/complete-page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: safePageId, bookId: safeBookId })
      });
      const result = await response.json();
      
      stopLoading(); 

      if (result.success) router.push(`/library/book/${encodeURIComponent(bookPath)}`);
      else showAlert('שגיאה', `שגיאה מהשרת: ${result.error}`);
    } catch (error) {
      stopLoading(); 
      console.error('Error completing page:', error);
      showAlert('שגיאה', 'שגיאה בסימון העמוד כהושלם');
    }
  };

  const handleUploadConfirm = async () => {
    let textContent = twoColumns ? `${rightColumnName}:\n${rightColumn}\n\n${leftColumnName}:\n${leftColumn}` : content;
    if (!textContent.trim()) return showAlert('שגיאה', 'העמוד ריק');

    startLoading('מעלה קובץ למערכת...');
    try {
      const cleanBookName = bookPath.replace(/[^a-zA-Z0-9א-ת]/g, '_'); 
      const fileName = `${cleanBookName}_page_${pageNumber}.txt`;
      const blob = new Blob([textContent], { type: 'text/plain' });
      const file = new File([blob], fileName, { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bookName', `${bookPath} - עמוד ${pageNumber}`);
      formData.append('userId', session.user._id || session.user.id);
      formData.append('userName', session.user.name);

      const response = await fetch('/api/upload-book', { method: 'POST', body: formData });
      const result = await response.json();

      stopLoading(); 

      if (result.success) {
        showAlert('הצלחה', 'הטקסט הועלה בהצלחה! מסמן כהושלם.');
        await completePageLogic(); 
      } else {
        showAlert('שגיאה', `שגיאה בהעלאה: ${result.error || 'שגיאה לא ידועה'}`);
      }
    } catch (error) {
      stopLoading();
      console.error('Error uploading text:', error);
      showAlert('שגיאה', 'שגיאה בתהליך ההעלאה');
    }
  };

  const handleColumnChange = useCallback((column, newText) => {
    if (column === 'left') {
      setLeftColumn(newText)
      handleAutoSaveWrapper(content, newText, rightColumn, twoColumns)
    } else {
      setRightColumn(newText)
      handleAutoSaveWrapper(content, leftColumn, newText, twoColumns)
    }
  }, [content, leftColumn, rightColumn, twoColumns, handleAutoSaveWrapper]);

  const handleResizeStart = (e) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const handleColumnResizeStart = (e) => {
    e.preventDefault()
    setIsColumnResizing(true)
  }

  const handleMouseMove = useCallback((e) => {
    if (isResizing) {
      const container = splitContainerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      let newSize 
      if (layoutOrientation === 'horizontal') {
        newSize = swapPanels 
          ? ((rect.bottom - e.clientY) / rect.height) * 100 
          : ((e.clientY - rect.top) / rect.height) * 100    
      } else {
        newSize = swapPanels 
            ? ((e.clientX - rect.left) / rect.width) * 100
            : ((rect.right - e.clientX) / rect.width) * 100
      }
      setImagePanelWidth(Math.min(Math.max(newSize, 20), 80))
    } else if (isColumnResizing) {
      const editorContainer = textEditorContainerRef.current
      if (!editorContainer) return
      const rect = editorContainer.getBoundingClientRect()
      const relativeX = rect.right - e.clientX
      const newWidth = (relativeX / rect.width) * 100
      setColumnWidth(Math.min(Math.max(newWidth, 10), 90))
    }
  }, [isResizing, isColumnResizing, layoutOrientation, swapPanels])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    setIsColumnResizing(false)
    localStorage.setItem('imagePanelWidth', imagePanelWidthRef.current.toString())
    localStorage.setItem('columnWidth', columnWidthRef.current.toString())
  }, [])

  useEffect(() => {
    if (isResizing || isColumnResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, isColumnResizing, handleMouseMove, handleMouseUp])

  const toggleColumns = () => {
    if (!twoColumns) setShowSplitDialog(true)
    else {
      const combined = rightColumn + leftColumn
      setContent(combined)
      setTwoColumns(false)
      handleAutoSaveWrapper(combined, leftColumn, rightColumn, false)
    }
  }

  const handleDownloadImage = async () => {
    if (!pageData?.thumbnail) return showAlert('שגיאה', 'אין תמונה להורדה');
    try {
      const response = await fetch(pageData.thumbnail);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanBookName = bookData?.name?.replace(/[^a-zA-Z0-9א-ת]/g, '_') || 'book';
      link.download = `${cleanBookName}_page_${pageNumber}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      window.open(pageData.thumbnail, '_blank');
    }
  };

  const confirmSplit = () => {
    setRightColumn(content)
    setLeftColumn('')
    setTwoColumns(true)
    setIsContentSplit(splitMode === 'content')
    setShowSplitDialog(false)
    handleAutoSaveWrapper(content, '', content, true)
  }
  
  // השתמשנו בdocument.execCommand כדי לשמור את ההסטורריה לצורך ביטולים
  const updateTextWithHistory = (newText, column) => {
    let el;
    if (column === 'right') el = document.querySelector('textarea[data-column="right"]');
    else if (column === 'left') el = document.querySelector('textarea[data-column="left"]');
    else el = document.querySelector('.editor-container textarea');

    if (el) {
        const scrollTop = el.scrollTop;
        
        el.focus();
        el.select();
        const success = document.execCommand('insertText', false, newText);
        
        el.setSelectionRange(el.value.length, el.value.length);
        el.scrollTop = scrollTop;

        if (!success) {
            if (column === 'right') handleColumnChange('right', newText);
            else if (column === 'left') handleColumnChange('left', newText);
            else { setContent(newText); handleAutoSaveWrapper(newText); }
        }
    } else {
        if (column === 'right') handleColumnChange('right', newText);
        else if (column === 'left') handleColumnChange('left', newText);
        else { setContent(newText); handleAutoSaveWrapper(newText); }
    }
  }

  const handleFindReplace = (replaceAll = false, overrideFind = null, overrideReplace = null, useRegexOverride = null) => {
    const textToFind = overrideFind !== null ? overrideFind : findText;
    const textToReplace = overrideReplace !== null ? overrideReplace : replaceText;
    const isRegexMode = useRegexOverride !== null ? useRegexOverride : useRegex;

    if (!textToFind) return showAlert('שגיאה', 'הזן טקסט לחיפוש');
    
    const processPattern = (str) => str.replaceAll('^13', '\n');
    
    const patternStr = processPattern(textToFind);
    const replacement = processPattern(textToReplace || ''); 

    const createRegex = (global) => {
        try {
            if (isRegexMode) {
                return new RegExp(patternStr, global ? 'g' : '');
            } else {
                const escaped = patternStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return new RegExp(escaped, global ? 'g' : '');
            }
        } catch (e) {
            return null;
        }
    };

    const regex = createRegex(replaceAll);
    if (!regex) return showAlert('שגיאה', 'ביטוי רגולרי לא תקין');

    const checkRegex = createRegex(true);
    if (!checkRegex) return showAlert('שגיאה', 'ביטוי רגולרי לא תקין');

    let totalOccurrences = 0;

    const executeReplace = (text) => {
      if (!text) return text;
      
      const matches = text.match(checkRegex);
      const count = matches ? matches.length : 0;
      
      if (count === 0) return text;

      if (replaceAll) {
        totalOccurrences += count;
        return text.replace(regex, replacement);
      } else {
        if (regex.test(text)) {
            totalOccurrences += 1;
            return text.replace(regex, replacement);
        }
        return text;
      }
    };

    if (twoColumns) {
      const newRight = executeReplace(rightColumn);
      let newLeft = leftColumn;
      
      if (!replaceAll && newRight === rightColumn) {
          newLeft = executeReplace(leftColumn);
      } else if (replaceAll) {
          newLeft = executeReplace(leftColumn);
      }

      if (newRight !== rightColumn) {
          updateTextWithHistory(newRight, 'right');
      }
      if (newLeft !== leftColumn) {
          updateTextWithHistory(newLeft, 'left');
      }

    } else {
      const newContent = executeReplace(content);
      if (newContent !== content) {
        updateTextWithHistory(newContent, null);
      }
    }

    if (totalOccurrences > 0) showAlert('הצלחה', `ההחלפה בוצעה בהצלחה! הוחלפו ${totalOccurrences} מופעים.`);
    else showAlert('לידיעתך', 'לא נמצאו תוצאות התואמות לחיפוש.');
  };

  const insertTag = useCallback((tag) => {
    let activeEl = document.activeElement;
    if (!activeEl || activeEl.tagName !== 'TEXTAREA') {
        if (activeTextarea === 'left') activeEl = document.querySelector('textarea[data-column="left"]');
        else if (activeTextarea === 'right') activeEl = document.querySelector('textarea[data-column="right"]');
        else activeEl = document.querySelector('.editor-container textarea');
    }
    if (!activeEl || activeEl.tagName !== 'TEXTAREA') return;
    
    const start = activeEl.selectionStart;
    const end = activeEl.selectionEnd;
    const selected = activeEl.value.substring(start, end);
    
    let insertion = `<${tag}>${selected}</${tag}>`
    if (['h1', 'h2', 'h3'].includes(tag)) insertion = `\n<${tag}>${selected}</${tag}>\n`
    
    activeEl.focus();
    const success = document.execCommand('insertText', false, insertion);
    
    if (!success) {
      const text = activeEl.value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + insertion + after;
      
      const col = activeEl.getAttribute('data-column');
      if (col === 'right') handleColumnChange('right', newText);
      else if (col === 'left') handleColumnChange('left', newText);
      else {
          setContent(newText);
          handleAutoSaveWrapper(newText);
      }
      
      setTimeout(() => {
        const newCursorPos = start + insertion.length;
        activeEl.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  }, [activeTextarea, handleColumnChange, handleAutoSaveWrapper]);

  const handlersRef = useRef({ insertTag, handleFinishClick });

  useEffect(() => {
    const fetchGlobalInstructions = async () => {
      try {
        const res = await fetch('/api/global-instructions'); 
        const data = await res.json();
        
        if (data.success && data.instructions) {
          setGlobalInstructions(data.instructions);
        }
      } catch (err) {
        console.error('Failed to fetch global instructions:', err);
      }
    };

    fetchGlobalInstructions();
  }, []);

  useEffect(() => {
    handlersRef.current = { insertTag, handleFinishClick };
  }, [insertTag, handleFinishClick]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isModKey = e.ctrlKey || e.metaKey;
      if (!isModKey) return;

      const { insertTag: currentInsertTag, handleFinishClick: currentHandleFinish } = handlersRef.current;

      switch (e.code) {
        case 'KeyB':
          e.preventDefault();
          currentInsertTag('b');
          break;
        case 'KeyI':
          e.preventDefault();
          currentInsertTag('i');
          break;
        case 'KeyU':
          e.preventDefault();
          currentInsertTag('u');
          break;
        case 'Equal':
        case 'NumpadAdd':
          e.preventDefault();
          currentInsertTag('big');
          break;
        case 'Minus':
        case 'NumpadSubtract':
          e.preventDefault();
          currentInsertTag('small');
          break;
        case 'KeyS':
          e.preventDefault();
          currentHandleFinish();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOCR = async () => {
    if (!selectionRect) return showAlert('שגיאה', 'בחר אזור')
    
    let isCancelled = false;

    startLoading('מזהה טקסט...', () => {
        isCancelled = true;
    }) 

    try {
        const response = await fetch(pageData.thumbnail)
        if (isCancelled) return;

        const blob = await response.blob()
        const img = await createImageBitmap(blob)
        
        const canvas = document.createElement('canvas')
        canvas.width = selectionRect.width
        canvas.height = selectionRect.height
        const ctx = canvas.getContext('2d')
        
        ctx.translate(canvas.width / 2, canvas.height / 2)
        
        ctx.rotate((rotation * Math.PI) / 180)
        
        const selCenterX = selectionRect.x + selectionRect.width / 2
        const selCenterY = selectionRect.y + selectionRect.height / 2
        
        const imgCenterX = img.width / 2
        const imgCenterY = img.height / 2
        
        ctx.drawImage(img, -selCenterX, -selCenterY)

        const croppedBlob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.95))
        
        if (isCancelled) return;

        let text = ''
        if (ocrMethod === 'gemini') text = await performGeminiOCR(croppedBlob, userApiKey, selectedModel, customPrompt)
        else if (ocrMethod === 'ocrwin') text = await performOCRWin(croppedBlob)
        else text = await performTesseractOCR(croppedBlob)
        
        if (isCancelled) return;

        if (!text) {
             stopLoading() 
             return showAlert('שגיאה', 'לא זוהה טקסט')
        }
        
        if (twoColumns) {
            const newRight = rightColumn + '\n' + text
            setRightColumn(newRight)
            handleAutoSaveWrapper(content, leftColumn, newRight, true)
        } else {
            const newContent = content + '\n' + text
            setContent(newContent)
            handleAutoSaveWrapper(newContent)
        }
        setSelectionRect(null)
        setIsSelectionMode(false)
        stopLoading() 
    } catch (e) {
        if (!isCancelled) {
            console.error(e)
            stopLoading() 
            showAlert('שגיאה', 'שגיאה ב-OCR: ' + e.message)
        }
    }
  }

  const handleCloseInfoDialog = async (doNotShowAgain) => {
    setShowInfoDialog(false);
    
    if (doNotShowAgain && bookPath) {
      localStorage.setItem(`hide_instructions_${bookPath}`, 'true');

      try {
        await fetch('/api/user/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'hide_instructions',
            bookPath: bookPath 
          })
        });
      } catch (err) {
        console.error('Failed to save preference to server', err);
      }
    }
  };

  if (loading) return <div className="text-center p-20">טוען...</div>
  if (error) return <div className="text-center p-20 text-red-500">{error}</div>

  return (
    <div 
      className={`bg-background flex flex-col overflow-hidden transition-all duration-300 ${
        isFullScreen ? 'fixed inset-0 z-[100] h-screen w-screen' : 'h-[calc(100vh-0px)]' 
      }`}
      style={{ cursor: isResizing || isColumnResizing ? 'col-resize' : 'default' }}
    >
      {!isFullScreen && (
        <EditorHeader 
          bookName={bookData?.name} 
          pageNumber={pageNumber} 
          bookPath={bookPath} 
          session={session} 
          saveStatus={saveStatus}
          onToggleFullScreen={toggleFullScreen}
        />
      )}
      <EditorToolbar 
        pageNumber={pageNumber} totalPages={bookData?.totalPages}
        imageZoom={imageZoom} setImageZoom={setImageZoom}
        ocrMethod={ocrMethod} setOcrMethod={setOcrMethod}
        isSelectionMode={isSelectionMode} toggleSelectionMode={() => setIsSelectionMode(!isSelectionMode)}
        isOcrProcessing={isOcrProcessing} selectionRect={selectionRect}
        handleOCRSelection={handleOCR} setSelectionRect={setSelectionRect}
        setIsSelectionMode={setIsSelectionMode} insertTag={insertTag}
        setShowFindReplace={setShowFindReplace}
        selectedFont={selectedFont} setSelectedFont={setSelectedFont}
        twoColumns={twoColumns} toggleColumns={toggleColumns}
        layoutOrientation={layoutOrientation} setLayoutOrientation={setLayoutOrientation}
        swapPanels={swapPanels}
        handleDownloadImage={handleDownloadImage}
        togglePanelOrder={togglePanelOrder}
        handleRemoveDigits={handleRemoveDigits}
        handleFinish={handleFinishClick} 
        setShowInfoDialog={setShowInfoDialog} setShowSettings={setShowSettings}
        thumbnailUrl={pageData?.thumbnail}
        isCollapsed={isToolbarCollapsed}
        setIsCollapsed={setIsToolbarCollapsed}
        isFullScreen={isFullScreen}
        onToggleFullScreen={toggleFullScreen}
      />

      <div className={`flex-1 flex flex-col overflow-hidden ${isFullScreen ? 'p-0' : 'p-6'}`}>
        <div className={`flex-1 flex flex-col overflow-hidden ${isFullScreen ? '' : 'glass-strong rounded-xl border border-surface-variant'}`}>
          <div 
            ref={splitContainerRef}
            className="flex-1 flex overflow-hidden split-container" 
            style={{ 
                flexDirection: layoutOrientation === 'horizontal' 
                  ? (swapPanels ? 'column-reverse' : 'column') 
                  : (swapPanels ? 'row-reverse' : 'row') 
            }}
          >
            <ImagePanel 
              thumbnailUrl={pageData?.thumbnail} pageNumber={pageNumber}
              imageZoom={imageZoom} 
              setImageZoom={setImageZoom} 
              isSelectionMode={isSelectionMode}
              selectionStart={selectionStart} selectionEnd={selectionEnd}
              selectionRect={selectionRect}
              setSelectionStart={setSelectionStart} setSelectionEnd={setSelectionEnd}
              setSelectionRect={setSelectionRect}
              layoutOrientation={layoutOrientation} imagePanelWidth={imagePanelWidth}
              isResizing={isResizing} handleResizeStart={handleResizeStart}
              rotation={rotation} setRotation={setRotation}
              handleOCRSelection={handleOCR}
              isOcrProcessing={isOcrProcessing}
            />
            <TextEditor 
              ref={textEditorContainerRef}
              content={content} leftColumn={leftColumn} rightColumn={rightColumn}
              twoColumns={twoColumns} rightColumnName={rightColumnName} leftColumnName={leftColumnName}
              handleAutoSave={(txt) => { setContent(txt); handleAutoSaveWrapper(txt); }}
              handleColumnChange={handleColumnChange}
              setActiveTextarea={setActiveTextarea} selectedFont={selectedFont}
              columnWidth={columnWidth} onColumnResizeStart={handleColumnResizeStart}
            />
          </div>
          
          <div className="px-4 py-3 border-t border-surface-variant bg-surface/50 text-sm flex justify-between items-center h-12 flex-shrink-0">
             <div className="flex gap-4">
                {twoColumns ? <span>ימין: {rightColumn.length}, שמאל: {leftColumn.length}</span> : <span>תווים: {content.length}</span>}
             </div>
             <div>
                {saveStatus === 'saved' && <span className="text-green-600 font-medium">נשמר אוטומטית</span>}
                {saveStatus === 'saving' && <span className="text-blue-600 font-medium">שומר...</span>}
                {saveStatus === 'error' && <span className="text-red-600 font-medium">שגיאה בשמירה</span>}
             </div>
          </div>
        </div>
      </div>

      <SettingsSidebar 
        show={showSettings} onClose={() => setShowSettings(false)}
        userApiKey={userApiKey} setUserApiKey={setUserApiKey}
        selectedModel={selectedModel} setSelectedModel={setSelectedModel}
        customPrompt={customPrompt} setCustomPrompt={setCustomPrompt}
        saveSettings={() => { localStorage.setItem('gemini_api_key', userApiKey); showAlert('הצלחה', 'נשמר'); }}
        resetPrompt={() => setCustomPrompt('The text is in Hebrew, written in Rashi script...')}
      />
      
      <FindReplaceDialog 
        isOpen={showFindReplace} onClose={() => setShowFindReplace(false)}
        findText={findText} setFindText={setFindText}
        replaceText={replaceText} setReplaceText={setReplaceText}
        handleFindReplace={handleFindReplace}
        savedSearches={savedSearches}
        addSavedSearch={addSavedSearch}
        removeSavedSearch={removeSavedSearch}
        moveSearch={moveSearch}
        runAllSavedReplacements={runAllSavedReplacements}
        handleRemoveDigits={handleRemoveDigits}
        onAddRemoveDigitsToSaved={addRemoveDigitsToSaved}
        useRegex={useRegex}
        setUseRegex={setUseRegex}
      />

      <SplitDialog 
        isOpen={showSplitDialog} onClose={() => setShowSplitDialog(false)}
        splitMode={splitMode} setSplitMode={setSplitMode}
        rightColumnName={rightColumnName} setRightColumnName={setRightColumnName}
        leftColumnName={leftColumnName} setLeftColumnName={setLeftColumnName}
        confirmSplit={confirmSplit}
      />

      <InfoDialog 
        isOpen={showInfoDialog} onClose={handleCloseInfoDialog}
        bookInstructions={allInstructions.bookInstructions}
        globalInstructions={allInstructions.globalInstructions}
      />

      {showUploadDialog && (
        <UploadDialog
          pageNumber={pageNumber}
          onConfirm={handleUploadConfirm}
          onCancel={() => setShowUploadDialog(false)}
        />
      )}
    </div>
  )
}

function UploadDialog({ pageNumber, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="glass-strong rounded-2xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-green-600">upload_file</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-2">סיום עבודה על עמוד {pageNumber}</h2>
          <p className="text-on-surface/70">האם ברצונך להעלות את הטקסט שערכת למערכת?</p>
        </div>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600 mt-0.5">info</span>
            <div className="text-sm text-blue-800">
              <p className="font-bold mb-1">מה יקרה?</p>
              <ul className="space-y-1">
                <li>• הטקסט שערכת יועלה כקובץ חדש</li>
                <li>• הקובץ יישלח לאישור מנהל</li>
                <li>• העמוד יסומן כהושלם</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold">
            <span className="material-symbols-outlined">upload</span>
            <span>כן, העלה את הטקסט</span>
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-3 border-2 border-surface-variant text-on-surface rounded-lg hover:bg-surface transition-colors"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  )

}
