import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Message from '@/models/Message';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// קבלת הודעות שלי
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        await connectDB();
        
        // אם אדמין - רואה הכל (או הודעות שנשלחו אליו/למנהלים).
        // אם משתמש - רואה רק את שלו.
        
        let query = {};
        
        if (session.user.role === 'admin') {
            // אדמין רואה את כל ההודעות שנשלחו למערכת (recipient: null) או אליו ספציפית
            // אפשר גם לאפשר לאדמין לראות הכל: query = {}
             query = {}; 
        } else {
            // משתמש רגיל רואה הודעות ששלח או שנשלחו אליו
            query = { 
                $or: [
                    { sender: session.user._id },
                    { recipient: session.user._id }
                ]
            };
        }

        const messages = await Message.find(query)
            .populate('sender', 'name email role') // לוודא ששולפים שם ואימייל
            .populate('replies.sender', 'name email role')
            .sort({ createdAt: -1 });

        // המרה לפורמט נוח לקריאה בקלאיינט
        const formattedMessages = messages.map(msg => ({
            id: msg._id,
            subject: msg.subject,
            content: msg.content,
            sender: msg.sender, // אובייקט מלא (name, email, _id)
            senderName: msg.sender?.name || 'משתמש לא ידוע',
            senderEmail: msg.sender?.email,
            status: msg.replies?.length > 0 ? 'replied' : (msg.isRead ? 'read' : 'unread'),
            createdAt: msg.createdAt,
            replies: (msg.replies || []).map(r => ({
                id: r._id,
                sender: r.sender?._id || r.sender,
                senderName: r.sender?.name,
                senderEmail: r.sender?.email,
                senderRole: r.sender?.role,
                content: r.content,
                createdAt: r.createdAt
            }))
        }));

        return NextResponse.json({ success: true, messages: formattedMessages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// שליחת הודעה
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { subject, content, recipientId } = await request.json();
        await connectDB();

        await Message.create({
            sender: session.user._id,
            recipient: recipientId || null, // null = למנהלים
            subject,
            content,
            isRead: false
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}