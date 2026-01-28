import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db';
import User from '@/models/User';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { email } = await request.json();
    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ success: true, message: 'אם המייל קיים, נשלחה הודעה.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + (60 * 60 * 1000);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/library/auth/reset-password/${resetToken}`;

    const message = {
        from: `"Otzaria Support" <${process.env.SMTP_FROM}>`,
        to: user.email,
        subject: 'איפוס סיסמה - ספריית אוצריא',
        html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>בקשה לאיפוס סיסמה</h2>
                <p>קיבלנו בקשה לאפס את הסיסמה לחשבון שלך.</p>
                <p>לחץ על הכפתור למטה כדי ליצור סיסמה חדשה:</p>
                <a href="${resetUrl}" style="background-color: #d4a373; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">איפוס סיסמה</a>
                <p>הקישור תקף לשעה אחת בלבד.</p>
                <p>אם לא ביקשת זאת, אתה יכול להתעלם מהודעה זו.</p>
            </div>
        `
    };

    await transporter.sendMail(message);

    return NextResponse.json({ success: true, message: 'אם המייל קיים, נשלחה הודעה.' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}