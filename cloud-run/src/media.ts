import { bucket } from "./firebase.js";
export function assertOwnedStoragePath(userId: string, storagePath: string) {
  if (
    !storagePath.startsWith(`instagram/${userId}/`) ||
    storagePath.includes("..")
  )
    throw new Error("Invalid media path");
}
export async function createInstagramMediaUrl(storagePath: string) {
  const [url] = await bucket.file(storagePath).getSignedUrl({
    action: "read",
    expires: Date.now() + 15 * 60_000,
    version: "v4",
  });
  return url;
}
