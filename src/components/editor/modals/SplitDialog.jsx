export default function SplitDialog({
  isOpen,
  onClose,
  splitMode,
  setSplitMode,
  rightColumnName,
  setRightColumnName,
  leftColumnName,
  setLeftColumnName,
  confirmSplit
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-strong rounded-2xl p-8 max-w-md w-full border-2 border-primary">
        <h3 className="text-2xl font-bold text-on-surface mb-6">פיצול עמוד</h3>
        
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-surface/50"
              style={{ borderColor: splitMode === 'content' ? '#6b5d4f' : '#e7e0d8' }}>
              <input type="radio" name="splitMode" value="content" checked={splitMode === 'content'} onChange={(e) => setSplitMode(e.target.value)} />
              <div>
                <span className="font-bold block">פיצול תוכן</span>
                <span className="text-xs text-on-surface/70">העמוד מכיל שני חלקים שונים.</span>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-surface/50"
              style={{ borderColor: splitMode === 'visual' ? '#6b5d4f' : '#e7e0d8' }}>
              <input type="radio" name="splitMode" value="visual" checked={splitMode === 'visual'} onChange={(e) => setSplitMode(e.target.value)} />
              <div>
                <span className="font-bold block">חלוקה ויזואלית</span>
                <span className="text-xs text-on-surface/70">רק לנוחות העריכה.</span>
              </div>
            </label>
          </div>

          {splitMode === 'content' && (
            <div className="space-y-3 pt-2">
              <input type="text" value={rightColumnName} onChange={(e) => setRightColumnName(e.target.value)} className="w-full px-4 py-2 border-2 rounded-lg" placeholder="שם חלק 1" />
              <input type="text" value={leftColumnName} onChange={(e) => setLeftColumnName(e.target.value)} className="w-full px-4 py-2 border-2 rounded-lg" placeholder="שם חלק 2" />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={confirmSplit} className="flex-1 px-4 py-3 bg-primary text-on-primary rounded-lg font-bold">פצל עמוד</button>
          <button onClick={onClose} className="flex-1 px-4 py-3 border-2 border-surface-variant rounded-lg">ביטול</button>
        </div>
      </div>
    </div>
  )
}