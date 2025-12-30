// app/src/models/Page.js
import mongoose from 'mongoose';

const PageSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  pageNumber: { type: Number, required: true },
  
  // תוכן הטקסט שהיה בקבצי TXT
  content: { type: String, default: '' },
  isTwoColumns: { type: Boolean, default: false },
  rightColumn: { type: String, default: '' },
  leftColumn: { type: String, default: '' },
  rightColumnName: { type: String, default: 'חלק 1' },
  leftColumnName: { type: String, default: 'חלק 2' },
  
  // סטטוס
  status: { 
    type: String, 
    enum: ['available', 'in-progress', 'completed'], 
    default: 'available',
    index: true // הוספת אינדקס לשיפור ביצועי שאילתות
  },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  claimedAt: { type: Date },
  completedAt: { type: Date },
  
  // נתיך לתמונה בשרת
  imageUrl: { type: String }, 
}, { timestamps: true });

// אינדקס שיבטיח שאין שני עמודים עם אותו מספר באותו ספר ויאיץ חיפושים
PageSchema.index({ book: 1, pageNumber: 1 }, { unique: true });

export default mongoose.models.Page || mongoose.model('Page', PageSchema);