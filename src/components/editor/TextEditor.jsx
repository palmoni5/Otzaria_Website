export default function TextEditor({
  content,
  leftColumn,
  rightColumn,
  twoColumns,
  rightColumnName,
  leftColumnName,
  handleAutoSave,
  handleColumnChange,
  setActiveTextarea,
  selectedFont
}) {
  return (
    <div
      className="flex flex-col overflow-auto p-4 editor-container"
      style={{ flex: 1 }}
      onWheel={(e) => e.stopPropagation()}
    >
      {twoColumns ? (
        <div className="grid grid-cols-2 gap-4 h-full">
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-2 px-2">
              <span className="material-symbols-outlined text-primary text-sm">article</span>
              <span className="text-sm font-bold text-on-surface">{rightColumnName}</span>
            </div>
            <textarea
              data-column="right"
              value={rightColumn}
              onChange={(e) => handleColumnChange('right', e.target.value)}
              onFocus={() => setActiveTextarea('right')}
              placeholder={`טקסט ${rightColumnName}...`}
              style={{ fontFamily: selectedFont }}
              className="flex-1 p-4 bg-white border-2 border-surface-variant rounded-lg resize-none focus:outline-none focus:border-primary transition-colors text-lg leading-relaxed"
              dir="rtl"
            />
          </div>
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-2 px-2">
              <span className="material-symbols-outlined text-primary text-sm">article</span>
              <span className="text-sm font-bold text-on-surface">{leftColumnName}</span>
            </div>
            <textarea
              data-column="left"
              value={leftColumn}
              onChange={(e) => handleColumnChange('left', e.target.value)}
              onFocus={() => setActiveTextarea('left')}
              placeholder={`טקסט ${leftColumnName}...`}
              style={{ fontFamily: selectedFont }}
              className="flex-1 p-4 bg-white border-2 border-surface-variant rounded-lg resize-none focus:outline-none focus:border-primary transition-colors text-lg leading-relaxed"
              dir="rtl"
            />
          </div>
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => handleAutoSave(e.target.value)}
          onFocus={() => setActiveTextarea(null)}
          placeholder="התחל להקליד את הטקסט מהעמוד כאן..."
          style={{ fontFamily: selectedFont }}
          className="w-full h-full p-4 bg-white border-2 border-surface-variant rounded-lg resize-none focus:outline-none focus:border-primary transition-colors text-lg leading-relaxed"
          dir="rtl"
        />
      )}
    </div>
  )
}