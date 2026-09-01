import { FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase.js";
import { instagramFetch } from "./client.js";
import type { ApiList, InstagramMedia, InsightMetric } from "./types.js";

const mediaMetrics = ["reach", "views", "likes", "comments", "saved", "shares"];
const accountMetrics = [
  "reach",
  "views",
  "accounts_engaged",
  "total_interactions",
  "follows_and_unfollows",
];

export async function syncInstagram(
  userId: string,
  accountId: string,
  platformAccountId: string,
  token: string,
) {
  const startedAt = Date.now();
  let itemCount = 0;
  try {
    const fields =
      "id,media_type,media_product_type,media_url,thumbnail_url,caption,permalink,timestamp";
    const list = await instagramFetch<ApiList<InstagramMedia>>(
      `${platformAccountId}/media?fields=${encodeURIComponent(fields)}&limit=100`,
      token,
    );
    const batch = db.batch();
    for (const media of list.data) {
      itemCount++;
      const ref = db.collection("socialPosts").doc(media.id);
      batch.set(
        ref,
        {
          userId,
          platform: "instagram",
          socialAccountId: accountId,
          platformPostId: media.id,
          mediaType:
            media.media_product_type === "REELS" ? "REELS" : media.media_type,
          mediaUrl: media.media_url || null,
          thumbnailUrl: media.thumbnail_url || null,
          caption: media.caption || null,
          permalink: media.permalink || null,
          publishedAt: media.timestamp,
          syncedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
    await batch.commit();
    await Promise.all(
      list.data.map((media) =>
        syncInsights(userId, accountId, media.id, "post", mediaMetrics, token),
      ),
    );
    await syncInsights(
      userId,
      accountId,
      platformAccountId,
      "account",
      accountMetrics,
      token,
    );
    await db.collection("socialAccounts").doc(accountId).update({
      lastSyncedAt: FieldValue.serverTimestamp(),
      connectionStatus: "connected",
      updatedAt: FieldValue.serverTimestamp(),
    });
    await db.collection("syncLogs").add({
      platform: "instagram",
      type: "posts",
      status: "success",
      startedAt,
      finishedAt: Date.now(),
      itemCount,
      errorCode: null,
    });
    return { itemCount };
  } catch (error) {
    await db.collection("syncLogs").add({
      platform: "instagram",
      type: "posts",
      status: "failed",
      startedAt,
      finishedAt: Date.now(),
      itemCount,
      errorCode: error instanceof Error ? error.name : "UNKNOWN",
    });
    throw error;
  }
}

async function syncInsights(
  userId: string,
  accountId: string,
  objectId: string,
  scope: "account" | "post",
  metrics: string[],
  token: string,
) {
  const params = new URLSearchParams({ metric: metrics.join(",") });
  if (scope === "account") {
    params.set("period", "day");
    params.set("metric_type", "total_value");
  }
  try {
    const response = await instagramFetch<ApiList<InsightMetric>>(
      `${objectId}/insights?${params}`,
      token,
    );
    const batch = db.batch();
    for (const metric of response.data) {
      const value = metric.total_value?.value ?? metric.values?.at(-1)?.value;
      if (value === undefined) continue;
      const snapshotDate = new Date().toISOString().slice(0, 10);
      const ref = db
        .collection("socialInsights")
        .doc(`${scope}-${objectId}-${metric.name}-${snapshotDate}`);
      batch.set(
        ref,
        {
          userId,
          platform: "instagram",
          socialAccountId: accountId,
          socialPostId: scope === "post" ? objectId : null,
          scope,
          metric: metric.name,
          value,
          snapshotDate,
          fetchedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
    await batch.commit();
  } catch {
    /* Metric availability varies by media/account; absence is not stored as zero. */
  }
}
