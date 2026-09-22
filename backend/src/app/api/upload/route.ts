import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/withAuth';
import { uploadBufferToCloudinary } from '@/lib/upload';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'general';

    if (!file) {
      return errorResponse('No file provided', 400);
    }

    const allowedFolders = ['banners', 'logos', 'documents', 'sponsors', 'avatars', 'general'];
    const targetFolder = allowedFolders.includes(folder) ? folder : 'general';

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let resourceType: 'image' | 'raw' | 'auto' = 'auto';
    if (file.type.startsWith('image/')) {
      resourceType = 'image';
    } else if (file.type === 'application/pdf') {
      resourceType = 'auto';
    }

    const result = await uploadBufferToCloudinary(buffer, targetFolder, resourceType);

    return successResponse(
      {
        url: result.url,
        publicId: result.publicId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
      'File uploaded',
      201
    );
  } catch (err: any) {
    console.error('Upload error:', err);
    return errorResponse('Upload failed', 500);
  }
}
