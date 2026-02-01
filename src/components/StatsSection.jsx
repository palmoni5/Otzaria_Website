'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, useInView, useSpring, useTransform } from 'framer-motion'

// קומפוננטת המספר הרץ
function Counter({ value }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-50px" }) // מתחיל קצת לפני שמגיעים לאלמנט
  
  // שינוי הגדרות המהירות:
  // mass: כובד (יותר גבוה = יותר לאט)
  // stiffness: קשיחות (נמוך יותר = פחות קופצני ויותר איטי)
  // damping: חיכוך (מונע נדנוד בסוף)
  const spring = useSpring(0, { mass: 3, stiffness: 20, damping: 35 })
  
  const display = useTransform(spring, (current) => 
    Math.round(current).toLocaleString()
  )

  useEffect(() => {
    if (inView) {
      spring.set(value)
    }
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
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <motion.div 
              key={i} 
              className="flex flex-col items-center p-8 rounded-xl border border-gray-100 bg-[#f9f9f9] shadow-sm cursor-default"
              
              // הגדרות האנימציה לכרטיס עצמו (Hover)
              whileHover={{ 
                y: -10, // עולה למעלה ב-10 פיקסלים
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", // צל עמוק יותר
                borderColor: "rgba(59, 130, 246, 0.3)" // מסגרת כחלחלה עדינה
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span className="material-symbols-outlined text-4xl mb-4 text-blue-600">
                {item.icon}
              </span>
              
              <div className="text-4xl font-bold text-gray-900 mb-2">
                <Counter value={item.value} />
              </div>
              
              <div className="text-gray-500 font-medium">
                {item.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}