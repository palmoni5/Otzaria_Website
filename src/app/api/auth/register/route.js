import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request) {
  try {
    // 1. אבטחה: Rate Limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const isAllowed = checkRateLimit(ip, 'register', 5, 'hour');
    
    if (!isAllowed) {
        return NextResponse.json(
            { error: 'יותר מדי ניסיונות הרשמה. נסה שוב מאוחר יותר.' }, 
            { status: 429 }
        );
    }

    const { name, email, password, acceptReminders } = await request.json();
    
    if (!acceptReminders) {
      return NextResponse.json(
        { error: 'חובה לאשר את קבלת התזכורות כדי להירשם' }, 
        { status: 400 }
      );
    }

    await connectDB();

    // בדיקה אם משתמש קיים
    const existingUser = await User.findOne({ $or: [{ email }, { name }] });
    if (existingUser) {
      return NextResponse.json({ error: 'משתמש עם אימייל או שם זה כבר קיים' }, { status: 400 });
    }

    const hashedPassword = await hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      points: 0,
      acceptReminders: acceptReminders
    });

    return NextResponse.json({ message: 'המשתמש נוצר בהצלחה', user: { id: user._id, name: user.name, email: user.email } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
