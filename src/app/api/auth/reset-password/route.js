import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET(request) {
    try {
        console.log('--- START TOKEN CHECK (GET) ---');
        
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        console.log('1. Token received from URL:', token);

        if (!token) {
            console.log('Error: No token provided');
            return NextResponse.json({ valid: false, message: 'חסר טוקן' }, { status: 400 });
        }

        await connectDB();

        // בדיקה: האם הטוקן בכלל קיים ב-DB (בלי לבדוק תאריך)?
        const userExists = await User.findOne({ resetPasswordToken: token });
        console.log('2. Does user exist with this token (ignoring date)?', userExists ? 'YES' : 'NO');
        
        if (userExists) {
            console.log('   -> Expiry in DB:', userExists.resetPasswordExpires);
            console.log('   -> Current Server Time:', new Date());
            console.log('   -> Is Expired?', new Date() > new Date(userExists.resetPasswordExpires) ? 'YES (Expired)' : 'NO (Valid)');
        }

        // השאילתה המקורית והמלאה
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            console.log('3. Final Result: User NOT found (Invalid or Expired)');
            return NextResponse.json({ valid: false, message: 'קישור לא תקין או שפג תוקפו' }, { status: 400 });
        }

        console.log('3. Final Result: User FOUND and VALID');
        return NextResponse.json({ valid: true });

    } catch (error) {
        console.error('Check Token Error:', error);
        return NextResponse.json({ valid: false, message: 'שגיאת שרת' }, { status: 500 });
    }
}

export async function POST(request) {
  try {
    console.log('--- START PASSWORD RESET (POST) ---');
    const { token, password } = await request.json();

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'הסיסמה חייבת להכיל לפחות 6 תווים.' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        console.log('POST Error: Invalid or expired token during submit');
        return NextResponse.json({ error: 'קישור לא תקין או שפג תוקפו' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log('Success: Password updated for user:', user.email);
    return NextResponse.json({ success: true, message: 'Password updated' });

  } catch (error) {
    console.error('Reset Password Error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}