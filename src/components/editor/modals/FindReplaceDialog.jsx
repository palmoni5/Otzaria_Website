export default function FindReplaceDialog({
  isOpen,
  onClose,
  findText,
  setFindText,
  replaceText,
  setReplaceText,
  handleFindReplace
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-strong rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">find_replace</span>
            <span>חיפוש והחלפה</span>
          </h2>
          <button onClick={onClose} className="text-on-surface/50 hover:text-on-surface">
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">חפש:</label>
            <input
              type="text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-surface-variant rounded-lg focus:outline-none focus:border-primary"
              dir="rtl"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">החלף ב:</label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-surface-variant rounded-lg focus:outline-none focus:border-primary"
              dir="rtl"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => handleFindReplace(false)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-on-primary rounded-lg hover:bg-accent font-bold">
              <span>החלף ראשון</span>
            </button>
            <button onClick={() => handleFindReplace(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold">
              <span>החלף הכל</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}