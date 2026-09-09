import { useState } from "react";
import { useAuth } from "@clerk/expo";

const PRESIGN_DOWNLOAD_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/r2-presign-download`;

interface UseAttachmentDownloadResult {
  loading: boolean;
  getDownloadUrl: (key: string) => Promise<string>;
}

// Purohit booking attachments are private R2 objects (see
// supabase/migrations/20260909000003_private_purohit_booking_attachments.sql)
// — the stored `attachment_key` is not a URL and isn't reachable on its own.
// This mints a 5-minute signed download URL on demand, gated on the
// caller's Clerk admin token, mirroring how use-image-upload requests a
// presigned upload URL.
export function useAttachmentDownload(): UseAttachmentDownloadResult {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const getDownloadUrl = async (key: string): Promise<string> => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated.");
      }

      const res = await fetch(PRESIGN_DOWNLOAD_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ key })
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.downloadUrl) {
        throw new Error(data?.error || "Could not open the attachment.");
      }

      return data.downloadUrl as string;
    } finally {
      setLoading(false);
    }
  };

  return { loading, getDownloadUrl };
}
