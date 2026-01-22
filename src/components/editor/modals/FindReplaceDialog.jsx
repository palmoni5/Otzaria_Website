import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function FindReplaceDialog({
  isOpen,
  onClose,
  findText,
  setFindText,
  replaceText,
  setReplaceText,
  handleFindReplace,
  savedSearches,
  addSavedSearch,
  removeSavedSearch,
  moveSearch,
  runAllSavedReplacements,
  handleRemoveDigits
}) {
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState('main') 

  const [newLabel, setNewLabel] = useState('')
  const [newFind, setNewFind] = useState('')
  const [newReplace, setNewReplace] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
        setView('main');
        setNewLabel('');
        setNewFind('');
        setNewReplace('');
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  const getTitle = () => {
      switch(view) {
          case 'list': return 'חיפושים קבועים';
          case 'add': return 'הוספת חיפוש חדש';
          default: return 'חיפוש והחלפה';
      }
  }

  const getIcon = () => {
      switch(view) {
          case 'list': return 'list_alt';
          case 'add': return 'add_circle';
          default: return 'find_replace';
      }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="flex flex-col bg-white glass-strong rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-surface-variant flex-shrink-0">
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">{getIcon()}</span>
            <span>{getTitle()}</span>
          </h2>
          <button onClick={onClose} className="text-on-surface/50 hover:text-on-surface hover:bg-surface-variant p-2 rounded-full transition-colors">
            <span className="material-symbols-outlined text-2xl block">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          
          {view === 'main' && (
            <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-on-surface">חפש:</label>
                    <button onClick={() => setFindText(prev => prev + '^13')} className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded border border-gray-300 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">keyboard_return</span>
                      (^13)
                    </button>
                  </div>
                  <input
                    type="text"
                    value={findText}
                    onChange={(e) => setFindText(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-surface-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                    dir="rtl"
                    autoFocus
                    placeholder="הזן טקסט..."
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-on-surface">החלף ב:</label>
                    <button onClick={() => setReplaceText(prev => prev + '^13')} className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded border border-gray-300 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">keyboard_return</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-surface-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                    dir="rtl"
                    placeholder="הזן טקסט..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                    <button onClick={() => handleFindReplace(false)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-on-primary rounded-lg hover:bg-accent font-bold transition-all shadow-sm">
                        <span className="material-symbols-outlined text-sm">find_replace</span>
                        <span>החלף ראשון</span>
                    </button>
                    <button onClick={() => handleFindReplace(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition-all shadow-sm">
                        <span className="material-symbols-outlined text-sm">published_with_changes</span>
                        <span>החלף הכל</span>
                    </button>
                </div>

                <div className="pt-4 border-t border-surface-variant space-y-3">
                    <button 
                        onClick={handleRemoveDigits} 
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 transition-colors text-sm font-medium"
                        title="נקה את כל הספרות מהטקסט"
                    >
                        <span className="text-xs font-bold line-through">123</span>
                        <span>נקה ספרות מהטקסט</span>
                    </button>

                    <button 
                        onClick={() => setView('list')}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                        <span className="material-symbols-outlined text-sm">list</span>
                        חיפושים קבועים
                    </button>
                </div>
            </div>
          )}

          {view === 'list' && (
            <div className="space-y-4">
                 <button 
                    onClick={runAllSavedReplacements}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold transition-all shadow-sm mb-2"
                >
                    <span className="material-symbols-outlined">playlist_play</span>
                    חפש והחלף הכל (לפי סדר)
                </button>
                
                <button 
                    onClick={() => {
                        setNewLabel('');
                        setNewFind('');
                        setNewReplace('');
                        setView('add');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    הוסף חיפוש שמור חדש
                </button>

                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 mt-2">
                    {savedSearches && savedSearches.length > 0 ? (
                        savedSearches.map((search, index) => (
                            <div key={search.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between gap-3 group hover:border-primary/50 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm text-gray-800 truncate">{search.label || search.findText}</div>
                                    <div className="text-xs text-gray-500 truncate flex items-center gap-1 mt-1">
                                        <span className="bg-white px-1 border rounded">{search.findText}</span>
                                        <span className="material-symbols-outlined text-[10px]">arrow_back</span>
                                        <span className="bg-white px-1 border rounded">{search.replaceText || '(ריק)'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                     <button 
                                        onClick={() => handleFindReplace(true, search.findText, search.replaceText)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded bg-blue-50/50 border border-blue-100"
                                        title="הרץ חיפוש זה כעת"
                                    >
                                        <span className="material-symbols-outlined text-lg">play_arrow</span>
                                    </button>
                                    <div className="flex flex-col">
                                        <button onClick={() => moveSearch(index, 'up')} disabled={index === 0} className="p-0.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-30">
                                            <span className="material-symbols-outlined text-sm">keyboard_arrow_up</span>
                                        </button>
                                        <button onClick={() => moveSearch(index, 'down')} disabled={index === savedSearches.length - 1} className="p-0.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-30">
                                            <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                                        </button>
                                    </div>
                                    <button onClick={() => removeSavedSearch(search.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="מחק">
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 py-4">אין חיפושים שמורים</div>
                    )}
                </div>

                <button 
                    onClick={() => setView('main')}
                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    חזרה לחיפוש רגיל
                </button>
            </div>
          )}

          {view === 'add' && (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-on-surface mb-1">שם החיפוש (אופציונלי):</label>
                    <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-surface-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        placeholder="לדוגמה: הסרת סוגריים"
                    />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-bold text-on-surface">טקסט לחיפוש:</label>
                        <button onClick={() => setNewFind(prev => prev + '^13')} className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded border border-gray-300 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">keyboard_return</span>
                            (^13)
                        </button>
                    </div>
                    <input
                        type="text"
                        value={newFind}
                        onChange={(e) => setNewFind(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-surface-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        dir="rtl"
                    />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-bold text-on-surface">טקסט להחלפה:</label>
                        <button onClick={() => setNewReplace(prev => prev + '^13')} className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded border border-gray-300 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">keyboard_return</span>
                        </button>
                    </div>
                    <input
                        type="text"
                        value={newReplace}
                        onChange={(e) => setNewReplace(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-surface-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        dir="rtl"
                    />
                </div>

                <div className="flex gap-3 pt-4">
                     <button 
                        onClick={() => setView('list')}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-bold"
                    >
                        ביטול
                    </button>
                    <button 
                        onClick={() => {
                            if (!newFind) return alert('חובה להזין טקסט לחיפוש');
                            addSavedSearch(newLabel, newFind, newReplace);
                            setView('list');
                        }}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
                    >
                        שמור
                    </button>
                </div>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  )
}