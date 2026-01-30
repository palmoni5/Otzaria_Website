import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; 
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 });
    }

    const { email: newEmail } = await request.json();

    if (!newEmail || !newEmail.includes('@')) {
      return NextResponse.json({ error: 'כתובת אימייל לא תקינה' }, { status: 400 });
    }

    await connectDB();

    const emailOwner = await User.findOne({ email: newEmail });
    if (emailOwner && emailOwner.name !== session.user.name) {
      return NextResponse.json(
        { error: 'כתובת המייל הזו כבר תפוסה על ידי משתמש אחר' }, 
        { status: 409 }
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      { name: session.user.name },
      { 
        $set: {
            email: newEmail,
            isVerified: false,
            verificationToken: null,
            verificationTokenExpiry: null
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });
    }

    return NextResponse.json({ 
        message: 'המייל עודכן בהצלחה', 
        user: { email: updatedUser.email } 
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating email:", error);
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}