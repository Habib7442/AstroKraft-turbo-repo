import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN;

const MAX_DIMENSION = 1920; // banners are wide hero images, keep more resolution than product thumbs
const JPEG_QUALITY = 80;
const SIZE_THRESHOLD_BYTES = 500 * 1024;

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY }
});

async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...options.headers
    }
  });
  if (!res.ok) throw new Error(`Supabase ${path} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  const banners = await supabaseFetch("promo_banners?select=id,title,image_url");

  for (const banner of banners) {
    const url = banner.image_url;
    if (!url) continue;

    const headRes = await fetch(url, { method: "HEAD" });
    const size = parseInt(headRes.headers.get("content-length") || "0", 10);

    if (size < SIZE_THRESHOLD_BYTES) {
      console.log(`SKIP ${banner.title.padEnd(35)} already ${(size / 1024).toFixed(0)}KB`);
      continue;
    }

    const imgRes = await fetch(url);
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    const compressed = await sharp(buffer)
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

    const newKey = `banners/${Date.now()}-${banner.id}.jpg`;
    await r2.send(
      new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: newKey, Body: compressed, ContentType: "image/jpeg" })
    );

    const newUrl = `${R2_PUBLIC_DOMAIN}/${newKey}`;
    await supabaseFetch(`promo_banners?id=eq.${banner.id}`, {
      method: "PATCH",
      body: JSON.stringify({ image_url: newUrl })
    });

    console.log(
      `OK   ${banner.title.padEnd(35)} ${(size / 1024 / 1024).toFixed(2)}MB -> ${(compressed.length / 1024).toFixed(0)}KB`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
