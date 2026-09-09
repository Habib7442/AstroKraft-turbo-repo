import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  customDomain?: string;
}

export function createR2Client(config: Omit<R2Config, "bucketName" | "customDomain">): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });
}

export async function generatePresignedUploadUrl(params: {
  client: S3Client;
  bucket: string;
  key: string;
  contentType: string;
  contentLength?: number;
  expiresIn?: number;
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: params.bucket,
    Key: params.key,
    ContentType: params.contentType,
    // Signing ContentLength forces it into the presigned URL's signed
    // headers, so the actual PUT must carry a matching Content-Length or
    // R2 rejects the signature. This is the only way to bound the size of
    // an object uploaded via presigned PUT (R2/S3 has no equivalent of a
    // POST policy's content-length-range for PUT) — a max-size check made
    // only when minting the URL is unenforceable, since nothing stops the
    // holder of that URL from streaming more bytes than they declared.
    ...(params.contentLength != null ? { ContentLength: params.contentLength } : {})
  });

  return getSignedUrl(params.client, command, {
    expiresIn: params.expiresIn ?? 3600
  });
}

export function getR2PublicUrl(key: string, customDomain = "https://media.astrokraft.online"): string {
  if (key.startsWith("http://") || key.startsWith("https://")) {
    return key;
  }
  return `${customDomain.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}
