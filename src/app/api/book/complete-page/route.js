import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Page from '@/models/Page';
import Book from '@/models/Book';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { pageId, bookId } = await request.json();
    await connectDB();

    // 1. עדכון הדף - וחשוב מאוד: הוספת populate כדי להחזיר את המידע המלא ללקוח
    const page = await Page.findOneAndUpdate(
      { _id: pageId, claimedBy: session.user._id, status: 'in-progress' },
      { status: 'completed', completedAt: new Date() },
      { new: true } // מחזיר את האובייקט המעודכן
    ).populate('claimedBy', 'name email'); // שולף את פרטי המשתמש לתצוגה תקינה

    if (!page) {
      return NextResponse.json({ error: 'Page update failed' }, { status: 400 });
    }

    // 2. עדכון מונה הספר
    await Book.findByIdAndUpdate(page.book, { $inc: { completedPages: 1 } });

    // 3. עדכון ניקוד משתמש
    await User.findByIdAndUpdate(session.user._id, { $inc: { points: 10 } });

    // החזרת העמוד המעודכן (page) - זה התיקון הקריטי
    return NextResponse.json({ 
        success: true, 
        message: 'הושלם בהצלחה!',
        page: { // פרמוט הנתונים כמו שהקלאיינט מצפה לקבל
            id: page._id,
            number: page.pageNumber,
            status: page.status,
            thumbnail: page.imagePath,
            claimedBy: page.claimedBy ? page.claimedBy.name : null,
            claimedById: page.claimedBy ? page.claimedBy._id : null,
            claimedAt: page.claimedAt,
            completedAt: page.completedAt
        }
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}