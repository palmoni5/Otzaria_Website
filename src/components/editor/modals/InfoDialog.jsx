import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function InfoDialog({ isOpen, onClose, bookInstructions, globalInstructions }) {
  const [mounted, setMounted] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setDontShowAgain(false)
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  const handleClose = () => {
    onClose(dontShowAgain)
  }

  if (!isOpen || !mounted) return null

  // פונקציית עזר לרינדור סקשנים בעיצוב המקורי בדיוק
  const renderSections = (sections) => {
    if (!sections) return null;
    return sections.map((section, idx) => (
      <div key={idx} className="bg-surface/50 border border-surface-variant rounded-xl p-5">
        <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2 border-b border-surface-variant/50 pb-2">
          <span className="material-symbols-outlined">check_circle</span>
          {section.title}
        </h3>
        <ul className="space-y-3">
          {section.items.map((item, itemIdx) => (
            <li key={itemIdx} className="flex items-start gap-3 text-on-surface/90">
              <span className="material-symbols-outlined text-sm text-primary mt-1 flex-shrink-0">arrow_left</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ));
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={handleClose}>
      <div 
        className="flex flex-col bg-white glass-strong rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] animate-in zoom-in-95 duration-200" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* כותרת עליונה */}
        <div className="flex items-center justify-between p-6 border-b border-surface-variant flex-shrink-0 bg-white/50 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-3xl">info</span>
            <span>הנחיות עריכה</span>
          </h2>
          <button 
            onClick={handleClose} 
            className="text-on-surface/50 hover:text-on-surface hover:bg-surface-variant p-2 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-2xl block">close</span>
          </button>
        </div>

        {/* תוכן גלילה */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-8">
            
            {/* חלק 1: הנחיות הספר */}
            {bookInstructions && bookInstructions.sections && bookInstructions.sections.length > 0 && (
              <div>
                 {/* כותרת משנה רק כדי להבדיל, אבל בעיצוב נקי שתואם למקור */}
                <h4 className="text-md font-bold text-on-surface/70 mb-3 pr-1 border-r-4 border-primary/50 mr-1">
                  {bookInstructions.title || 'הנחיות לספר זה'}
                </h4>
                <div className="space-y-6">
                  {renderSections(bookInstructions.sections)}
                </div>
              </div>
            )}

            {/* קו מפריד עדין אם יש את שני הסוגים */}
            {bookInstructions?.sections?.length > 0 && globalInstructions?.sections?.length > 0 && (
               <div className="border-t border-surface-variant/60 my-2"></div>
            )}

            {/* חלק 2: הנחיות גלובליות */}
            {globalInstructions && globalInstructions.sections && globalInstructions.sections.length > 0 && (
              <div>
                <h4 className="text-md font-bold text-on-surface/70 mb-3 pr-1 border-r-4 border-primary/50 mr-1">
                  {globalInstructions.title || 'הנחיות מערכת'}
                </h4>
                <div className="space-y-6">
                  {renderSections(globalInstructions.sections)}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* פוטר */}
        <div className="p-6 border-t border-surface-variant bg-surface/30 flex-shrink-0 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-on-surface/80 hover:text-on-surface select-none group">
            <input 
              type="checkbox" 
              checked={dontShowAgain} 
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-5 h-5 rounded border-surface-variant text-primary focus:ring-primary cursor-pointer transition-colors"
            />
            <span className="text-sm font-medium group-hover:text-primary transition-colors">אל תציג שוב לספר זה</span>
          </label>

          <button 
            onClick={handleClose} 
            className="w-full sm:w-auto px-8 py-3 bg-primary text-on-primary rounded-lg hover:bg-accent font-bold transition-all hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">check</span>
            הבנתי, בואו נתחיל!
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}