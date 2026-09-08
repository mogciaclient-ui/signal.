import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebase.js";
import { readToken } from "./tokens.js";
import { publishImage } from "./instagram/publishing.js";
import { createInstagramMediaUrl } from "./media.js";
export async function publishDuePosts() {
  const due = await db
    .collection("scheduledPosts")
    .where("status", "==", "scheduled")
    .where("scheduledAt", "<=", new Date())
    .limit(20)
    .get();
  const results = await Promise.allSettled(
    due.docs.map(async (doc) => {
      const claimed = await db.runTransaction(async (tx) => {
        const fresh = await tx.get(doc.ref);
        const data = fresh.data();
        if (!fresh.exists || data?.status !== "scheduled") return null;
        tx.update(doc.ref, {
          status: "publishing",
          publishAttempts: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return data;
      });
      if (!claimed) return;
      try {
        const accountDoc = await db
          .collection("socialAccounts")
          .doc(claimed.socialAccountId)
          .get();
        const account = accountDoc.data();
        if (!account?.tokenReference || !account?.platformAccountId)
          throw new Error("Instagram account is not connected");
        const token = await readToken(accountDoc.id, account.tokenReference);
        const imageUrl = await createInstagramMediaUrl(claimed.storagePath);
        const result = await publishImage(
          account.platformAccountId,
          imageUrl,
          claimed.caption || "",
          token,
        );
        await doc.ref.update({
          status: "published",
          platformPostId: result.id,
          publishedAt: FieldValue.serverTimestamp(),
          lastError: null,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch (error) {
        await doc.ref.update({
          status: "failed",
          lastError:
            error instanceof Error
              ? error.message.slice(0, 500)
              : "Publishing failed",
          updatedAt: FieldValue.serverTimestamp(),
        });
        throw error;
      }
    }),
  );
  return {
    checked: due.size,
    published: results.filter((x) => x.status === "fulfilled").length,
    failed: results.filter((x) => x.status === "rejected").length,
  };
}
