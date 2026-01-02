export default function InfoDialog({ isOpen, onClose, editingInstructions }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-strong rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-3xl">info</span>
            <span>{editingInstructions.title}</span>
          </h2>
          <button onClick={onClose} className="text-on-surface/50 hover:text-on-surface">
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>

        <div className="space-y-6">
          {editingInstructions.sections.map((section, idx) => (
            <div key={idx} className="bg-surface/30 rounded-xl p-4">
              <h3 className="text-lg font-bold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">check_circle</span>
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2 text-on-surface/80">
                    <span className="material-symbols-outlined text-sm text-primary mt-0.5">arrow_left</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="w-full mt-6 px-4 py-3 bg-primary text-on-primary rounded-lg hover:bg-accent font-bold">
          הבנתי, בואו נתחיל!
        </button>
      </div>
    </div>
  )
}