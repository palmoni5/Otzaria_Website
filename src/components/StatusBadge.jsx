'use client'

/**
 * Reusable status badge component
 * @param {Object} props
 * @param {string} props.status - Status key
 * @param {Object} props.config - Status configuration {label, color, bgColor, borderColor, icon}
 * @param {boolean} props.withIcon - Whether to show icon
 */
export default function StatusBadge({ status, config, withIcon = true }) {
  if (!config) return null

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.color} ${config.bgColor} ${config.borderColor}`}
    >
      {withIcon && config.icon && (
        <span className="material-symbols-outlined text-sm">
          {config.icon}
        </span>
      )}
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  )
}
