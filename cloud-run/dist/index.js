import express from "express";
import { FieldValue } from "firebase-admin/firestore";
import { config } from "./config.js";
import { auth, db } from "./firebase.js";
import { authorizationUrl, consumeOAuthState, createOAuthState, exchangeCode, fetchAccount } from "./instagram/oauth.js";
import { publishImage } from "./instagram/publishing.js";
import { syncInstagram } from "./instagram/sync.js";
import { publishDuePosts } from "./scheduled.js";
import { readToken, saveToken } from "./tokens.js";
const app = express();
app.use((req, res, next) => { res.setHeader("Access-Control-Allow-Origin", config.appUrl); res.setHeader("Vary", "Origin"); res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type"); res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); if (req.method === "OPTIONS")
    return res.sendStatus(204); next(); });
app.use(express.json({ limit: "1mb" }));
async function requireUser(req, res, next) { try {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer "))
        return res.status(401).json({ error: "Authentication required" });
    req.userId = (await auth.verifyIdToken(header.slice(7))).uid;
    next();
}
catch {
    res.status(401).json({ error: "Authentication required" });
} }
async function accountForUser(userId) { const snapshot = await db.collection("socialAccounts").where("userId", "==", userId).where("platform", "==", "instagram").limit(1).get(); if (snapshot.empty)
    throw new Error("Instagram account is not connected"); return snapshot.docs[0]; }
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/oauth/start", requireUser, async (req, res, next) => { try {
    const state = await createOAuthState(req.userId);
    res.json({ url: authorizationUrl(state) });
}
catch (e) {
    next(e);
} });
app.get("/oauth/callback", async (req, res, next) => { try {
    if (typeof req.query.code !== "string" || typeof req.query.state !== "string")
        return res.status(400).send("Invalid OAuth callback");
    const userId = await consumeOAuthState(req.query.state);
    const token = await exchangeCode(req.query.code);
    const account = await fetchAccount(token.accessToken);
    const tokenReference = await saveToken(account.id, token.accessToken);
    await db.collection("socialAccounts").doc(account.id).set({ userId, platform: "instagram", platformAccountId: account.id, username: account.username, accountType: account.account_type || "BUSINESS", connectionStatus: "connected", tokenReference, tokenExpiresAt: Date.now() + token.expiresIn * 1000, connectedAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), lastSyncedAt: null }, { merge: true });
    res.redirect(`${config.appUrl}/settings/instagram?connected=1`);
}
catch (e) {
    next(e);
} });
app.post("/sync", requireUser, async (req, res, next) => { try {
    const doc = await accountForUser(req.userId);
    const account = doc.data();
    const result = await syncInstagram(req.userId, doc.id, account.platformAccountId, await readToken(account.tokenReference));
    res.json(result);
}
catch (e) {
    next(e);
} });
app.post("/publish", requireUser, async (req, res, next) => { try {
    const { imageUrl, caption = "" } = req.body;
    if (!imageUrl || !URL.canParse(imageUrl))
        return res.status(400).json({ error: "A valid imageUrl is required" });
    const doc = await accountForUser(req.userId);
    const account = doc.data();
    const result = await publishImage(account.platformAccountId, imageUrl, caption, await readToken(account.tokenReference));
    res.json({ status: "published", platformPostId: result.id });
}
catch (e) {
    next(e);
} });
app.post("/scheduled", requireUser, async (req, res, next) => { try {
    const { imageUrl, caption = "", scheduledAt } = req.body;
    if (!imageUrl || !URL.canParse(imageUrl) || !scheduledAt || Number.isNaN(Date.parse(scheduledAt)))
        return res.status(400).json({ error: "画像と有効な公開日時が必要です" });
    if (Date.parse(scheduledAt) <= Date.now())
        return res.status(400).json({ error: "公開日時は未来を指定してください" });
    const account = await accountForUser(req.userId);
    const ref = await db.collection("scheduledPosts").add({ userId: req.userId, platform: "instagram", socialAccountId: account.id, mediaType: "IMAGE", mediaUrl: imageUrl, caption, scheduledAt: new Date(scheduledAt), status: "scheduled", publishAttempts: 0, platformPostId: null, lastError: null, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), publishedAt: null });
    res.status(201).json({ id: ref.id, status: "scheduled" });
}
catch (e) {
    next(e);
} });
// Keep this Cloud Run service private. Cloud Scheduler calls it with an OIDC token;
// Cloud Run IAM rejects unauthenticated callers before this handler executes.
app.post("/scheduled/run", async (_req, res, next) => { try {
    res.json(await publishDuePosts());
}
catch (e) {
    next(e);
} });
app.use(async (error, req, res, _next) => { void _next; const message = error instanceof Error ? error.message : "Unexpected error"; await db.collection("errorLogs").add({ service: "instagram-worker", endpoint: req.path, errorCode: error instanceof Error ? error.name : "UNKNOWN", errorType: "server", requestId: req.header("x-cloud-trace-context")?.split("/")[0] || null, timestamp: FieldValue.serverTimestamp() }).catch(() => undefined); res.status(500).json({ error: "Instagram処理に失敗しました。時間をおいて再度お試しください。", detail: process.env.NODE_ENV === "production" ? undefined : message }); });
app.listen(config.port, () => console.log(`Signal Instagram worker listening on ${config.port}`));
