// app/src/models/Book.js
import mongoose from 'mongoose';

const EditingInfoSectionSchema = new mongoose.Schema({
  title: String,
  items: [String]
});

const EditingInfoSchema = new mongoose.Schema({
  title: String,
  sections: [EditingInfoSectionSchema]
});

const BookSchema = new mongoose.Schema({
  // שם ייחודי בעברית, ישמש כמזהה הראשי (ID)
  name: { type: String, required: true, unique: true },
  // ID שנוצר מההמרה, יכול להיות שימושי למפות לתמונות הישנות אם צריך
  legacyId: { type: String, index: true }, 
  totalPages: { type: Number, default: 0 },
  category: { type: String },
  author: { type: String },
  description: { type: String },
  // הנחיות עריכה ספציפיות לספר
  editingInfo: EditingInfoSchema, 
  // רפרנסים לדפים המשויכים לספר
  pages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Page' }],
}, { timestamps: true });

export default mongoose.models.Book || mongoose.model('Book', BookSchema);