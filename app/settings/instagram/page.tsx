"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { deleteObject, listAll, ref } from "firebase/storage";
import { AppShell } from "../../components";
import { instagramService } from "../../../services/instagram/client";
import { useSignalData } from "../../../lib/firebase/data";
import { firebaseServices } from "../../../lib/firebase/client";

function InstagramSettingsContent() {
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected") === "1";
  const { account, isReviewer, loading } = useSignalData();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(connected ? "Instagram account connected.（Instagramアカウントを接続しました）" : "");
  const [error, setError] = useState("");

  async function deleteUploadedImages() {
    const { auth, storage } = firebaseServices();
    if (!auth.currentUser) throw new Error("Sign in to Signal.（Signal.へログインしてください）");
    const uploaded = await listAll(ref(storage, `instagram/${auth.currentUser.uid}/`));
    await Promise.all(uploaded.items.map((item) => deleteObject(item)));
  }

  async function connect() {
    setBusy(true);
    setError("");
    try {
      const { url } = await instagramService.oauthUrl();
      window.location.assign(url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start the connection.（接続を開始できませんでした）");
      setBusy(false);
    }
  }

  async function sync() {
    setBusy(true);
    setError("");
    try {
      const result = await instagramService.sync();
      setNotice(`Synced ${result.itemCount} posts and insights.（${result.itemCount}件を同期しました）`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sync failed.（同期に失敗しました）");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount() {
    const confirmed = window.confirm("Permanently delete your Signal. login account and all saved Instagram connections, posts, insights, scheduled posts, and images? This cannot be undone.\n\nSignal.のログインアカウントと保存データを完全に削除します。この操作は取り消せません。");
    if (!confirmed) return;
    setBusy(true);
    setError("");
    try {
      await deleteUploadedImages();
      await instagramService.deleteAccount();
      window.location.assign("/login?deleted=1");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete the data.（データを削除できませんでした）");
      setBusy(false);
    }
  }

  async function disconnectReviewer() {
    const confirmed = window.confirm("Disconnect Instagram and reset this review account to the unconnected state? Synced posts, insights, scheduled posts, and uploaded images will be deleted.\n\nInstagram連携を解除し、審査用アカウントを未接続状態に戻しますか？");
    if (!confirmed) return;
    setBusy(true);
    setError("");
    try {
      await deleteUploadedImages();
      await instagramService.disconnectReviewer();
      window.location.assign("/settings/instagram?disconnected=1");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not disconnect Instagram.（Instagram連携を解除できませんでした）");
      setBusy(false);
    }
  }

  return (
    <AppShell active="/settings/instagram" title="Instagram Connection（Instagram接続）">
      {notice && <div className="toast" role="status">✓ {notice}</div>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="settings-card">
        <div className="ig-mark large">◎</div>
        <h2>Instagram</h2>
        {loading ? (
          <p>Loading Instagram connection…（接続情報を読み込んでいます）</p>
        ) : account ? (
          <>
            <div className="account-box">
              <div className="avatar">I</div>
              <div><strong>{account ? `@${account.username}` : "Instagram Connected（接続済み）"}</strong><small>Business / Creator</small></div>
              <span className="status"><i />Connected（接続済み）</span>
            </div>
            <dl><div><dt>Permissions Used（利用権限）</dt><dd>Basic Information, Insights, Content Publishing（基本情報・分析・投稿公開）</dd></div></dl>
            <div className="button-row">
              <button className="secondary" onClick={sync} disabled={busy}>{busy ? "Processing…（処理中）" : "Sync from Instagram（Instagramから同期）"}</button>
              <button className="secondary" onClick={connect} disabled={busy}>Reconnect（再接続）</button>
              {isReviewer ? <button className="danger" onClick={disconnectReviewer} disabled={busy}>Disconnect Instagram（連携解除）</button> : <button className="danger" onClick={deleteAccount} disabled={busy}>Delete All Signal. Data（完全削除）</button>}
            </div>
            {isReviewer && <small className="permission-note">Your Signal. review login remains active after disconnection.（審査用ログインは残ります）</small>}
          </>
        ) : (
          <>
            <p>Connect Instagram to manage posts, view analytics, and schedule content.（投稿管理・分析・予約投稿を利用できます）</p>
            <button className="instagram-button" onClick={connect} disabled={busy}>◎ {busy ? "Preparing Connection…（接続準備中）" : "Connect Instagram with Facebook（Facebookで接続）"}</button>
            <small className="permission-note">Signal. requests only the permissions required for basic account information, insights, and image publishing.（必要な権限のみ利用します）</small>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function InstagramSettings() {
  return (
    <Suspense fallback={null}>
      <InstagramSettingsContent />
    </Suspense>
  );
}
