import mongoose from 'mongoose';

const ReminderHistorySchema = new mongoose.Schema({
  adminName: {
    type: String,
    required: true
  },
  adminEmail: {
    type: String, // אופציונלי - טוב לזיהוי חד ערכי
  },
  bookName: {
    type: String,
    required: true
  },
  bookPath: {
    type: String,
    required: true
  },
  recipientCount: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// מניעת יצירה כפולה של המודל אם הוא כבר קיים בזיכרון
export default mongoose.models.ReminderHistory || mongoose.model('ReminderHistory', ReminderHistorySchema);