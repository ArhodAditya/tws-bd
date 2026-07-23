"use server";

import { createHash } from "node:crypto";
import { createClient } from "@/utils/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";

export type CloudinarySignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

export type SignResult =
  | { ok: true; data: CloudinarySignature }
  | { ok: false; message: string };

// Mint a short-lived signature for a direct-to-Cloudinary upload. This replaces
// the old unsigned upload preset: only a verified admin can obtain a signature,
// so anonymous users can no longer push files into the account. The API secret
// never leaves the server — only the (public) api_key, timestamp and signature
// are returned. Cloudinary rejects a signature once its timestamp is stale.
export async function signCloudinaryUpload(): Promise<SignResult> {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin(supabase))) {
    return { ok: false, message: "Admins only." };
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return {
      ok: false,
      message:
        "Cloudinary signed uploads aren't configured (set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET).",
    };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "tws";

  // Cloudinary signature: the signable params sorted as "key=value" and joined
  // with "&", the API secret appended, then SHA-1 hex. The client must send back
  // exactly these params (folder, timestamp) alongside the file.
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  return { ok: true, data: { cloudName, apiKey, timestamp, folder, signature } };
}
