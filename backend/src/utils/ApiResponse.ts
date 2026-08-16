import { NextResponse } from 'next/server';

export const successResponse = (data: any, message = 'Success', status = 200) => {
  return NextResponse.json({ success: true, message, data }, { status });
};

export const errorResponse = (message: string, status = 500, errors: any[] = []) => {
  return NextResponse.json({ success: false, message, errors }, { status });
};
