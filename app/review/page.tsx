"use client";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "../components";
const permissions = [
  {
    name: "pages_show_list",
    purpose:
      "管理しているFacebookページと、リンク済みInstagramプロアカウントを特定する。",
    text: "Signal. uses pages_show_list after Facebook Login to retrieve the Facebook Pages managed by the authenticated user and identify the Page linked to the user's Instagram professional account. This is required so the user can connect the correct Instagram account to Signal. The data is used only for account connection and is not shared or sold.",
    steps:
      "Open Settings > Instagram, click “Connect Instagram with Facebook,” complete Facebook Login, and return to Signal. The connected @mogcia Instagram account is displayed.",
  },
  {
    name: "pages_read_engagement",
    purpose:
      "ページにリンクされたInstagramプロアカウントの基本情報へアクセスする。",
    text: "Signal. uses pages_read_engagement together with pages_show_list and instagram_basic to read the basic Page information required by the Instagram API with Facebook Login and access the Instagram professional account linked to that Page. Signal. does not publish to or manage the Facebook Page.",
    steps:
      "Complete the Facebook connection in Settings > Instagram. Signal. resolves the linked Page and then displays the connected Instagram professional account.",
  },
  {
    name: "instagram_basic",
    purpose: "Instagramアカウント情報、投稿一覧、投稿詳細を取得して表示する。",
    text: "Signal. uses instagram_basic to retrieve the connected Instagram professional account's ID and username and to display media owned by that account, including media type, caption, image or thumbnail, permalink, and publish time. Users use this data to review and manage their own Instagram content inside Signal.",
    steps:
      "After connecting @mogcia, open Posts. Show the real media grid, open one post, and show its caption, media, publish time, and Instagram permalink.",
  },
  {
    name: "instagram_manage_insights",
    purpose: "自社アカウントと自社投稿のパフォーマンス指標を取得する。",
    text: "Signal. uses instagram_manage_insights to retrieve insights for the authenticated user's own Instagram professional account and media. Signal. displays account reach, views, engaged accounts, total interactions, and available media metrics such as reach, views, likes, comments, saves, and shares so the user can evaluate content performance.",
    steps:
      "Open Analytics and show the account metrics. Then open a post from Posts and show its media-level reach, views, likes, comments, saves, and shares.",
  },
  {
    name: "instagram_content_publish",
    purpose: "ユーザーが選んだ画像とキャプションを即時または予約で投稿する。",
    text: "Signal. uses instagram_content_publish only when the authenticated user explicitly creates a post. The user selects a JPG or PNG image, enters a caption, and chooses immediate publishing or a future publish time. Signal. uploads the image, creates an Instagram media container, checks processing status, and publishes it to the user's connected Instagram professional account.",
    steps:
      "Open New Post, select a test image, enter “Meta App Review test post,” choose Publish now, and submit. Show the success screen and verify the new post on Instagram.",
  },
];
const checklist = [
  ["実装済み", "Facebook Loginと@mogcia接続"],
  ["実装済み", "実投稿一覧・投稿詳細"],
  ["実装済み", "投稿・アカウントInsights"],
  ["実装済み", "画像の即時投稿・予約投稿"],
  ["実装済み", "Token管理・二重投稿防止"],
  ["実装済み", "Privacy・Terms・Data Deletion"],
  ["実装済み", "審査専用Signal.アカウントと削除保護"],
  ["Metaで確認", "5権限のAdvanced Accessを申請対象に追加"],
  ["Metaで確認", "アプリドメイン・各公開URL・連絡先メール"],
  ["Metaで確認", "ビジネス認証の完了状態"],
  ["提出前", "審査用Signal.ログイン情報を申請欄に記載"],
  ["提出前", "下記台本で画面録画し各権限へ添付"],
];
const script = [
  [
    "00:00–00:10",
    "冒頭",
    "ブラウザのURLとSignal.ログイン画面を映す。Signal.へ審査用アカウントでログインする。",
  ],
  [
    "00:10–00:35",
    "Facebook接続",
    "設定 → Instagram →「FacebookでInstagramを接続」。Facebookの認可画面と要求権限を映し、接続後に@mogciaが表示されるところまで収録。",
  ],
  [
    "00:35–01:00",
    "投稿取得",
    "「Instagramから同期」を押し、投稿ページで実投稿が表示されることを見せる。1件開き、画像・キャプション・日時・Instagramリンクを映す。",
  ],
  [
    "01:00–01:25",
    "Insights",
    "投稿詳細のリーチ・閲覧数・いいね・コメント・保存・シェアを映す。分析ページへ移動し、アカウント指標も映す。",
  ],
  [
    "01:25–02:05",
    "即時投稿",
    "新しい投稿で審査用画像を選び、キャプション「Meta App Review test post」を入力。「今すぐ投稿」で実行し、成功表示を映す。",
  ],
  [
    "02:05–02:20",
    "公開確認",
    "投稿を再同期し、今作った投稿を一覧で確認する。Instagramリンクを開き、実際に公開された投稿を映す。",
  ],
  [
    "02:20–02:35",
    "予約投稿",
    "新しい投稿で日時指定を選び、未来の時刻で予約する。予約投稿一覧に「予約済み」と表示されることを映す。",
  ],
  [
    "02:35–02:50",
    "データ管理",
    "Privacy PolicyとUser Data Deletionを開き、設定画面の「Signal.のデータを完全削除」ボタンまで見せる。実アカウントでは削除を確定しない。",
  ],
];
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="review-copy"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "コピー済み" : "文面をコピー"}
    </button>
  );
}
export default function Review() {
  return (
    <AppShell active="/review" title="Meta審査準備">
      <section className="submission-hero">
        <div>
          <span>PHASE 1-A · FACEBOOK LOGIN</span>
          <h2>提出用パッケージ</h2>
          <p>
            申請対象は5権限。コメント・DM・広告・business_managementは申請しません。
          </p>
        </div>
        <div className="submission-score">
          <strong>7</strong>
          <small>実装項目 完了</small>
        </div>
      </section>
      <section className="review-section">
        <div className="review-title">
          <div>
            <span>01</span>
            <div>
              <h2>提出前チェック</h2>
              <p>「Metaで確認」「提出前」は管理画面と撮影で完了させます。</p>
            </div>
          </div>
        </div>
        <div className="submission-checklist">
          {checklist.map(([status, item]) => (
            <div key={item}>
              <span className={status === "実装済み" ? "done" : "todo"}>
                {status}
              </span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="review-section">
        <div className="review-title">
          <div>
            <span>02</span>
            <div>
              <h2>権限ごとの申請文</h2>
              <p>英語文を各Permissionの利用目的・操作手順欄へ貼り付けます。</p>
            </div>
          </div>
        </div>
        <div className="permission-stack">
          {permissions.map((p) => (
            <article className="permission-card" key={p.name}>
              <div className="permission-head">
                <div>
                  <code>{p.name}</code>
                  <p>{p.purpose}</p>
                </div>
                <CopyButton
                  value={`${p.text}\n\nReviewer steps:\n${p.steps}`}
                />
              </div>
              <h3>How Signal. uses this permission</h3>
              <p>{p.text}</p>
              <h3>Reviewer steps</h3>
              <p>{p.steps}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="review-section">
        <div className="review-title">
          <div>
            <span>03</span>
            <div>
              <h2>審査動画 撮影台本</h2>
              <p>
                約3分・ノーカット推奨。ブラウザURLとFacebook認可画面を必ず映します。
              </p>
            </div>
          </div>
          <CopyButton
            value={script.map((x) => `${x[0]} ${x[1]}\n${x[2]}`).join("\n\n")}
          />
        </div>
        <div className="script-list">
          {script.map(([time, title, body], i) => (
            <article key={time}>
              <div>
                <span>{i + 1}</span>
                <time>{time}</time>
              </div>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="review-section">
        <div className="review-title">
          <div>
            <span>04</span>
            <div>
              <h2>審査員向け共通手順</h2>
              <p>Submission Notesへ記載する内容です。</p>
            </div>
          </div>
        </div>
        <div className="reviewer-notes">
          <p>
            1. Open{" "}
            <b>https://signal-instagram.mogcia-client.chatgpt.site/login</b>.
          </p>
          <p>
            2. Sign in using the Signal. reviewer credentials provided in the
            App Review submission.
          </p>
          <p>
            3. Open Settings &gt; Instagram and connect a Facebook account that
            manages a Page linked to an Instagram professional account.
          </p>
          <p>
            4. Use Posts and Analytics to review the connected account’s media
            and insights.
          </p>
          <p>
            5. Open New Post to publish or schedule an image post. Use a JPG or
            PNG file smaller than 8 MB.
          </p>
          <CopyButton
            value={
              "1. Open https://signal-instagram.mogcia-client.chatgpt.site/login.\n2. Sign in using the Signal. reviewer credentials provided in the App Review submission.\n3. Open Settings > Instagram and connect a Facebook account that manages a Page linked to an Instagram professional account.\n4. Use Posts and Analytics to review the connected account’s media and insights.\n5. Open New Post to publish or schedule an image post. Use a JPG or PNG file smaller than 8 MB."
            }
          />
        </div>
        <div className="review-actions">
          <Link className="secondary" href="/privacy">
            Privacy
          </Link>
          <Link className="secondary" href="/data-deletion">
            Data Deletion
          </Link>
          <Link className="primary" href="/settings/instagram">
            撮影を開始
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
