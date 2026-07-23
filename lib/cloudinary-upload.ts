import { signCloudinaryUpload } from "@/app/actions/cloudinary";

// Max upload size accepted client-side before we even ask Cloudinary — a cheap
// guard against someone using the (admin-only) uploader to push huge files.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

// Upload a single image to Cloudinary using a server-minted signature. The
// signature request is admin-gated (see app/actions/cloudinary.ts), so this only
// succeeds for signed-in admins. Posts straight to api.cloudinary.com, which the
// site CSP already allows under connect-src — no third-party widget script.
export async function uploadImageToCloudinary(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files can be uploaded.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image is too large (max 10 MB).");
  }

  const sig = await signCloudinaryUpload();
  if (!sig.ok) throw new Error(sig.message);
  const { cloudName, apiKey, timestamp, folder, signature } = sig.data;

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form }
  );

  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}).`);
  }

  const json = (await res.json()) as { secure_url?: string };
  if (!json.secure_url) {
    throw new Error("Upload succeeded but Cloudinary returned no URL.");
  }
  return json.secure_url;
}
