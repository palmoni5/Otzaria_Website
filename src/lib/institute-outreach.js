/**
 * לוגיקה טהורה (ללא mongoose) לכרטיסיית "פניות למכונים" שבעמוד מקורות ספרים.
 *
 * הקובץ מיובא גם מרכיבי לקוח וגם מנתיבי ה-API, ולכן אסור שיטען מודלים.
 *
 * המטרה המרכזית: לזהות פנייה כפולה לאותו אדם/מכון — כולל פנייה שרק *מתוכננת*
 * ("הולך ליצור קשר"), כדי שהכפילות תתגלה לפני הפנייה עצמה ולא אחריה.
 */

// סטטוסים של פנייה. 'planned' = טרם נוצר קשר, רק הצהרת כוונה.
export const OUTREACH_STATUSES = {
  planned: { label: 'הולך ליצור קשר', color: '#8b5cf6' },
  contacted: { label: 'נוצר קשר', color: '#3b82f6' },
  waiting: { label: 'ממתין לתשובה', color: '#f59e0b' },
  agreed: { label: 'הסכים', color: '#10b981' },
  refused: { label: 'סירב', color: '#ef4444' },
  no_answer: { label: 'ללא מענה', color: '#94a3b8' },
};

export const OUTREACH_STATUSES_CONFIG_KEY = 'institute_outreach_statuses';

export const DEFAULT_OUTREACH_STATUS = 'planned';

// סטטוסים שעדיין "חיים" — פנייה נוספת אליהם היא בדרך כלל כפילות מיותרת
export const OPEN_OUTREACH_STATUSES = ['planned', 'contacted', 'waiting'];

// טווח הימים שבו פנייה חוזרת נחשבת כפילות "טרייה" (אזהרה מודגשת)
export const RECENT_DUPLICATE_DAYS = 30;

/**
 * נרמול מספר טלפון להשוואה: ספרות בלבד, ללא קידומת בינלאומית ישראלית
 * וללא אפס מוביל — כדי ש-"050-123-4567", "+97250 1234567" ו-"501234567" יזוהו כזהים.
 */
export function normalizePhone(value) {
  if (typeof value !== 'string') return '';
  let digits = value.replace(/\D+/g, '');
  if (!digits) return '';
  if (digits.startsWith('972')) digits = digits.slice(3);
  digits = digits.replace(/^0+/, '');
  return digits.length >= 7 ? digits : '';
}

/** נרמול כתובת מייל להשוואה */
export function normalizeEmail(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

// תוארי כבוד נפוצים — אינם מבדילים בין אנשים ולכן מוסרים לפני ההשוואה
const NAME_PREFIXES = ['הרב', 'הגר', 'רבי', 'ר', 'מר', 'הרה', 'מכון', 'מוסד', 'ישיבת', 'עמותת'];

/**
 * נרמול שם להשוואה: הסרת גרשיים/ניקוד/תוארי כבוד וכיווץ רווחים.
 * "הרב יוסף כהן" ו-"ר' יוסף כהן" ייתנו את אותו מפתח.
 */
export function normalizeName(value) {
  if (typeof value !== 'string') return '';
  const cleaned = value
    .replace(/[֑-ׇ]/g, '') // ניקוד וטעמים
    .replace(/["'׳״`]/g, '')
    .replace(/[.,\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (!cleaned) return '';
  const words = cleaned.split(' ').filter((word) => !NAME_PREFIXES.includes(word));
  return (words.length ? words : cleaned.split(' ')).join(' ');
}

/** מפתחות ההשוואה של רשומה/טופס */
export function outreachKeys(source) {
  return {
    phoneKey: normalizePhone(source?.contactPhone),
    emailKey: normalizeEmail(source?.contactEmail),
    nameKey: normalizeName(source?.contactName),
    instituteKey: normalizeName(source?.instituteName),
  };
}

/** האם שתי רשומות מתייחסות לאותו נמען, ואם כן — מה סיבת ההתאמה */
export function matchReason(a, b) {
  const left = outreachKeys(a);
  const right = outreachKeys(b);
  if (left.phoneKey && left.phoneKey === right.phoneKey) return 'phone';
  if (left.emailKey && left.emailKey === right.emailKey) return 'email';
  if (left.nameKey && left.nameKey === right.nameKey) return 'name';
  if (left.instituteKey && left.instituteKey === right.instituteKey) return 'institute';
  return '';
}

export const MATCH_REASON_LABELS = {
  phone: 'אותו מספר טלפון',
  email: 'אותה כתובת מייל',
  name: 'אותו איש קשר',
  institute: 'אותו מכון',
};

/** מספר הימים שחלפו מאז תאריך (0 כשאין תאריך) */
export function daysSince(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

/**
 * מאתר פניות קודמות לאותו נמען.
 *
 * @param {Array}  records   כל הפניות הקיימות
 * @param {object} candidate הטופס/הרשומה הנבדקת
 * @param {string} excludeId מזהה רשומה שנערכת (כדי שלא תתאים לעצמה)
 * @returns {Array} התאמות ממוינות מהחדשה לישנה, כל אחת עם reason ו-days
 */
export function findDuplicates(records, candidate, excludeId = '') {
  const matches = [];
  for (const record of records || []) {
    if (excludeId && String(record._id) === String(excludeId)) continue;
    const reason = matchReason(candidate, record);
    if (!reason) continue;
    const days = daysSince(record.outreachDate || record.createdAt);
    matches.push({
      ...record,
      reason,
      days,
      isOpen: OPEN_OUTREACH_STATUSES.includes(record.status),
      isRecent: days !== null && days <= RECENT_DUPLICATE_DAYS,
    });
  }
  return matches.sort((a, b) => {
    const aDate = new Date(a.outreachDate || a.createdAt || 0).getTime();
    const bDate = new Date(b.outreachDate || b.createdAt || 0).getTime();
    return bDate - aDate;
  });
}

/** תיאור קצר לכפילות, לשימוש באזהרות */
export function describeDuplicate(match) {
  const who = match.outreachBy || 'לא ידוע מי';
  const when =
    match.days === null
      ? 'ללא תאריך'
      : match.days === 0
        ? 'היום'
        : match.days === 1
          ? 'אתמול'
          : `לפני ${match.days} ימים`;
  return `${who} · ${when}`;
}
