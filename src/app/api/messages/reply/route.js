import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Message from '@/models/Message';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });

        const { messageId, reply, fromAdminPanel } = await request.json();
        
        if (!messageId || !reply || !String(reply).trim()) {
            return NextResponse.json({ error: 'חסר מזהה הודעה או תוכן תגובה' }, { status: 400 });
        }

        const userId = session?.user?._id || session?.user?.id;
        await connectDB();

        const isSentFromAdminInterface = fromAdminPanel === true && session?.user?.role === 'admin';

        const message = await Message.findById(messageId).select('sender recipient');
        if (!message) return NextResponse.json({ error: 'ההודעה לא נמצאה' }, { status: 404 });

        if (!isSentFromAdminInterface) {
            const userIdStr = String(userId);
            const isParticipant = String(message.sender) === userIdStr || String(message.recipient) === userIdStr;
            if (!isParticipant) return NextResponse.json({ error: 'אין גישה' }, { status: 403 });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);

        await Message.findByIdAndUpdate(messageId, {
            $push: {
                replies: {
                    sender: userObjectId,
                    content: String(reply),
                    createdAt: new Date(),
                    senderRole: isSentFromAdminInterface ? 'admin' : 'user',
                    senderName: session.user.name
                }
            },
            $set: {
                readBy: [userObjectId],
                
                isRead: isSentFromAdminInterface 
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error replying to message:', error);
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}