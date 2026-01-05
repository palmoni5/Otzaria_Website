import mongoose from 'mongoose';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const FILES_JSON_PATH = 'files.json';
const BACKUPS_JSON_PATH = 'backups.json';

// --- סכמות ---
const UserSchema = new mongoose.Schema({ name: String, email: String });
const BookSchema = new mongoose.Schema({ name: String });
const PageSchema = new mongoose.Schema({
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    pageNumber: Number,
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: String
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Book = mongoose.models.Book || mongoose.model('Book', BookSchema);
const Page = mongoose.models.Page || mongoose.model('Page', PageSchema);

function readJson(filePath) {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8');
    try {
        return JSON.parse(content);
    } catch (e) {
        try {
            return content.trim().split('\n').map(line => JSON.parse(line));
        } catch (e2) { return []; }
    }
}

async function forceFix() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        // 1. מיפוי כל המשתמשים הקיימים במסד (לפי שם ולפי אימייל)
        console.log('👥 Loading users from DB...');
        const dbUsers = await User.find({});
        
        const nameToIdMap = new Map();
        const emailToIdMap = new Map();

        dbUsers.forEach(u => {
            if (u.name) nameToIdMap.set(u.name.trim(), u._id);
            if (u.email) emailToIdMap.set(u.email.toLowerCase().trim(), u._id);
        });

        console.log(`   Found ${dbUsers.length} users in DB.`);

        // 2. מיפוי ID ישן -> אימייל (מתוך קובץ הגיבוי של המשתמשים)
        const rawFiles = readJson(FILES_JSON_PATH);
        const usersBackup = rawFiles.find(f => f.path === 'data/users.json')?.data || [];
        const oldIdToEmailMap = new Map();
        
        usersBackup.forEach(u => {
            if (u.id && u.email) oldIdToEmailMap.set(u.id, u.email.toLowerCase().trim());
        });

        // 3. מיפוי ספרים
        const dbBooks = await Book.find({});
        const bookNameToId = new Map();
        dbBooks.forEach(b => bookNameToId.set(b.name.trim(), b._id));

        // 4. מעבר על כל הדפים וניסיון שידוך
        console.log('🔧 Starting repair process...');
        
        const allData = [...rawFiles, ...readJson(BACKUPS_JSON_PATH)];
        const pagesRecords = allData.filter(f => f.path && f.path.startsWith('data/pages/'));

        let matchedById = 0;
        let matchedByName = 0;
        let notFound = 0;
        let totalUpdates = 0;

        for (const record of pagesRecords) {
            const bookName = path.basename(record.path, '.json').trim();
            const bookId = bookNameToId.get(bookName);

            if (!bookId) continue; // ספר לא קיים במסד

            if (!record.data || !Array.isArray(record.data)) continue;

            for (const p of record.data) {
                // נדלג על דפים פנויים
                if (!p.claimedBy && !p.claimedById) continue;

                let finalUserId = null;
                let matchType = '';

                // נסיון 1: לפי ID ישן -> אימייל -> ID חדש
                if (p.claimedById) {
                    const email = oldIdToEmailMap.get(p.claimedById);
                    if (email && emailToIdMap.has(email)) {
                        finalUserId = emailToIdMap.get(email);
                        matchType = 'ID->Email';
                        matchedById++;
                    }
                }

                // נסיון 2: אם נכשל, לפי השם (claimedBy) ישירות מול המסד
                if (!finalUserId && p.claimedBy) {
                    const name = p.claimedBy.trim();
                    if (nameToIdMap.has(name)) {
                        finalUserId = nameToIdMap.get(name);
                        matchType = 'NameDirect';
                        matchedByName++;
                    }
                }

                if (finalUserId) {
                    const pageNum = p.number?.$numberInt ? parseInt(p.number.$numberInt) : p.number;

                    // ביצוע העדכון בפועל
                    await Page.updateOne(
                        { book: bookId, pageNumber: pageNum },
                        { 
                            $set: { 
                                claimedBy: finalUserId,
                                status: p.status === 'available' ? 'in-progress' : p.status // אם היה תפוס בגיבוי, נסמן לפחות כבטיפול
                            }
                        }
                    );
                    totalUpdates++;
                } else {
                    notFound++;
                    // אופציונלי: הדפס לוג למקרים שלא נמצאו כדי להבין למה
                    // console.log(`❌ Failed to link: User "${p.claimedBy}" (ID: ${p.claimedById}) in book "${bookName}"`);
                }
            }
        }

        console.log('------------------------------------------------');
        console.log(`📊 Summary:`);
        console.log(`   Matched via ID link: ${matchedById}`);
        console.log(`   Matched via Name fallback: ${matchedByName}`);
        console.log(`   Users not found in DB: ${notFound}`);
        console.log(`✅ Total Pages Updated: ${totalUpdates}`);
        console.log('------------------------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
}

forceFix();