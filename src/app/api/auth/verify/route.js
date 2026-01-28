import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.redirect(new URL('/library/auth/login?error=InvalidToken', request.url));
        }

        await connectDB();

        // חיפוש משתמש עם הטוקן הזה
        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            // טוקן לא תקין או שכבר השתמשו בו
            return NextResponse.redirect(new URL('/library/auth/login?error=InvalidToken', request.url));
        }

        // ביצוע האימות בשרת!
        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        // הפניה לדף הצלחה
        return NextResponse.redirect(new URL('/library/auth/verify-success', request.url));

    } catch (error) {
        console.error('Verification Error:', error);
        return NextResponse.redirect(new URL('/library/auth/login?error=ServerError', request.url));
    }
}