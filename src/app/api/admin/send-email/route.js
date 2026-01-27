import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { encryptToken } from '@/app/api/user/unsubscribe/route';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { to, subject, text, html, bcc, cc } = body;

        // ולידציה
        if ((!to && !bcc) || !subject) {
            return NextResponse.json({ error: 'Missing recipients or subject' }, { status: 400 });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: { rejectUnauthorized: false }
        });

        // איחוד כל הנמענים לרשימה אחת שטוחה כדי לשלוח לכל אחד בנפרד
        const allRecipients = new Set();
        if (to) (Array.isArray(to) ? to : [to]).forEach(e => allRecipients.add(e.trim()));
        if (bcc) (Array.isArray(bcc) ? bcc : [bcc]).forEach(e => allRecipients.add(e.trim()));
        if (cc) (Array.isArray(cc) ? cc : [cc]).forEach(e => allRecipients.add(e.trim()));

        const recipientsArray = Array.from(allRecipients);

        // שליחה פרטנית
        const sendResults = await Promise.allSettled(recipientsArray.map(async (email) => {
            const secureToken = encryptToken(email);
            const unsubUrl = `${process.env.NEXTAUTH_URL}/api/user/unsubscribe?t=${secureToken}`;

            const individualHtml = (html || text) + `
                <div dir="rtl" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center; font-family: sans-serif;">
                    קיבלת הודעה זו ממערכת אוצריא.
                    <br>
                    <a href="${unsubUrl}" style="color: #999; text-decoration: underline;">להסרה מקבלת תזכורות במייל</a>
                </div>
            `;

            return transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: email, // נשלח רק לנמען הזה
                subject: subject,
                headers: {
                    'List-Unsubscribe': `<${unsubUrl}>`,
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
                },
                html: individualHtml,
                text: `${text}\n\nלהסרה: ${unsubUrl}`
            });
        }));

        // לוג שגיאות מפורט לקונסול (כדי שתראה למה זה נכשל)
        sendResults.forEach((result, idx) => {
            if (result.status === 'rejected') {
                console.error(`❌ Failed to send to ${recipientsArray[idx]}:`, result.reason);
            }
        });

        const successful = sendResults.filter(r => r.status === 'fulfilled').length;
        const failed = sendResults.filter(r => r.status === 'rejected').length;

        console.log(`Email process finished. Success: ${successful}, Failed: ${failed}`);

        // אם הכל נכשל, נחזיר שגיאה ל-UI
        if (successful === 0 && recipientsArray.length > 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'כל שליחות המיילים נכשלו. בדוק את הגדרות ה-SMTP בשרת.' 
            }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            details: { successful, failed }
        });

    } catch (error) {
        console.error('Main Email API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}