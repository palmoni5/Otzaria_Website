import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Page from '@/models/Page';
import Book from '@/models/Book';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        await connectDB();

        const page = await Page.findById(id).populate('book');
        
        if (!page) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        let textContent = '';
        if (page.isTwoColumns) {
            textContent = `--- ${page.rightColumnName} ---\n${page.rightColumn || ''}\n\n--- ${page.leftColumnName} ---\n${page.leftColumn || ''}`;
        } else {
            textContent = page.content || '';
        }

        const bookName = page.book ? (page.book.name || page.book.title || 'book') : 'unknown';
        
        const filename = `${bookName}-page-${page.pageNumber}.txt`;

        return new NextResponse(textContent, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`
            }
        });

    } catch (error) {
        console.error('Download error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}