import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Page from '@/models/Page';
import User from '@/models/User';
import Book from '@/models/Book'; 
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const userId = session.user.id || session.user._id;

    // 1. שליפת המשתמש
    const user = await User.findById(userId).select('points');
    
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. סטטיסטיקות
    const stats = await Page.aggregate([
      { $match: { claimedBy: user._id } },
      {
        $group: {
          _id: null,
          totalMyPages: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } }
        }
      }
    ]);

    const userStats = stats[0] || { totalMyPages: 0, completed: 0, inProgress: 0 };

    // 3. פעילות אחרונה
    const recentActivityRaw = await Page.find({ claimedBy: user._id })
      .sort({ status: -1, updatedAt: -1 }) 
      .limit(10)
      .populate('book', 'name slug')
      .lean();

    // מיפוי הנתונים
    const recentActivity = recentActivityRaw.map(page => {
      const bookName = page.book?.name || 'ספר לא ידוע';
      const bookPath = page.book?.slug || '#';

      return {
        id: page._id.toString(),
        bookName: bookName,
        bookPath: bookPath,
        pageNumber: page.pageNumber,
        status: page.status,
        date: page.updatedAt ? new Date(page.updatedAt).toLocaleDateString('he-IL') : '-'
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        myPages: userStats.totalMyPages,
        completedPages: userStats.completed,
        inProgressPages: userStats.inProgress,
        points: user.points || 0,
        recentActivity
      }
    });

  } catch (error) {
    console.error('User Stats API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}