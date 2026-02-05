import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Book from '@/models/Book';
import Page from '@/models/Page';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = await params; 
    const decodedId = decodeURIComponent(id);

    const book = await Book.findOne({ 
        $or: [{ slug: decodedId }, { name: decodedId }] 
    }).lean();
    
    if (!book) {
      return NextResponse.json({ success: false, error: 'הספר לא נמצא' }, { status: 404 });
    }

    if (!book.examplePage) {
        return NextResponse.json({ success: false, error: 'לא הוגדר עמוד דוגמא לספר זה' }, { status: 404 });
    }

    const page = await Page.findOne({ 
        book: book._id, 
        pageNumber: book.examplePage 
    }).lean();

    if (!page) {
        return NextResponse.json({ success: false, error: 'עמוד הדוגמא לא נמצא במערכת' }, { status: 404 });
    }

    const contentData = {
        content: page.content || '',
        leftColumn: page.leftColumn || '',
        rightColumn: page.rightColumn || '',
        twoColumns: page.twoColumns || (!!page.rightColumn || !!page.leftColumn),
        rightColumnName: page.rightColumnName || 'חלק 1',
        leftColumnName: page.leftColumnName || 'חלק 2'
    };

    return NextResponse.json({
      success: true,
      bookName: book.name,
      pageNumber: book.examplePage,
      image: page.imagePath || page.thumbnail, 
      text: contentData
    });

  } catch (error) {
    console.error('Error fetching example page:', error);
    return NextResponse.json({ success: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}