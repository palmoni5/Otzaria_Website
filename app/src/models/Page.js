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

PageSchema.index({ 
    content: 'text', 
    rightColumn: 'text', 
    leftColumn: 'text' 
}, {
    weights: {
        content: 10,      // עדיפות לתוכן ראשי
        rightColumn: 5,
        leftColumn: 5
    },
    name: 'TextIndex'
});

export default mongoose.models.Page || mongoose.model('Page', PageSchema);