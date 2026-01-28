import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db';
import User from '@/models/User';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { email } = await request.json();
    await connectDB();

    // NOTE: For rate limiting to work correctly across multiple requests and serverless environments,
    // 'rateLimitStore', 'ONE_HOUR_MS', 'ONE_DAY_MS', and 'MAX_DAILY_REQUESTS' must be defined globally
    // outside this function (e.g., at the top of this file). The following logic assumes these variables are accessible.

    const now = Date.now();
    const emailKey = email.toLowerCase();
    let userRateData = rateLimitStore.get(emailKey);

    // Initialize or reset daily count if the daily window has passed
    if (!userRateData || (now - userRateData.dailyWindowStart > ONE_DAY_MS)) {
      userRateData = {
        lastRequest: 0,
        dailyCount: 0,
        dailyWindowStart: now,
      };
    }

    // Check if an hour has passed since the last request
    if (now - userRateData.lastRequest < ONE_HOUR_MS) {
      return NextResponse.json({ success: false, message: 'ניתן לשלוח בקשה לאיפוס סיסמה פעם בשעה בלבד.' }, { status: 429 }); // 429 Too Many Requests
    }

    // Check if the daily request limit has been reached
    if (userRateData.dailyCount >= MAX_DAILY_REQUESTS) {
      return NextResponse.json({ success: false, message: 'חרגת ממספר הבקשות המקסימלי לאיפוס סיסמה ביום. נסה שוב מחר.' }, { status: 429 });
    }

    // Update rate limit data for this successful request
    userRateData.lastRequest = now;
    userRateData.dailyCount++;
    rateLimitStore.set(emailKey, userRateData);

    const user = await User.findOne({ email: emailKey });
    if (!user) {
      // Still return success: true to avoid email enumeration attacks, but don't send email
      return NextResponse.json({ success: true, message: 'אם המייל קיים, נשלחה הודעה.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + ONE_HOUR_MS; // Token valid for 1 hour

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