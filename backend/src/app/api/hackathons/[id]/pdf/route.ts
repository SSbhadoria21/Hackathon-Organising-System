
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { cloudinary } from '@/lib/upload';
import AdmZip from 'adm-zip';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: 'Hackathon ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Check Hackathon by ID or slug
    let hackathon: any = await Hackathon.findById(id).select('eventName problemStatementPdfUrl').lean();
    if (!hackathon) {
      hackathon = await Hackathon.findOne({ slug: id }).select('eventName problemStatementPdfUrl').lean();
    }

    if (!hackathon || !hackathon.problemStatementPdfUrl) {
      return NextResponse.json({ message: 'Problem statement PDF not found' }, { status: 404 });
    }

    const pdfUrl = hackathon.problemStatementPdfUrl;

    // Check if it's a Cloudinary URL
    const isCloudinary = pdfUrl.includes('cloudinary.com');
    if (isCloudinary) {
      // Extract public_id from URL: e.g. .../brevitas/documents/q1wc0rlhmb9z47751dex.pdf -> brevitas/documents/q1wc0rlhmb9z47751dex
      const match = pdfUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
      if (match && match[1]) {
        const publicId = match[1];
        try {
          // Generate zip archive download URL using Cloudinary credentials
          const archiveUrl = cloudinary.utils.download_archive_url({
            public_ids: [publicId],
            resource_type: 'image',
            target_format: 'zip',
          });

          const res = await fetch(archiveUrl);
          if (res.ok) {
            const arrayBuf = await res.arrayBuffer();
            const zip = new AdmZip(Buffer.from(arrayBuf));
            const zipEntries = zip.getEntries();
            const pdfEntry = zipEntries.find((e) => e.entryName.toLowerCase().endsWith('.pdf')) || zipEntries[0];

            if (pdfEntry) {
              const pdfBuffer = pdfEntry.getData();
              const safeName = (hackathon.eventName || 'problem-statement')
                .replace(/[^a-zA-Z0-9_-]/g, '_');

              return new NextResponse(new Uint8Array(pdfBuffer), {
                status: 200,
                headers: {
                  'Content-Type': 'application/pdf',
                  'Content-Disposition': `inline; filename="${safeName}.pdf"`,
                  'Cache-Control': 'public, max-age=3600',
                },
              });
            }
          }
        } catch (cldErr) {
          console.error('Cloudinary zip download error:', cldErr);
        }
      }
    }

    // Fallback: redirect directly to the URL
    return NextResponse.redirect(pdfUrl);
  } catch (err: any) {
    console.error('Download PDF route error:', err);
    return NextResponse.json({ message: 'Failed to download PDF', error: err?.message, stack: err?.stack }, { status: 500 });
  }
}
