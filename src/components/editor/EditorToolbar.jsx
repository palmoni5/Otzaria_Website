export default function EditorToolbar({
  pageNumber,
  totalPages,
  imageZoom,
  setImageZoom,
  ocrMethod,
  setOcrMethod,
  toggleSelectionMode,
  isSelectionMode,
  isOcrProcessing,
  selectionRect,
  handleOCRSelection,
  setSelectionRect,
  setIsSelectionMode,
  insertTag,
  setShowFindReplace,
  selectedFont,
  setSelectedFont,
  twoColumns,
  toggleColumns,
  layoutOrientation,
  setLayoutOrientation,
  setShowInfoDialog,
  setShowSettings,
  thumbnailUrl
}) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-30 shadow-sm">
      <div className="container mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Left Side - Image Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(prev => !prev)}
              className="p-1.5 h-8 rounded-lg transition-colors flex items-center hover:bg-gray-100 text-gray-700"
              title="הגדרות OCR"
            >
              <span className="material-symbols-outlined text-base">settings</span>
            </button>

            <div className="w-px h-6 bg-gray-200"></div>
            <span className="text-xs text-gray-500 font-medium">עמוד {pageNumber} מתוך {totalPages}</span>
            <div className="w-px h-6 bg-gray-200"></div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-0 bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setImageZoom(Math.max(25, imageZoom - 10))} className="w-8 h-8 hover:bg-white rounded-md flex items-center justify-center">
                <span className="material-symbols-outlined text-base">zoom_out</span>
              </button>
              <span className="text-xs font-medium min-w-[2.5rem] text-center text-gray-700">{imageZoom}%</span>
              <button onClick={() => setImageZoom(Math.min(300, imageZoom + 10))} className="w-8 h-8 hover:bg-white rounded-md flex items-center justify-center">
                <span className="material-symbols-outlined text-base">zoom_in</span>
              </button>
              <button onClick={() => setImageZoom(100)} className="w-12 h-8 hover:bg-white rounded-md text-xs font-medium flex items-center justify-center">
                100%
              </button>
            </div>

            <div className="w-px h-6 bg-gray-200"></div>

            {/* OCR Method Selector */}
            <div className="flex items-center gap-0 bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setOcrMethod('tesseract')} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 h-8 ${ocrMethod === 'tesseract' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                <span className="material-symbols-outlined text-base">text_fields</span>
                <span>OCR</span>
              </button>
              <button onClick={() => setOcrMethod('gemini')} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 h-8 ${ocrMethod === 'gemini' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" alt="Gemini" className="w-3.5 h-3.5" />
                <span>Gemini</span>
              </button>
            </div>

            <button
              onClick={toggleSelectionMode}
              disabled={isOcrProcessing || !thumbnailUrl}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center ${isSelectionMode ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'} disabled:opacity-40`}
              title="זיהוי טקסט מאזור נבחר"
            >
              <span className={`material-symbols-outlined text-base ${isOcrProcessing ? 'animate-spin' : ''}`}>
                {isOcrProcessing ? 'progress_activity' : 'document_scanner'}
              </span>
            </button>

            {selectionRect && (
              <>
                <button onClick={handleOCRSelection} disabled={isOcrProcessing} className="flex items-center gap-2 px-3 py-1.5 h-8 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span className="text-xs font-medium">זהה אזור</span>
                </button>
                <button onClick={() => { setSelectionRect(null); setIsSelectionMode(false); }} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </>
            )}

            <div className="w-px h-6 bg-gray-200"></div>
            <a href="https://aistudio.google.com/prompts/new_chat?model=gemini-3-pro-preview" target="_blank" rel="noopener noreferrer" className="p-1.5 h-8 hover:bg-gray-100 rounded-lg flex items-center">
              <img src="https://www.gstatic.com/lamda/images/bard_sparkle_v2_advanced.svg" alt="Gemini" className="w-5 h-5" />
            </a>
          </div>

          {/* Right Side - Text Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-0 bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => insertTag('b')} className="w-8 h-8 hover:bg-white rounded-md flex items-center justify-center" title="מודגש"><span className="font-bold text-sm">B</span></button>
              <button onClick={() => insertTag('i')} className="w-8 h-8 hover:bg-white rounded-md flex items-center justify-center" title="נטוי"><span className="italic text-sm">I</span></button>
              <button onClick={() => insertTag('u')} className="w-8 h-8 hover:bg-white rounded-md flex items-center justify-center" title="קו תחתון"><span className="underline text-sm">U</span></button>
            </div>

            <div className="w-px h-6 bg-gray-200"></div>

            <div className="flex items-center gap-0 bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => insertTag('big')} className="w-8 h-8 hover:bg-white rounded-md flex items-center justify-center text-sm font-medium">A+</button>
              <button onClick={() => insertTag('small')} className="w-8 h-8 hover:bg-white rounded-md flex items-center justify-center text-xs font-medium">A-</button>
            </div>

            <div className="w-px h-6 bg-gray-200"></div>

            <div className="flex items-center gap-0 bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => insertTag('h1')} className="px-2.5 h-8 hover:bg-white rounded-md text-xs font-bold flex items-center justify-center">H1</button>
              <button onClick={() => insertTag('h2')} className="px-2.5 h-8 hover:bg-white rounded-md text-xs font-bold flex items-center justify-center">H2</button>
              <button onClick={() => insertTag('h3')} className="px-2.5 h-8 hover:bg-white rounded-md text-xs font-bold flex items-center justify-center">H3</button>
            </div>

            <div className="w-px h-6 bg-gray-200"></div>

            <button onClick={() => setShowFindReplace(true)} className="flex items-center gap-2 px-3 py-1.5 h-8 bg-white hover:bg-gray-50 rounded-lg border border-gray-200">
              <span className="material-symbols-outlined text-base">find_replace</span>
              <span className="text-xs font-medium">חיפוש</span>
            </button>

            <div className="w-px h-6 bg-gray-200"></div>

            <div className="relative">
              <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} className="appearance-none pl-3 pr-8 h-8 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none hover:bg-gray-50 cursor-pointer">
                <option value="monospace">Monospace</option>
                <option value="Arial">Arial</option>
                <option value="'Times New Roman'">Times New Roman</option>
                <option value="'Courier New'">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </select>
              <span className="material-symbols-outlined text-base absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">expand_more</span>
            </div>

            <div className="w-px h-6 bg-gray-200"></div>

            <button onClick={toggleColumns} className="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center" title={twoColumns ? 'איחוד לטור אחד' : 'פיצול לשני טורים'}>
              <span className="material-symbols-outlined text-base" style={{ transform: 'rotate(90deg)' }}>{twoColumns ? 'unfold_less' : 'unfold_more'}</span>
            </button>

            <button onClick={() => {
              const newOrientation = layoutOrientation === 'vertical' ? 'horizontal' : 'vertical'
              setLayoutOrientation(newOrientation)
              localStorage.setItem('layoutOrientation', newOrientation)
            }} className="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center" title={layoutOrientation === 'vertical' ? 'פריסה אנכית' : 'פריסה אופקית'}>
              <span className="material-symbols-outlined text-base" style={{ transform: layoutOrientation === 'horizontal' ? 'rotate(90deg)' : 'none' }}>splitscreen</span>
            </button>

            <div className="w-px h-6 bg-gray-200"></div>

            <button onClick={() => setShowInfoDialog(true)} className="w-8 h-8 hover:bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-base">info</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}