import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3@3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3";
import { jwtVerify, createRemoteJWKSet } from "npm:jose@5";

const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID")!;
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")!;
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME")!;
const R2_PUBLIC_DOMAIN = Deno.env.get("R2_PUBLIC_DOMAIN") ?? "https://media.astrokraft.online";
const CLERK_JWKS_URL = Deno.env.get("CLERK_JWKS_URL")!;

const clerkJwks = createRemoteJWKSet(new URL(CLERK_JWKS_URL));

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type"
};

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return jsonResponse({ error: "Missing authorization" }, 401);
  }

  let role: unknown;
  try {
    const { payload } = await jwtVerify(token, clerkJwks);
    role = (payload.metadata as { role?: string } | undefined)?.role;
  } catch (err) {
    return jsonResponse({ error: `Invalid token: ${err instanceof Error ? err.message : "verification failed"}` }, 401);
  }

  if (role !== "admin") {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  let body: { fileName?: string; contentType?: string; folder?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { fileName, contentType, folder } = body;
  if (!fileName || !contentType) {
    return jsonResponse({ error: "fileName and contentType are required" }, 400);
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const key = `${folder ?? "uploads"}/${Date.now()}-${safeName}`;

  try {
    const command = new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
    const publicUrl = `${R2_PUBLIC_DOMAIN.replace(/\/$/, "")}/${key}`;

    return jsonResponse({ uploadUrl, publicUrl, key });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Failed to generate upload URL" }, 500);
  }
});
