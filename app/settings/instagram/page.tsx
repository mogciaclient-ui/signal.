"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "../../components";
import { instagramService } from "../../../services/instagram/client";
import { useSignalData } from "../../../lib/firebase/data";

type State = "connected" | "disconnected" | "expired";

export default function InstagramSettings() {
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected") === "1";
  const { account } = useSignalData();
  const [state, setState] = useState<State>(connected ? "connected" : "disconnected");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(connected ? "Instagramアカウントを接続しました。" : "");
  const [error, setError] = useState("");

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
      await instagramService.deleteAccount();
      window.location.assign("/login?deleted=1");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "データを削除できませんでした。");
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
        {(account || state === "connected") ? (
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
              <button className="danger" onClick={deleteAccount} disabled={busy}>Signal.のデータを完全削除</button>
            </div>
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
