import mongoose from 'mongoose';

/**
 * פנייה למכון / בעל זכויות לצורך קבלת אישור לספרים.
 *
 * הרשומה עצמאית ואינה קשורה לספר מסוים — היא מתעדת *מי פנה למי, מתי ובאיזה
 * אופן*, כדי שלא ייווצרו שתי פניות לאותו אדם משני אנשים שונים.
 * לכן גם פנייה שרק מתוכננת ("הולך ליצור קשר") נרשמת כאן מראש.
 *
 * שדות ה-*Key הם ערכים מנורמלים לצורך זיהוי כפילויות בלבד
 * (ראה src/lib/institute-outreach.js) — אין להציג אותם למשתמש.
 */
const InstituteOutreachSchema = new mongoose.Schema(
  {
    // המכון/המוסד שאליו פונים (יכול להיות ריק כשמדובר באדם פרטי)
    instituteName: { type: String, default: '', trim: true },

    // איש הקשר בפועל
    contactName: { type: String, default: '', trim: true },
    contactPhone: { type: String, default: '', trim: true },
    contactEmail: { type: String, default: '', trim: true },

    // מפתחות מנורמלים לזיהוי כפילויות
    phoneKey: { type: String, default: '', index: true },
    emailKey: { type: String, default: '', index: true },
    nameKey: { type: String, default: '', index: true },
    instituteKey: { type: String, default: '', index: true },

    // מי פנה מטעמנו
    outreachBy: { type: String, default: '', trim: true },
    outreachByEmail: { type: String, default: '' },

    // תאריך הפנייה — או התאריך המתוכנן כשהסטטוס הוא "הולך ליצור קשר"
    outreachDate: { type: Date, default: null },

    // אופן הפנייה — מפתח מתוך רשימת "אופני קבלת אישור" (SystemConfig)
    channel: { type: String, default: '' },

    // נושא הפנייה: אילו ספרים התבקשו / על מה דובר
    subject: { type: String, default: '' },

    // תוצאת הפנייה והערות חופשיות
    responseText: { type: String, default: '' },
    notes: { type: String, default: '' },

    // סטטוס — מפתח מתוך רשימה דינמית (institute_outreach_statuses)
    status: { type: String, default: 'planned', index: true },

    // נרשם למרות אזהרת כפילות — ומה הנימוק
    duplicateAcknowledged: { type: Boolean, default: false },
    duplicateReason: { type: String, default: '' },

    createdBy: { type: String, default: '' },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

InstituteOutreachSchema.index({ outreachDate: -1 });

export default mongoose.models.InstituteOutreach ||
  mongoose.model('InstituteOutreach', InstituteOutreachSchema);
