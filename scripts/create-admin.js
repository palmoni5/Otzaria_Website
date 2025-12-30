const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' }); // וודא שמותקן dotenv

const uri = process.env.MONGODB_URI;

async function createAdmin() {
    await mongoose.connect(uri);
    
    const email = 'admin@example.com'; // המייל שלך
    const password = 'your-secure-password';
    const hashedPassword = await bcrypt.hash(password, 12);

    // מניחים שהסכמה מוגדרת בתוך המודל, כאן נשתמש בגישה ישירה לקולקשן
    const db = mongoose.connection.db;
    
    await db.collection('users').updateOne(
        { email },
        { 
            $set: { 
                name: 'Admin', 
                email, 
                password: hashedPassword, 
                role: 'admin',
                points: 1000
            } 
        },
        { upsert: true }
    );

    console.log('✅ Admin user created/updated');
    process.exit();
}

createAdmin();