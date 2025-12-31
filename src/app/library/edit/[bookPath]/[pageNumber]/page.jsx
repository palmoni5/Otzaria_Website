'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { getAvatarColor, getInitial } from '@/lib/avatar-colors'

export default function EditPage() {
    const { bookPath, pageNumber } = useParams() 
    const router = useRouter()
    const { data: session, status } = useSession()
    
    // מצבי נתונים
    const [loading, setLoading] = useState(true)
    const [pageData, setPageData] = useState(null)
    const [bookName, setBookName] = useState('')
    
    // מצבי עריכה
    const [content, setContent] = useState('')
    const [isTwoColumns, setIsTwoColumns] = useState(false)
    const [rightCol, setRightCol] = useState('')
    const [leftCol, setLeftCol] = useState('')
    const [rightColumnName, setRightColumnName] = useState('חלק 1')
    const [leftColumnName, setLeftColumnName] = useState('חלק 2')
    
    // מצבי ממשק מתקדמים (מהפרויקט הישן)
    const [imageZoom, setImageZoom] = useState(100)
    const [isSelectionMode, setIsSelectionMode] = useState(false)
    const [selectionStart, setSelectionStart] = useState(null)
    const [selectionEnd, setSelectionEnd] = useState(null)
    const [selectionRect, setSelectionRect] = useState(null)
    const [isOcrProcessing, setIsOcrProcessing] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [ocrMethod, setOcrMethod] = useState('gemini') // 'tesseract' | 'gemini'
    const [selectedFont, setSelectedFont] = useState('FrankRuehl')
    const [activeTextarea, setActiveTextarea] = useState(null)
    const [layoutOrientation, setLayoutOrientation] = useState('horizontal') // 'vertical' | 'horizontal'
    const [imagePanelWidth, setImagePanelWidth] = useState(50)
    const [isResizing, setIsResizing] = useState(false)

    // הגנה על הדף
    useEffect(() => {
        if (status === 'unauthenticated') router.push('/library/auth/login');
    }, [status, router]);

    // טעינת נתונים
    useEffect(() => {
        if (status !== 'authenticated') return;

        const loadData = async () => {
            try {
                // 1. קבלת פרטי העמוד והספר
                const bookRes = await fetch(`/api/book/${bookPath}`);
                const bookJson = await bookRes.json();
                
                if (!bookJson.success) throw new Error(bookJson.error);
                
                setBookName(bookJson.book.name);
                const page = bookJson.pages.find(p => p.number === parseInt(pageNumber));
                
                if (!page) throw new Error('העמוד לא נמצא');
                
                setPageData(page);

                // 2. קבלת התוכן הקיים מה-DB
                const contentRes = await fetch(`/api/page-content?bookPath=${bookPath}&pageNumber=${pageNumber}`);
                const contentJson = await contentRes.json();
                
                if (contentJson.success && contentJson.data) {
                    setContent(contentJson.data.content || '');
                    setIsTwoColumns(contentJson.data.twoColumns || false);
                    setRightCol(contentJson.data.rightColumn || '');
                    setLeftCol(contentJson.data.leftColumn || '');
                    if (contentJson.data.rightColumnName) setRightColumnName(contentJson.data.rightColumnName);
                    if (contentJson.data.leftColumnName) setLeftColumnName(contentJson.data.leftColumnName);
                }
            } catch (err) {
                console.error(err);
                alert('שגיאה בטעינת הנתונים: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [bookPath, pageNumber, status]);

    // מנגנון שמירה אוטומטית (Debounce)
    const saveContent = useCallback(async (manualContent = null) => {
        if (!pageData) return;
        
        const dataToSave = {
            bookPath,
            pageNumber: parseInt(pageNumber),
            content: manualContent?.content ?? content,
            twoColumns: manualContent?.twoColumns ?? isTwoColumns,
            rightColumn: manualContent?.rightColumn ?? rightCol,
            leftColumn: manualContent?.leftColumn ?? leftCol,
            rightColumnName,
            leftColumnName
        };

        try {
            await fetch('/api/page-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            });
        } catch (error) {
            console.error('Save failed', error);
        }
    }, [bookPath, pageNumber, content, isTwoColumns, rightCol, leftCol, rightColumnName, leftColumnName, pageData]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (!loading && pageData) saveContent();
        }, 2000);
        return () => clearTimeout(timeoutId);
    }, [content, rightCol, leftCol, isTwoColumns, loading, pageData, saveContent]);

    // טיפול ב-OCR
    const handleOCR = async (blob = null) => {
        if (!pageData?.thumbnail) return;
        setIsOcrProcessing(true);

        try {
            let imageBase64;

            if (blob) {
                // המרה מ-Blob (בחירת אזור)
                imageBase64 = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result.split(',')[1]);
                    reader.readAsDataURL(blob);
                });
            } else {
                // תמונה מלאה מה-URL
                const imgRes = await fetch(pageData.thumbnail);
                const imgBlob = await imgRes.blob();
                imageBase64 = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result.split(',')[1]);
                    reader.readAsDataURL(imgBlob);
                });
            }

            const res = await fetch('/api/gemini-ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64 })
            });

            const data = await res.json();
            
            if (data.success && data.text) {
                // הוסף את הטקסט למקום המתאים
                if (isTwoColumns) {
                    const newText = (rightCol ? rightCol + '\n' : '') + data.text;
                    setRightCol(newText);
                } else {
                    const newText = (content ? content + '\n' : '') + data.text;
                    setContent(newText);
                }
            } else {
                alert('שגיאה בזיהוי טקסט');
            }
        } catch (err) {
            console.error(err);
            alert('שגיאה בתהליך ה-OCR');
        } finally {
            setIsOcrProcessing(false);
            setSelectionRect(null);
            setIsSelectionMode(false);
        }
    };

    // טיפול בבחירת אזור בתמונה (Crop)
    const imageRef = useRef(null);
    const containerRef = useRef(null);

    const handleMouseDown = (e) => {
        if (!isSelectionMode) return;
        const rect = imageRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / (imageZoom / 100);
        const y = (e.clientY - rect.top) / (imageZoom / 100);
        setSelectionStart({ x, y });
        setSelectionRect(null); // איפוס בחירה קודמת
    };

    const handleMouseMove = (e) => {
        if (!isSelectionMode || !selectionStart) return;
        const rect = imageRef.current.getBoundingClientRect();
        const currentX = (e.clientX - rect.left) / (imageZoom / 100);
        const currentY = (e.clientY - rect.top) / (imageZoom / 100);
        
        setSelectionRect({
            x: Math.min(selectionStart.x, currentX),
            y: Math.min(selectionStart.y, currentY),
            width: Math.abs(currentX - selectionStart.x),
            height: Math.abs(currentY - selectionStart.y)
        });
    };

    const handleMouseUp = () => {
        if (!isSelectionMode) return;
        setSelectionStart(null);
    };

    const performCropAndOCR = async () => {
        if (!selectionRect || !imageRef.current) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = selectionRect.width;
        canvas.height = selectionRect.height;
        const ctx = canvas.getContext('2d');
        
        // ציור התמונה המקורית (לא המוקטנת) על הקנבס
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = pageData.thumbnail;
        
        await new Promise(resolve => img.onload = resolve);
        
        // יחס המרה בין התמונה המוצגת למקורית (אם יש הבדל בגדלים הטבעיים)
        const scaleX = img.naturalWidth / imageRef.current.naturalWidth; // בדרך כלל 1 אם ה-src זהה
        
        ctx.drawImage(
            img, 
            selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height, 
            0, 0, selectionRect.width, selectionRect.height
        );
        
        canvas.toBlob(blob => handleOCR(blob), 'image/jpeg');
    };

    // סיום עריכה
    const handleComplete = async () => {
        if (!confirm('האם סיימת לערוך את העמוד?')) return;
        await saveContent(); 
        
        try {
            const res = await fetch('/api/book/complete-page', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pageId: pageData.id,
                    bookId: pageData.book
                })
            });
            const data = await res.json();
            if (data.success) router.push(`/library/book/${bookPath}`);
            else alert(data.error);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center">טוען...</div>;

    return (
        <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
            {/* סרגל כלים עליון */}
            <div className="bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between shadow-sm shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <Link href={`/library/book/${bookPath}`} className="text-gray-500 hover:text-primary">
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </Link>
                    <span className="font-bold text-gray-700">{bookName}</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-sm text-gray-600">עמוד {pageNumber}</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* כלי זום */}
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                        <button onClick={() => setImageZoom(z => Math.max(20, z - 10))} className="p-1 hover:bg-white rounded"><span className="material-symbols-outlined text-sm">remove</span></button>
                        <span className="px-2 text-xs flex items-center">{imageZoom}%</span>
                        <button onClick={() => setImageZoom(z => Math.min(300, z + 10))} className="p-1 hover:bg-white rounded"><span className="material-symbols-outlined text-sm">add</span></button>
                    </div>
                    
                    {/* כפתורי OCR */}
                    <button 
                        onClick={() => setIsSelectionMode(!isSelectionMode)}
                        className={`p-2 rounded-lg transition-colors ${isSelectionMode ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
                        title="בחר אזור לזיהוי טקסט"
                    >
                        <span className="material-symbols-outlined">crop</span>
                    </button>
                    
                    {selectionRect && isSelectionMode && (
                        <button 
                            onClick={performCropAndOCR}
                            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700"
                        >
                            <span className="material-symbols-outlined text-sm">document_scanner</span>
                            זהה אזור
                        </button>
                    )}

                    <button 
                        onClick={() => handleOCR(null)}
                        disabled={isOcrProcessing}
                        className="flex items-center gap-1 bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50"
                    >
                        {isOcrProcessing ? (
                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined text-sm">auto_awesome</span>
                        )}
                        זיהוי מלא
                    </button>

                    <div className="h-6 w-px bg-gray-300 mx-1"></div>

                    {/* פיצול טורים */}
                    <button 
                        onClick={() => setIsTwoColumns(!isTwoColumns)}
                        className={`p-2 rounded-lg transition-colors ${isTwoColumns ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 text-gray-600'}`}
                        title={isTwoColumns ? 'אחד לטור אחד' : 'פצל לשני טורים'}
                    >
                        <span className="material-symbols-outlined">view_column</span>
                    </button>

                    <button 
                        onClick={handleComplete}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg font-medium flex items-center gap-2 text-sm"
                    >
                        <span className="material-symbols-outlined text-sm">check</span>
                        סיים
                    </button>
                </div>
            </div>

            {/* איזור עבודה ראשי */}
            <div className={`flex-1 flex overflow-hidden ${layoutOrientation === 'vertical' ? 'flex-row' : 'flex-col'}`}>
                
                {/* פאנל תמונה */}
                <div 
                    ref={containerRef}
                    className="bg-slate-800 overflow-auto relative select-none"
                    style={{ 
                        width: layoutOrientation === 'vertical' ? `${imagePanelWidth}%` : '100%',
                        height: layoutOrientation === 'vertical' ? '100%' : `${imagePanelWidth}%`,
                        cursor: isSelectionMode ? 'crosshair' : 'default'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                >
                    <div 
                        style={{ 
                            transform: `scale(${imageZoom / 100})`, 
                            transformOrigin: 'top center',
                            transition: 'transform 0.1s ease-out'
                        }}
                        className="min-h-full flex items-start justify-center p-8"
                    >
                        <div className="relative shadow-2xl">
                            <img 
                                ref={imageRef}
                                src={pageData?.thumbnail} 
                                alt="Source"
                                className="max-w-none block"
                                draggable={false}
                            />
                            {/* ריבוע בחירה */}
                            {selectionRect && (
                                <div 
                                    className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
                                    style={{
                                        left: selectionRect.x,
                                        top: selectionRect.y,
                                        width: selectionRect.width,
                                        height: selectionRect.height
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* ידית גרירה */}
                <div 
                    className={`bg-gray-200 hover:bg-primary/50 transition-colors z-10 flex items-center justify-center ${
                        layoutOrientation === 'vertical' ? 'w-2 cursor-col-resize hover:w-3' : 'h-2 cursor-row-resize hover:h-3'
                    }`}
                    onMouseDown={() => setIsResizing(true)}
                >
                    <div className={`bg-gray-400 rounded-full ${layoutOrientation === 'vertical' ? 'w-1 h-8' : 'h-1 w-8'}`} />
                </div>

                {/* פאנל עריכה */}
                <div className="flex-1 bg-white flex flex-col min-w-0">
                    {/* סרגל עיצוב */}
                    <div className="bg-gray-50 border-b p-2 flex gap-2 overflow-x-auto">
                        <select 
                            value={selectedFont} 
                            onChange={(e) => setSelectedFont(e.target.value)}
                            className="text-sm border rounded px-2 bg-white"
                        >
                            <option value="FrankRuehl">פרנק ריהל</option>
                            <option value="Arial">אריאל</option>
                            <option value="Times New Roman">Times New Roman</option>
                        </select>
                        <div className="w-px bg-gray-300 mx-1"></div>
                        <button className="p-1 hover:bg-gray-200 rounded font-bold" title="מודגש">B</button>
                        <button className="p-1 hover:bg-gray-200 rounded italic" title="נטוי">I</button>
                        <button className="p-1 hover:bg-gray-200 rounded text-sm" title="קטן">A-</button>
                        <button className="p-1 hover:bg-gray-200 rounded text-lg" title="גדול">A+</button>
                    </div>

                    <div className="flex-1 relative overflow-hidden">
                        {isTwoColumns ? (
                            <div className="absolute inset-0 flex divide-x divide-x-reverse">
                                <div className="w-1/2 flex flex-col">
                                    <input 
                                        value={rightColumnName}
                                        onChange={(e) => setRightColumnName(e.target.value)}
                                        className="text-center text-sm font-bold bg-gray-50 border-b p-1 outline-none"
                                    />
                                    <textarea
                                        value={rightCol}
                                        onChange={(e) => setRightCol(e.target.value)}
                                        className="flex-1 p-6 resize-none outline-none text-lg leading-relaxed w-full"
                                        style={{ fontFamily: selectedFont }}
                                        dir="rtl"
                                        placeholder="הקלד כאן..."
                                    />
                                </div>
                                <div className="w-1/2 flex flex-col bg-slate-50/30">
                                    <input 
                                        value={leftColumnName}
                                        onChange={(e) => setLeftColumnName(e.target.value)}
                                        className="text-center text-sm font-bold bg-gray-50 border-b p-1 outline-none"
                                    />
                                    <textarea
                                        value={leftCol}
                                        onChange={(e) => setLeftCol(e.target.value)}
                                        className="flex-1 p-6 resize-none outline-none text-lg leading-relaxed w-full bg-transparent"
                                        style={{ fontFamily: selectedFont }}
                                        dir="rtl"
                                        placeholder="הקלד כאן..."
                                    />
                                </div>
                            </div>
                        ) : (
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="absolute inset-0 p-8 resize-none outline-none text-xl leading-relaxed w-full"
                                style={{ fontFamily: selectedFont }}
                                dir="rtl"
                                placeholder="הקלד כאן את הטקסט..."
                            />
                        )}
                    </div>
                    
                    {/* סטטוס תחתון */}
                    <div className="bg-gray-50 border-t px-4 py-1 text-xs text-gray-500 flex justify-between">
                         <span>{content.length + rightCol.length + leftCol.length} תווים</span>
                         <span className="flex items-center gap-1">
                             <span className="w-2 h-2 rounded-full bg-green-500"></span>
                             נשמר
                         </span>
                    </div>
                </div>
            </div>

            {/* Resize Overlay */}
            {isResizing && (
                <div 
                    className="fixed inset-0 cursor-col-resize z-50"
                    onMouseMove={(e) => {
                        const newWidth = (e.clientX / window.innerWidth) * 100;
                        if (newWidth > 15 && newWidth < 85) setImagePanelWidth(newWidth);
                    }}
                    onMouseUp={() => setIsResizing(false)}
                />
            )}
        </div>
    )
}