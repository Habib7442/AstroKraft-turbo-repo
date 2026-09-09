import { NextRequest, NextResponse } from "next/server";
import { createR2Client, generatePresignedUploadUrl } from "@astrokraft/storage";

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_NAME_LENGTH = 200;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const fileName = body?.fileName;
    const contentType = body?.contentType;
    const fileSize = body?.fileSize;

    if (!fileName || typeof fileName !== "string" || fileName.length > MAX_FILE_NAME_LENGTH) {
      return NextResponse.json({ error: "A valid file name is required." }, { status: 400 });
    }
    if (!contentType || !ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WEBP, or PDF files are allowed." }, { status: 400 });
    }
    if (typeof fileSize !== "number" || !Number.isInteger(fileSize) || fileSize <= 0 || fileSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File must be smaller than 10 MB." }, { status: 400 });
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
    const key = `purohit-uploads/${Date.now()}-${safeName}`;

    const client = createR2Client({
      accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID!,
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!
    });

    const uploadUrl = await generatePresignedUploadUrl({
      client,
      bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      key,
      contentType,
      contentLength: fileSize,
      expiresIn: 300
    });

    // No public URL: attachments are private customer documents (wedding
    // invitations, horoscope/muhurat details), not public assets. The
    // client only ever sees the object key; a signed download URL is minted
    // later, on demand, for an authenticated admin (r2-presign-download
    // edge function) rather than baked into the booking record forever.
    return NextResponse.json({ uploadUrl, key });
  } catch (err: any) {
    console.error("purohit-bookings upload-url error:", err);
    return NextResponse.json({ error: "Failed to prepare upload." }, { status: 500 });
  }
}
