import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File, UploadTask } from "expo-file-system";
import { useAuth } from "@clerk/expo";

const PRESIGN_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/r2-presign`;
const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB — defensive fallback; compression below should keep files well under this
const MAX_DIMENSION = 1600; // plenty for product photography; Next.js re-optimizes per-viewport on top of this anyway
const JPEG_QUALITY = 0.8;

interface UseImageUploadResult {
  uploading: boolean;
  pickAndUploadImage: (folder: string, maxSizeBytes?: number) => Promise<string | null>;
}

export function useImageUpload(): UseImageUploadResult {
  const { getToken } = useAuth();
  const [uploading, setUploading] = useState(false);

  const pickAndUploadImage = async (
    folder: string,
    maxSizeBytes: number = DEFAULT_MAX_SIZE_BYTES
  ): Promise<string | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Photo library permission is required to select an image.");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];

    setUploading(true);
    try {
      // Always resize (if needed) and re-encode as JPEG client-side, regardless of the
      // original format or size. This is what actually prevents multi-MB PNGs from ever
      // reaching R2 — the old size-cap check let anything under 5MB through unmodified,
      // which is how uncompressed photos ended up crashing Next's image optimizer.
      let context = ImageManipulator.manipulate(asset.uri);
      const width = asset.width ?? 0;
      const height = asset.height ?? 0;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        context = width >= height ? context.resize({ width: MAX_DIMENSION }) : context.resize({ height: MAX_DIMENSION });
      }
      const rendered = await context.renderAsync();
      const compressed = await rendered.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });

      const contentType = "image/jpeg";
      const fileName = `image-${Date.now()}.jpg`;

      const file = new File(compressed.uri);
      const fileSizeBytes = file.size ?? 0;

      if (fileSizeBytes > maxSizeBytes) {
        const actualMb = (fileSizeBytes / (1024 * 1024)).toFixed(1);
        const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
        throw new Error(
          `This image is still ${actualMb}MB after compression, which is over the ${maxMb}MB limit. Choose a different image.`
        );
      }

      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated.");
      }

      const presignResponse = await fetch(PRESIGN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ fileName, contentType, folder })
      });

      if (!presignResponse.ok) {
        const rawBody = await presignResponse.text();
        let detail = rawBody;
        try {
          detail = JSON.parse(rawBody).error || rawBody;
        } catch {
          // rawBody wasn't JSON — use it as-is
        }
        throw new Error(`Upload setup failed (${presignResponse.status}): ${detail || "no details returned"}`);
      }

      const { uploadUrl, publicUrl } = (await presignResponse.json()) as {
        uploadUrl: string;
        publicUrl: string;
      };

      const uploadTask = new UploadTask(file, uploadUrl, {
        httpMethod: "PUT",
        headers: { "Content-Type": contentType }
      });
      const uploadResult = await uploadTask.uploadAsync();

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error(
          `Upload to storage failed (${uploadResult.status}): ${uploadResult.body || "no details returned"}`
        );
      }

      return publicUrl;
    } finally {
      setUploading(false);
    }
  };

  return { uploading, pickAndUploadImage };
}
