import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Message from '@/models/Message';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });

        const { messageId, reply } = await request.json();
        if (!messageId || !reply || !String(reply).trim()) {
            return NextResponse.json({ error: 'חסר מזהה הודעה או תוכן תגובה' }, { status: 400 });
        }

        const userId = session?.user?._id
        if (!userId) return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });

        await connectDB();

        const message = await Message.findById(messageId).select('sender recipient');
        if (!message) return NextResponse.json({ error: 'ההודעה לא נמצאה' }, { status: 404 });

        const isAdmin = session?.user?.role === 'admin';
        if (!isAdmin) {
            const userIdStr = String(userId);
            const isParticipant = String(message.sender) === userIdStr || String(message.recipient) === userIdStr;
            if (!isParticipant) return NextResponse.json({ error: 'אין גישה' }, { status: 403 });
        }

        await Message.findByIdAndUpdate(messageId, {
            $push: {
                replies: {
                    sender: userId,
                    content: String(reply),
                    createdAt: new Date()
                }
            },
            // כל תגובה חדשה הופכת את השרשור ל"לא נקרא" עבור הצד השני
            isRead: false
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error replying to message:', error);
        const isDev = process.env.NODE_ENV !== 'production';
        return NextResponse.json(
            { error: isDev ? error.message : 'אירעה שגיאה בלתי צפויה' },
            { status: 500 }
        );
    }
}