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
  const [notice, setNotice] = useState(connected ? "Instagramアカウントを接続しました。" : "");
  const [error, setError] = useState("");

  async function deleteUploadedImages() {
    const { auth, storage } = firebaseServices();
    if (!auth.currentUser) throw new Error("Signal.へログインしてください。");
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
      setError(caught instanceof Error ? caught.message : "接続を開始できませんでした。");
      setBusy(false);
    }
  }

  async function sync() {
    setBusy(true);
    setError("");
    try {
      const result = await instagramService.sync();
      setNotice(`${result.itemCount}件の投稿とInsightsを同期しました。`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "同期に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount() {
    const confirmed = window.confirm("Signal.に保存されたInstagram接続、投稿、インサイト、予約投稿、画像、ログインアカウントを完全に削除します。この操作は取り消せません。削除しますか？");
    if (!confirmed) return;
    setBusy(true);
    setError("");
    try {
      await deleteUploadedImages();
      await instagramService.deleteAccount();
      window.location.assign("/login?deleted=1");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "データを削除できませんでした。");
      setBusy(false);
    }
  }

  async function disconnectReviewer() {
    const confirmed = window.confirm("審査用アカウントのInstagram接続、同期した投稿・インサイト、予約投稿、アップロード画像を削除して未接続状態に戻します。実行しますか？");
    if (!confirmed) return;
    setBusy(true);
    setError("");
    try {
      await deleteUploadedImages();
      await instagramService.disconnectReviewer();
      window.location.assign("/settings/instagram?disconnected=1");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Instagram連携を解除できませんでした。");
      setBusy(false);
    }
  }

  return (
    <AppShell active="/settings/instagram" title="Instagram接続">
      {notice && <div className="toast" role="status">✓ {notice}</div>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="settings-card">
        <div className="ig-mark large">◎</div>
        <h2>Instagram</h2>
        {loading ? (
          <p>Instagramの接続情報を読み込んでいます…</p>
        ) : account ? (
          <>
            <div className="account-box">
              <div className="avatar">I</div>
              <div><strong>{account ? `@${account.username}` : "Instagram接続済み"}</strong><small>Business / Creator</small></div>
              <span className="status"><i />接続済み</span>
            </div>
            <dl><div><dt>利用権限</dt><dd>基本情報・Insights・投稿公開</dd></div></dl>
            <div className="button-row">
              <button className="secondary" onClick={sync} disabled={busy}>{busy ? "処理中…" : "Instagramから同期"}</button>
              <button className="secondary" onClick={connect} disabled={busy}>再接続</button>
              {isReviewer ? <button className="danger" onClick={disconnectReviewer} disabled={busy}>Instagram連携を解除</button> : <button className="danger" onClick={deleteAccount} disabled={busy}>Signal.のデータを完全削除</button>}
            </div>
            {isReviewer && <small className="permission-note">連携解除後も、審査用のSignal.ログインアカウントは残ります。</small>}
          </>
        ) : (
          <>
            <p>InstagramとSignal.を接続すると、投稿管理・分析・予約投稿が利用できます。</p>
            <button className="instagram-button" onClick={connect} disabled={busy}>◎ {busy ? "接続を準備中…" : "FacebookでInstagramを接続"}</button>
            <small className="permission-note">基本情報・インサイト取得・画像投稿の権限のみを利用します。</small>
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
