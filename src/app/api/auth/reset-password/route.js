import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
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
        return NextResponse.json({ error: 'קישור לא תקין או שפג תוקפו' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json({ success: true, message: 'Password updated' });

  } catch (error) {
    console.error('Reset Password Error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
