import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Book from '@/models/Book';
import Page from '@/models/Page';
import fs from 'fs-extra';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function DELETE(request) {
    try {
        // 1. אבטחה: בדיקת הרשאות אדמין
        const session = await getServerSession(authOptions);
        
        // בדיקה כפולה: גם שיש סשן וגם שהתפקיד הוא אדמין
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { bookId } = await request.json();
        
        if (!bookId) {
            return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
        }

        await connectDB();

        const book = await Book.findById(bookId);
        if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });

        if (book.folderPath) { // בדיקה שהשדה קיים
            const relativePath = book.folderPath.startsWith('/') ? book.folderPath.slice(1) : book.folderPath;
            const fullPath = path.join(process.cwd(), 'public', relativePath);

            if (fullPath.includes('uploads') && await fs.pathExists(fullPath)) {
                await fs.remove(fullPath);
            }
        } else {
            console.warn(`Book ${bookId} has no folderPath, skipping physical file deletion.`);
        }

        // 3. מחיקת כל העמודים המשויכים לספר מה-DB
        await Page.deleteMany({ book: bookId });

        // 4. מחיקת רשומת הספר עצמה מה-DB
        await Book.findByIdAndDelete(bookId);

        return NextResponse.json({ success: true, message: 'הספר נמחק בהצלחה' });
    } catch (error) {
        console.error('Delete book error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}