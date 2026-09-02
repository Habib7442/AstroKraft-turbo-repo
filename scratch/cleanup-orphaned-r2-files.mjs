// Finds R2 objects (under products/, banners/, categories/) that are no longer
// referenced by any row in Supabase, and deletes them. Cross-checks against the
// CURRENT live data rather than a remembered list, so it's safe regardless of
// what else may have changed since the recompression pass.

import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN;
const DRY_RUN = process.env.DRY_RUN === "1";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY }
});

async function supabaseFetch(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
  });
  if (!res.ok) throw new Error(`Supabase ${path} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

function keyFromUrl(url) {
  if (!url || !url.startsWith(R2_PUBLIC_DOMAIN)) return null;
  return url.slice(R2_PUBLIC_DOMAIN.length + 1); // strip domain + leading slash
}

async function listAllKeys(prefix) {
  const keys = [];
  let continuationToken;
  do {
    const res = await r2.send(
      new ListObjectsV2Command({ Bucket: R2_BUCKET_NAME, Prefix: prefix, ContinuationToken: continuationToken })
    );
    for (const obj of res.Contents ?? []) keys.push(obj.Key);
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);
  return keys;
}

async function main() {
  const [products, banners, categories] = await Promise.all([
    supabaseFetch("products?select=images"),
    supabaseFetch("promo_banners?select=image_url"),
    supabaseFetch("categories?select=image_url")
  ]);

  const referenced = new Set();
  for (const p of products) for (const url of p.images ?? []) {
    const key = keyFromUrl(url);
    if (key) referenced.add(key);
  }
  for (const b of banners) {
    const key = keyFromUrl(b.image_url);
    if (key) referenced.add(key);
  }
  for (const c of categories) {
    const key = keyFromUrl(c.image_url);
    if (key) referenced.add(key);
  }

  console.log(`Currently referenced files: ${referenced.size}`);

  const allKeys = [
    ...(await listAllKeys("products/")),
    ...(await listAllKeys("banners/")),
    ...(await listAllKeys("categories/"))
  ];

  const orphaned = allKeys.filter((key) => !referenced.has(key));

  console.log(`R2 objects found: ${allKeys.length}`);
  console.log(`Orphaned (unreferenced) objects: ${orphaned.length}\n`);
  orphaned.forEach((k) => console.log("  -", k));

  if (orphaned.length === 0) {
    console.log("\nNothing to delete.");
    return;
  }

  if (DRY_RUN) {
    console.log("\nDRY RUN — nothing deleted. Re-run without DRY_RUN=1 to actually delete.");
    return;
  }

  // DeleteObjects supports up to 1000 keys per request.
  for (let i = 0; i < orphaned.length; i += 1000) {
    const batch = orphaned.slice(i, i + 1000);
    await r2.send(
      new DeleteObjectsCommand({
        Bucket: R2_BUCKET_NAME,
        Delete: { Objects: batch.map((Key) => ({ Key })) }
      })
    );
  }

  console.log(`\nDeleted ${orphaned.length} orphaned object(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
