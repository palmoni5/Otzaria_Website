import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Book from '@/models/Book';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request) {

  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { bookId, editingInfo, examplePage } = body;

    await connectDB();

    const updateData = { editingInfo };
    
    if (examplePage !== undefined) {
        updateData.examplePage = examplePage;
    } else {
    }


    const book = await Book.findByIdAndUpdate(
        bookId,
        updateData,
        { new: true }
    );

    if (!book) {
        console.log('❌ Book not found in DB with ID:', bookId);
        return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'המידע עודכן' });
  } catch (error) {
    console.error('🔥 API ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}