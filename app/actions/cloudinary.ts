"use server";

import { createHash } from "node:crypto";
import { createClient } from "@/utils/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import { rateLimit } from "@/lib/rate-limit";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isCurrentUserAdmin(supabase))) {
    return { ok: false, message: "Admins only." };
  }

  // Throttle signature spam: 60 per 10 minutes per admin. A gallery upload
  // legitimately bursts (one signature per file), so the window is generous.
  const rl = rateLimit(`cloudinary-sign:${user.id}`, 60, 10 * 60_000);
  if (!rl.ok) {
    return {
      ok: false,
      message: `Too many uploads — try again in ${rl.retryAfterSeconds}s.`,
    };
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
