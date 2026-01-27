import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';

const MailingListSchema = new mongoose.Schema({
  listName: { type: String, required: true, unique: true },
  emails: [{ type: String }]
});

const MailingList = mongoose.models.MailingList || mongoose.model('MailingList', MailingListSchema);

const LIST_NAME = 'new_books_subscribers';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const list = await MailingList.findOne({ listName: LIST_NAME });
    const userEmail = session.user.email;
    
    const isSubscribed = list ? list.emails.includes(userEmail) : false;

    return NextResponse.json({ success: true, isSubscribed });

  } catch (error) {
    console.error('Notification API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();
    const userEmail = session.user.email;

    await connectDB();

    let list = await MailingList.findOne({ listName: LIST_NAME });
    if (!list) {
      list = await MailingList.create({ listName: LIST_NAME, emails: [] });
    }

    if (action === 'subscribe') {
      await MailingList.updateOne(
        { listName: LIST_NAME },
        { $addToSet: { emails: userEmail } }
      );
    } else if (action === 'unsubscribe') {
      await MailingList.updateOne(
        { listName: LIST_NAME },
        { $pull: { emails: userEmail } }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Notification API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
