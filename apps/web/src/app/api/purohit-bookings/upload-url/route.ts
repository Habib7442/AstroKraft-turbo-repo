import { NextRequest, NextResponse } from "next/server";
import { createR2Client, generatePresignedUploadUrl, getR2PublicUrl } from "@astrokraft/storage";

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_NAME_LENGTH = 200;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const fileName = body?.fileName;
    const contentType = body?.contentType;

    if (!fileName || typeof fileName !== "string" || fileName.length > MAX_FILE_NAME_LENGTH) {
      return NextResponse.json({ error: "A valid file name is required." }, { status: 400 });
    }
    if (!contentType || !ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WEBP, or PDF files are allowed." }, { status: 400 });
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
      expiresIn: 300
    });

    const publicUrl = getR2PublicUrl(key, process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN);

    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch (err: any) {
    console.error("purohit-bookings upload-url error:", err);
    return NextResponse.json({ error: err.message || "Failed to prepare upload." }, { status: 500 });
  }
}
