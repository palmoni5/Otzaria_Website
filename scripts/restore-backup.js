import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import slugify from 'slugify';
import { fileURLToPath } from 'url';

// טעינת משתני סביבה
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// הגדרת נתיבים
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_FILE_PATH = path.join(process.cwd(), 'otzaria-backup-2026-01-04.json');

// טעינת המודלים (בהנחה שאנו מריצים עם node שתומך ב-ESM או עם Babel, אחרת יש לשנות ל-require)
// בגלל שזה סקריפט חיצוני, נגדיר את הסכמות מחדש בקצרה כדי להימנע מבעיות import של Next.js
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    points: { type: Number, default: 0 },
}, { timestamps: true });

const BookSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    slug: { type: String, index: true },
    totalPages: { type: Number, default: 0 },
    completedPages: { type: Number, default: 0 },
    category: { type: String },
    folderPath: { type: String }, // הוספתי כי זה קיים במודל המקורי
}, { timestamps: true });

const PageSchema = new mongoose.Schema({
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    pageNumber: { type: Number, required: true },
    content: { type: String, default: '' },
    status: { type: String, enum: ['available', 'in-progress', 'completed'], default: 'available' },
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    claimedAt: { type: Date },
    completedAt: { type: Date },
    imagePath: { type: String, required: true }
}, { timestamps: true });

const UploadSchema = new mongoose.Schema({
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookName: { type: String, required: true },
    originalFileName: { type: String },
    content: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Book = mongoose.models.Book || mongoose.model('Book', BookSchema);
const Page = mongoose.models.Page || mongoose.model('Page', PageSchema);
const Upload = mongoose.models.Upload || mongoose.model('Upload', UploadSchema);

// מפות להמרת ID ישן לחדש
const userMap = new Map(); // oldId -> newObjectId
const bookMap = new Map(); // bookName -> newObjectId

async function restore() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is missing in .env file');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        console.log('📖 Reading backup file...');
        const fileContent = await fs.readFile(BACKUP_FILE_PATH, 'utf-8');
        const backup = JSON.parse(fileContent);

        // --- שלב 0: ניקוי המסד (אופציונלי - בטל הערה אם אתה רוצה לאפס הכל) ---
        console.log('🧹 Cleaning existing database...');
        await User.deleteMany({});
        await Book.deleteMany({});
        await Page.deleteMany({});
        await Upload.deleteMany({});
        console.log('✅ Database cleaned.');

        // --- שלב 1: שחזור משתמשים ---
        console.log(`👥 Restoring ${backup.data.users.length} users...`);
        const usersToInsert = backup.data.users.map(u => {
            const newId = new mongoose.Types.ObjectId();
            userMap.set(u.id, newId); // שמירת המיפוי

            return {
                _id: newId,
                name: u.name,
                email: u.email,
                password: u.password, // הסיסמה כבר מוצפנת בגיבוי
                role: u.role,
                points: u.points || 0,
                createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
                updatedAt: new Date()
            };
        });
        
        if (usersToInsert.length > 0) {
            await User.insertMany(usersToInsert);
        }
        console.log('✅ Users restored.');

        // --- שלב 2: שחזור ספרים ---
        console.log(`📚 Restoring ${backup.data.books.length} books...`);
        const booksToInsert = backup.data.books.map(b => {
            const newId = new mongoose.Types.ObjectId();
            bookMap.set(b.name, newId); // שמירת המיפוי לפי שם הספר

            // יצירת slug כמו באפליקציה
            const slug = slugify(b.name, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });

            return {
                _id: newId,
                name: b.name,
                slug: slug,
                totalPages: b.totalPages,
                completedPages: 0, // נחשב מחדש בשלב הבא
                category: 'כללי', // ברירת מחדל כי אין בגיבוי
                folderPath: `/uploads/books/${slug}`, // נתיב וירטואלי
                createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
                updatedAt: b.updatedAt ? new Date(b.updatedAt) : new Date()
            };
        });

        if (booksToInsert.length > 0) {
            await Book.insertMany(booksToInsert);
        }
        console.log('✅ Books restored.');

        // --- שלב 3: שחזור עמודים ---
        console.log('📄 Restoring pages...');
        const pagesToInsert = [];
        const bookUpdates = {}; // למעקב אחרי השלמות

        for (const [bookName, pages] of Object.entries(backup.data.pages)) {
            if (!pages) continue;
            
            const bookId = bookMap.get(bookName);
            if (!bookId) {
                console.warn(`⚠️ Warning: Book "${bookName}" not found in books list. Skipping its pages.`);
                continue;
            }

            bookUpdates[bookId] = 0; // אתחול מונה דפים שהושלמו

            for (const p of pages) {
                // המרת ID של משתמשים (Claimed By)
                let claimedByNewId = null;
                if (p.claimedById && userMap.has(p.claimedById)) {
                    claimedByNewId = userMap.get(p.claimedById);
                }

                // עדכון מונה השלמות
                if (p.status === 'completed') {
                    bookUpdates[bookId]++;
                }

                pagesToInsert.push({
                    book: bookId,
                    pageNumber: p.number,
                    status: p.status || 'available',
                    claimedBy: claimedByNewId,
                    claimedAt: p.claimedAt ? new Date(p.claimedAt) : null,
                    completedAt: p.completedAt ? new Date(p.completedAt) : null,
                    imagePath: p.thumbnail || '', // שימוש בקישור מהגיבוי
                    content: '', // התוכן לא קיים בגיבוי
                    createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
                    updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date()
                });
            }
        }

        // הכנסת עמודים במנות (Chunks) למניעת עומס
        const chunkSize = 500;
        for (let i = 0; i < pagesToInsert.length; i += chunkSize) {
            const chunk = pagesToInsert.slice(i, i + chunkSize);
            await Page.insertMany(chunk);
            console.log(`   Saved pages ${i} to ${i + chunk.length}...`);
        }
        console.log(`✅ Restored ${pagesToInsert.length} pages.`);

        // עדכון סטטיסטיקות בספרים
        console.log('🔄 Updating book statistics...');
        for (const [bookId, completedCount] of Object.entries(bookUpdates)) {
            await Book.findByIdAndUpdate(bookId, { completedPages: completedCount });
        }

        // --- שלב 4: שחזור העלאות ---
        console.log(`📂 Restoring ${backup.data.uploads.length} uploads...`);
        const uploadsToInsert = backup.data.uploads.map(u => {
            let uploaderId = null;
            let reviewerId = null;

            if (u.uploadedById && userMap.has(u.uploadedById)) {
                uploaderId = userMap.get(u.uploadedById);
            }
            // אם המשתמש נמחק, נקשר לאדמין הראשון שמצאנו או נשאיר ריק (כאן נשאיר ריק אם לא נמצא)
            
            // המרת מודלים לסטטוסים שלנו
            // הגיבוי מכיל: approved, pending, rejected (תואם למודל)
            
            return {
                uploader: uploaderId || userMap.values().next().value, // חייב uploader, ניקח את הראשון אם אין
                bookName: u.bookName,
                originalFileName: u.originalFileName,
                content: "Content restored from backup (text missing in export)", // הגיבוי לא מכיל את הטקסט עצמו
                status: u.status,
                reviewedBy: reviewerId,
                createdAt: u.uploadedAt ? new Date(u.uploadedAt) : new Date(),
                updatedAt: new Date()
            };
        });

        if (uploadsToInsert.length > 0) {
            await Upload.insertMany(uploadsToInsert);
        }
        console.log('✅ Uploads restored.');

        console.log('🎉 RESTORE COMPLETE!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Restore Failed:', error);
        process.exit(1);
    }
}

restore();