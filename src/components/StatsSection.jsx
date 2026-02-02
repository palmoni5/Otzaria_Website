'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, useInView, useSpring, useTransform } from 'framer-motion'

function Counter({ value }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-50px" })
  
  const spring = useSpring(0, { mass: 3, stiffness: 20, damping: 35 })
  const display = useTransform(spring, (current) => 
    Math.round(current).toLocaleString()
  )

  useEffect(() => {
    if (inView) spring.set(value)
  }, [inView, value, spring])

  return <motion.span ref={ref}>{display}</motion.span>
}

export default function StatsSection() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch('/api/public-stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.stats)
      })
      .catch(err => console.error(err))
  }, [])

  if (!stats) return null

  const items = [
    { label: 'משתמשים', value: stats.users?.total || 0, icon: 'group' },
    { label: 'ספרים', value: stats.books?.total || 0, icon: 'menu_book' },
    { label: 'עמודים', value: stats.totalPages || 0, icon: 'description' },
  ]

  return (
    <section className="py-16 bg-transparent">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <motion.div 
              key={i} 
              // שימוש ב-glass effect ובצבעי ה-surface שהגדרת
              className="flex flex-col items-center p-8 rounded-xl border border-surface-variant glass-strong shadow-sm cursor-default"
              
              whileHover={{ 
                y: -10,
                // שימוש בצבע ה-primary עבור המסגרת במעבר עכבר
                borderColor: "var(--color-primary)",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)"
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* האייקון בצבע primary מהתימה */}
              <span className="material-symbols-outlined text-4xl mb-4 text-primary">
                {item.icon}
              </span>
              
              {/* המספר בפונט הפרנק שהגדרת */}
              <div className="text-4xl font-bold text-on-background mb-2 font-frank">
                <Counter value={item.value} />
              </div>
              
              {/* התווית בצבע secondary העדין יותר */}
              <div className="text-secondary font-medium">
                {item.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}