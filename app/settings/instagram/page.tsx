"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "../../components";
import { instagramService } from "../../../services/instagram/client";

type State = "connected" | "disconnected" | "expired";

export default function InstagramSettings() {
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected") === "1";
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

  return (
    <AppShell active="/settings/instagram" title="Instagram接続">
      {notice && <div className="toast" role="status">✓ {notice}</div>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="settings-card">
        <div className="ig-mark large">◎</div>
        <h2>Instagram</h2>
        {state === "connected" ? (
          <>
            <div className="account-box">
              <div className="avatar">I</div>
              <div><strong>Instagram接続済み</strong><small>Business / Creator</small></div>
              <span className="status"><i />接続済み</span>
            </div>
            <dl><div><dt>利用権限</dt><dd>基本情報・Insights・投稿公開</dd></div></dl>
            <div className="button-row">
              <button className="secondary" onClick={sync} disabled={busy}>{busy ? "処理中…" : "Instagramから同期"}</button>
              <button className="secondary" onClick={connect} disabled={busy}>再接続</button>
              <button className="danger" onClick={() => setState("disconnected")}>表示を解除</button>
            </div>
          </>
        ) : (
          <>
            <p>InstagramとSignal.を接続すると、投稿管理・分析・予約投稿が利用できます。</p>
            <button className="instagram-button" onClick={connect} disabled={busy}>◎ {busy ? "接続を準備中…" : "Instagramを接続"}</button>
            <small className="permission-note">基本情報・インサイト取得・画像投稿の権限のみを利用します。</small>
          </>
        )}
      </div>
    </AppShell>
  );
}
