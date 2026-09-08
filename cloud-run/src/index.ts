import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { FieldValue } from "firebase-admin/firestore";
import { config } from "./config.js";
import { auth, bucket, db } from "./firebase.js";
import {
  authorizationUrl,
  consumeOAuthState,
  createOAuthState,
  exchangeCode,
  fetchAccount,
} from "./instagram/oauth.js";
import { publishImage } from "./instagram/publishing.js";
import { syncInstagram } from "./instagram/sync.js";
import { publishDuePosts } from "./scheduled.js";
import { deleteToken, readToken, saveToken } from "./tokens.js";
import { assertOwnedStoragePath, createInstagramMediaUrl } from "./media.js";
const app = express();
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", config.appUrl);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: "1mb" }));
type AuthedRequest = Request & {
  userId?: string;
  actorUserId?: string;
  reviewer?: boolean;
};
async function requireUser(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer "))
      return res.status(401).json({ error: "Authentication required" });
    const decoded = await auth.verifyIdToken(header.slice(7));
    const reviewOwnerId = decoded.reviewOwnerId;
    req.actorUserId = decoded.uid;
    req.reviewer = typeof reviewOwnerId === "string";
    req.userId = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: "Authentication required" });
  }
}
async function accountForUser(userId: string) {
  const snapshot = await db
    .collection("socialAccounts")
    .where("userId", "==", userId)
    .where("platform", "==", "instagram")
    .limit(1)
    .get();
  if (snapshot.empty) throw new Error("Instagram account is not connected");
  return snapshot.docs[0];
}
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/oauth/start", requireUser, async (req: AuthedRequest, res, next) => {
  try {
    const state = await createOAuthState(req.userId!);
    res.json({ url: authorizationUrl(state) });
  } catch (e) {
    next(e);
  }
});
app.get("/oauth/callback", async (req, res, next) => {
  try {
    if (
      typeof req.query.code !== "string" ||
      typeof req.query.state !== "string"
    )
      return res.status(400).send("Invalid OAuth callback");
    const userId = await consumeOAuthState(req.query.state);
    const token = await exchangeCode(req.query.code);
    const { account, pageId, pageAccessToken } = await fetchAccount(
      token.accessToken,
    );
    const socialAccountId = `${userId}--${account.id}`;
    const tokenReference = await saveToken(socialAccountId, pageAccessToken);
    await db
      .collection("socialAccounts")
      .doc(socialAccountId)
      .set(
        {
          userId,
          platform: "instagram",
          platformAccountId: account.id,
          facebookPageId: pageId,
          username: account.username,
          accountType: account.account_type || "BUSINESS",
          connectionStatus: "connected",
          tokenReference,
          tokenExpiresAt: Date.now() + token.expiresIn * 1000,
          connectedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          lastSyncedAt: null,
        },
        { merge: true },
      );
    res.redirect(`${config.appUrl}/settings/instagram?connected=1`);
  } catch (e) {
    next(e);
  }
});
app.post("/sync", requireUser, async (req: AuthedRequest, res, next) => {
  try {
    const doc = await accountForUser(req.userId!);
    const account = doc.data();
    res.json(
      await syncInstagram(
        req.userId!,
        doc.id,
        account.platformAccountId,
        await readToken(doc.id, account.tokenReference),
      ),
    );
  } catch (e) {
    next(e);
  }
});
app.post("/publish", requireUser, async (req: AuthedRequest, res, next) => {
  try {
    const { storagePath, caption = "" } = req.body as {
      storagePath?: string;
      caption?: string;
    };
    if (!storagePath)
      return res.status(400).json({ error: "投稿画像が必要です" });
    assertOwnedStoragePath(req.userId!, storagePath);
    const doc = await accountForUser(req.userId!);
    const account = doc.data();
    const imageUrl = await createInstagramMediaUrl(storagePath);
    const result = await publishImage(
      account.platformAccountId,
      imageUrl,
      caption,
      await readToken(doc.id, account.tokenReference),
    );
    res.json({ status: "published", platformPostId: result.id });
  } catch (e) {
    next(e);
  }
});
app.post("/scheduled", requireUser, async (req: AuthedRequest, res, next) => {
  try {
    const {
      storagePath,
      caption = "",
      scheduledAt,
    } = req.body as {
      storagePath?: string;
      caption?: string;
      scheduledAt?: string;
    };
    if (!storagePath || !scheduledAt || Number.isNaN(Date.parse(scheduledAt)))
      return res.status(400).json({ error: "画像と有効な公開日時が必要です" });
    if (Date.parse(scheduledAt) <= Date.now())
      return res
        .status(400)
        .json({ error: "公開日時は未来を指定してください" });
    assertOwnedStoragePath(req.userId!, storagePath);
    const account = await accountForUser(req.userId!);
    const ref = await db.collection("scheduledPosts").add({
      userId: req.userId,
      platform: "instagram",
      socialAccountId: account.id,
      mediaType: "IMAGE",
      storagePath,
      caption,
      scheduledAt: new Date(scheduledAt),
      status: "scheduled",
      publishAttempts: 0,
      platformPostId: null,
      lastError: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      publishedAt: null,
    });
    res.status(201).json({ id: ref.id, status: "scheduled" });
  } catch (e) {
    next(e);
  }
});
async function deleteOwnedDocuments(collectionName: string, userId: string) {
  while (true) {
    const snapshot = await db
      .collection(collectionName)
      .where("userId", "==", userId)
      .limit(400)
      .get();
    if (snapshot.empty) return;
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    if (snapshot.size < 400) return;
  }
}
app.post("/account/disconnect", requireUser, async (req: AuthedRequest, res, next) => {
  try {
    if (!req.reviewer) {
      return res.status(403).json({ error: "審査用アカウント専用の操作です。" });
    }
    const userId = req.userId!;
    await Promise.all(
      ["socialInsights", "socialPosts", "scheduledPosts", "oauthStates", "socialAccounts"].map(
        (name) => deleteOwnedDocuments(name, userId),
      ),
    );
    await bucket.deleteFiles({ prefix: `instagram/${userId}/` });
    res.json({ status: "disconnected" });
  } catch (e) {
    next(e);
  }
});
app.post("/account/delete", requireUser, async (req: AuthedRequest, res, next) => {
  try {
    if (req.reviewer || req.actorUserId !== req.userId) {
      return res.status(403).json({ error: "審査用アカウントでは所有者データを削除できません。" });
    }
    const userId = req.userId!;
    const accounts = await db
      .collection("socialAccounts")
      .where("userId", "==", userId)
      .get();
    for (const account of accounts.docs) {
      const reference = account.data().tokenReference;
      if (typeof reference === "string") await deleteToken(account.id, reference);
    }
    await Promise.all(
      ["socialInsights", "socialPosts", "scheduledPosts", "oauthStates", "socialAccounts", "users"].map(
        (name) => deleteOwnedDocuments(name, userId),
      ),
    );
    await bucket.deleteFiles({ prefix: `instagram/${userId}/` });
    await auth.deleteUser(userId);
    res.json({ status: "deleted" });
  } catch (e) {
    next(e);
  }
});
app.post("/scheduled/run", async (req, res, next) => {
  try {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const { OAuth2Client } = await import("google-auth-library");
    const ticket = await new OAuth2Client().verifyIdToken({
      idToken: header.slice(7),
      audience: config.cloudRunUrl,
    });
    if (ticket.getPayload()?.email !== config.schedulerServiceAccountEmail) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(await publishDuePosts());
  } catch (e) {
    next(e);
  }
});
app.use(
  async (error: unknown, req: Request, res: Response, _next: NextFunction) => {
    void _next;
    const message = error instanceof Error ? error.message : "Unexpected error";
    const safeMessage = message.replace(
      /\bEAA[A-Za-z0-9._-]+\b/g,
      "[REDACTED_TOKEN]",
    );
    console.error(
      JSON.stringify({
        event: "request_failed",
        endpoint: req.path,
        errorName: error instanceof Error ? error.name : "UNKNOWN",
        message: safeMessage,
      }),
    );
    await db
      .collection("errorLogs")
      .add({
        service: "instagram-worker",
        endpoint: req.path,
        errorCode: error instanceof Error ? error.name : "UNKNOWN",
        errorType: "server",
        requestId: req.header("x-cloud-trace-context")?.split("/")[0] || null,
        timestamp: FieldValue.serverTimestamp(),
      })
      .catch(() => undefined);
    res.status(500).json({
      error: "Instagram処理に失敗しました。時間をおいて再度お試しください。",
      detail: process.env.NODE_ENV === "production" ? undefined : safeMessage,
    });
  },
);
app.listen(config.port, () =>
  console.log(`Signal Instagram worker listening on ${config.port}`),
);
