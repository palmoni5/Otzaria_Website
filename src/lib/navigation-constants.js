/**
 * Navigation links and menu configurations
 */

export const LIBRARY_NAV_LINKS = [
  { href: '/library', label: 'בית', icon: 'home' },
  { href: '/library/books', label: 'ספרייה', icon: 'library_books' },
  { href: '/library/users', label: 'משתמשים', icon: 'people' },
  { href: '/library/upload', label: 'הוספת ספר', icon: 'upload' }
]

export const MAIN_NAV_LINKS = [
  { href: '/library', label: 'ספריית אוצריא', highlight: true },
  { href: '/#download', label: 'הורדה', highlight: false },
  { href: '/docs', label: 'מדריכים', highlight: false },
  { href: '/faq', label: 'שאלות נפוצות', highlight: false },
  { href: '/donate', label: 'תרומות', highlight: false },
  { href: 'https://forum.otzaria.org', label: 'פורום', external: true, highlight: false }
]

export const FOOTER_QUICK_LINKS = [
  { href: '/', label: 'אוצריא - תוכנה', icon: 'link' },
  { href: '/library', label: 'הספרייה', icon: 'link' },
  { href: '/library/users', label: 'משתמשים', icon: 'link' },
  { href: '/library/dashboard', label: 'איזור אישי', icon: 'link' }
]

export const FOOTER_EXTERNAL_LINKS = [
  { href: 'https://github.com/Y-PLONI/otzaria-library', label: 'GitHub - ספריית אוצריא', icon: 'open_in_new' },
  { 
    href: 'https://mitmachim.top/topic/90100/%D7%91%D7%A7%D7%A9%D7%94-%D7%94%D7%A4%D7%A8%D7%95%D7%99%D7%A7%D7%98-%D7%94%D7%A9%D7%99%D7%AA%D7%95%D7%A4%D7%99-%D7%94%D7%97%D7%93%D7%A9-%D7%9E%D7%91%D7%99%D7%AA-%D7%90%D7%95%D7%A6%D7%A8%D7%99%D7%90-%D7%95%D7%96%D7%99%D7%AA-%D7%94%D7%95%D7%A1%D7%A4%D7%AA-%D7%A1%D7%A4%D7%A8%D7%99%D7%9D-%D7%97%D7%A1%D7%A8%D7%99%D7%9D', 
    label: 'מתמחים טופ', 
    icon: 'open_in_new' 
  }
]
