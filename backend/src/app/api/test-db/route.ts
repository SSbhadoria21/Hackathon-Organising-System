import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET() {
  try {
    await dbConnect();
    const count = await User.countDocuments();
    return NextResponse.json({ status: 'Connected', usersCount: count });
  } catch (err: any) {
    return NextResponse.json({ status: 'Error', message: err.message }, { status: 500 });
  }
}
