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

        const formData = await request.formData();
        const file = formData.get('file');
        const bookName = formData.get('bookName');

        if (!file || !bookName) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

        const content = await file.text();
        await connectDB();


        const upload = await Upload.findOneAndUpdate(
            

            { bookName: bookName }, 
            

            { 
                uploader: session.user._id, 
                originalFileName: file.name,
                content: content,
                fileSize: file.size,
                lineCount: content.split('\n').length,
                status: 'pending',
                createdAt: new Date() 
            },
            

            { 
                upsert: true, 
                new: true, 
                setDefaultsOnInsert: true 
            }
        );

        return NextResponse.json({ 
            success: true, 
            message: 'התוכן עודכן בהצלחה',
            uploadId: upload._id 
        });

    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ success: false, error: 'שגיאה בעיבוד הקובץ' }, { status: 500 });
    }
}
