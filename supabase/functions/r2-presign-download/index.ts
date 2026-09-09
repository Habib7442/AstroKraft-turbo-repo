import { S3Client, GetObjectCommand } from "npm:@aws-sdk/client-s3@3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3";
import { jwtVerify, createRemoteJWKSet } from "npm:jose@5";

// Mints short-lived GET URLs for objects that must NOT be reachable through
// the public R2 custom domain (customer-submitted purohit booking
// attachments — invitations, horoscope/muhurat details, addresses). Admin
// gated the same way r2-presign gates uploads: a valid Clerk JWT with
// metadata.role === "admin".
const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID")!;
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")!;
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME")!;
const CLERK_JWKS_URL = Deno.env.get("CLERK_JWKS_URL")!;

// Every caller of this function so far only ever needs purohit booking
// attachments. Restricting to this prefix keeps the function from becoming
// a general "read any object in the bucket" oracle for an admin token.
const ALLOWED_KEY_PREFIX = "purohit-uploads/";

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

  let body: { key?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { key } = body;
  if (!key || typeof key !== "string" || !key.startsWith(ALLOWED_KEY_PREFIX)) {
    return jsonResponse({ error: "A valid attachment key is required" }, 400);
  }

  try {
    const command = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key });
    const downloadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
    return jsonResponse({ downloadUrl });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Failed to generate download URL" }, 500);
  }
});
