import nodemailer from 'nodemailer';
import { encryptToken } from '@/app/api/user/unsubscribe/route';
import User from '@/models/User'; 
import MailingList from '@/models/MailingList';
import dbConnect from '@/lib/db';

export async function sendBookNotification(bookName, bookSlug) {
    try {
        await dbConnect();
        const list = await MailingList.findOne({ listName: 'new_books_subscribers' });

        if (!list || !list.emails || list.emails.length === 0) {
            return { sent: false };
        }

        const validUsers = await User.find({
            email: { $in: list.emails },
            isVerified: true 
        }).select('email');

        if (validUsers.length === 0) {
            return { sent: false, error: 'No valid verified users found in the subscription list' };
        }

        const validEmails = validUsers.map(u => u.email);

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });

       const sendPromises = finalToSendList.map(async (email) => {
            const secureToken = encryptToken(email);
            const unsubUrl = `${process.env.NEXTAUTH_URL}/api/user/unsubscribe?t=${secureToken}&action=new_books`;
            
            const safeSlug = encodeURIComponent(bookSlug); 

            const emailHtml = `
            <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 40px; text-align: center;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                    <div style="background-color: #ffffff; padding: 20px; border-bottom: 3px solid #d4a373;">
                        <img src="https://www.otzaria.org/logo.png" alt="Otzaria Logo" style="width: 120px; height: auto;">
                        <h2 style="color: #d4a373; font-size: 20px; margin: 5px 0 0 0; font-weight: bold;">ספריית אוצריא</h2>
                    </div>
                    <div style="padding: 30px; color: #333333;">
                        <h1 style="color: #2c3e50; font-size: 24px; margin-bottom: 10px;">ספר חדש עלה לספריה!</h1>
                        <p style="font-size: 18px; line-height: 1.6;">
                            אנו שמחים לעדכן כי הספר 
                            <strong style="color: #d4a373;">"${bookName}"</strong>
                            נוסף כעת לספרייה וזמין לעריכה.
                        </p>
                        <div style="margin: 30px 0;">
                            <a href="${process.env.NEXTAUTH_URL}/library/book/${safeSlug}" style="background-color: #d4a373; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                כנס לספרייה לעריכה
                            </a>
                        </div>
                    </div>
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center;">
                        קיבלת הודעה זו כי נרשמת לעדכונים מאוצריא. 
                        <br>
                        <a href="${unsubUrl}" style="color: #999; text-decoration: underline;">הסרה מרשימת התפוצה<br>שים לב שלא תקבל עוד עדכונים על ספרים חדשים!</a>
                    </div>
                </div>
            </div>
            `;
            return transporter.sendMail({
                from: `"Otzaria Library" <${process.env.SMTP_FROM}>`,
                to: email, 
                replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_FROM,
                subject: `📚 ספר חדש בספרייה: ${bookName}`,
                headers: {
                    'List-Unsubscribe': `<${unsubUrl}>`,
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
                },
                html: `${emailHtml}`
            });
        });

        await Promise.allSettled(sendPromises);
        return { sent: true, count: validEmails.length };

    } catch (error) {
        console.error('Email Service Error:', error);
        return { sent: false, error: error.message };
    }
}