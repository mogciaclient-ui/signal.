"use client";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "../components";
const permissions = [
  {
    name: "pages_show_list",
    purpose: "管理しているFacebookページと、連携済みInstagramプロアカウントを特定するため",
    text: "Signal. uses pages_show_list after Facebook Login to retrieve the Facebook Pages managed by the authenticated user and identify the Page linked to the user's Instagram professional account. This is required so the user can connect the correct Instagram account to Signal. The data is used only for account connection and is not shared or sold.",
    steps:
      "Open Settings > Instagram, click “Connect Instagram with Facebook,” complete Facebook Login, and return to Signal. The connected @mogcia Instagram account is displayed.",
  },
  {
    name: "pages_read_engagement",
    purpose: "連携済みInstagramプロアカウントの特定に必要なページ基本情報を読むため",
    text: "Signal. uses pages_read_engagement together with pages_show_list and instagram_basic to read the basic Page information required by the Instagram API with Facebook Login and access the Instagram professional account linked to that Page. Signal. does not publish to or manage the Facebook Page.",
    steps:
      "Complete the Facebook connection in Settings > Instagram. Signal. resolves the linked Page and then displays the connected Instagram professional account.",
  },
  {
    name: "instagram_basic",
    purpose: "Instagramのアカウント情報、投稿一覧、投稿詳細を表示するため",
    text: "Signal. uses instagram_basic to retrieve the connected Instagram professional account's ID and username and to display media owned by that account, including media type, caption, image or thumbnail, permalink, and publish time. Users use this data to review and manage their own Instagram content inside Signal.",
    steps:
      "After connecting @mogcia, open Posts. Show the real media grid, open one post, and show its caption, media, publish time, and Instagram permalink.",
  },
  {
    name: "instagram_manage_insights",
    purpose: "自分のアカウントと投稿のパフォーマンス指標を取得するため",
    text: "Signal. uses instagram_manage_insights to retrieve insights for the authenticated user's own Instagram professional account and media. Signal. displays account reach, views, engaged accounts, total interactions, and available media metrics such as reach, views, likes, comments, saves, and shares so the user can evaluate content performance.",
    steps:
      "Open Analytics and show the account metrics. Then open a post from Posts and show its media-level reach, views, likes, comments, saves, and shares.",
  },
  {
    name: "instagram_content_publish",
    purpose: "ユーザーが選んだ画像とキャプションをInstagramへ投稿するため",
    text: "Signal. uses instagram_content_publish only when the authenticated user explicitly chooses to publish a post. The user selects a JPG or PNG image, enters a caption, and starts publishing. Signal. uploads the image, creates an Instagram media container, checks its processing status, and publishes it to the user's connected Instagram professional account.",
    steps:
      "Open New Post, select a test image, enter “Meta App Review test post,” choose Publish now, and submit. Show the success screen and verify the new post on Instagram.",
  },
];
const checklist = [
  ["実装済み", "Facebookログインと @mogcia の接続"],
  ["実装済み", "実際の投稿一覧と投稿詳細"],
  ["実装済み", "投稿・アカウントのインサイト分析"],
  ["実装済み", "画像投稿"],
  ["実装済み", "トークン管理と二重投稿防止"],
  ["実装済み", "プライバシー・利用規約・データ削除ページ"],
  ["実装済み", "保護されたSignal.審査用アカウント"],
  ["Metaで確認", "5つの権限をAdvanced Accessの審査対象に追加"],
  ["Metaで確認", "アプリドメイン、公開URL、連絡先メール"],
  ["Metaで確認", "ビジネス認証の状態"],
  ["提出前", "Signal.審査用ログイン情報を申請に記載"],
  ["提出前", "下記の操作動画を撮り、各権限へ添付"],
];
const accountGuide = [
  {
    title: "Signal.審査用アカウント",
    body: "Metaの審査申請に記載するメールアドレスとパスワードです。Signal.へログインするためだけに使います。",
  },
  {
    title: "撮影用Facebookアカウント",
    body: "Metaアプリに管理者・開発者・テスターのいずれかとして登録済みで、@mogciaとリンクしたFacebookページを管理できる実アカウントを使います。ロール招待は承認済みにしてください。",
  },
  {
    title: "アプリロール外の一般アカウントは使わない",
    body: "Advanced Accessの承認前は、アプリロールがないアカウントでは申請中の権限を許可・使用できないことがあります。実ページとInstagramプロアカウントが必要なので、Metaのテストユーザーも適しません。",
  },
];
const resetSteps = [
  "Signal.の「設定 → Instagram」で「Instagram連携を解除」を押します。Signal.の審査用ログインは残り、Instagram接続と同期した審査データだけが消えます。",
  "撮影用FacebookアカウントでFacebookを開き、「設定とプライバシー → 設定 → アプリとウェブサイト」へ進みます。Signal.が「ビジネス統合」にある場合は、そちらを開きます。",
  "一覧からSignal.を選び、Signal.に与えた接続・アクセス許可だけを削除します。Meta for Developers側のアプリ、審査申請中の権限、Facebookページ、Instagramアカウントは削除しません。",
  "Facebookからログアウトし、ブラウザのシークレットウィンドウを開きます。",
  "Signal.を開き、Signal.審査用アカウントでログインして「設定 → Instagram」へ進みます。",
  "「FacebookでInstagramを接続」を押す前から録画を開始します。URLを映し、Facebookログインと許可画面を省略せず、Signal.へ戻るところまで収録します。",
  "@mogcia と「接続済み」が表示されたことを確認し、同じアカウントのまま投稿、分析、新規投稿の実演へ進みます。",
];
const cautions = [
  "撮影用FacebookアカウントをMetaアプリのロールから外さない。",
  "Meta for DevelopersにあるSignal.アプリや、申請中の5権限を削除しない。",
  "FacebookページやInstagramアカウント自体を削除・リンク解除しない。",
  "動画にパスワード、アクセストークン、App Secret、認証コードを映さない。",
  "許可画面に5つの技術的な権限名が全部出なくても、認可フロー全体を撮影する。",
  "提出動画と審査時で、アプリのバージョン、画面、審査用ログイン情報を同じにする。",
];
const script = [
  [
    "00:00–00:10",
    "Introduction（冒頭）",
    "Show the browser URL and Signal. login page, then sign in with the reviewer account.（URLとログインを映す）",
  ],
  [
    "00:10–00:35",
    "Facebook Connection（Facebook接続）",
    "Open Settings > Instagram > Connect Instagram with Facebook. Show the complete authorization flow and the connected @mogcia account.（認可画面から接続完了まで収録）",
  ],
  [
    "00:35–01:00",
    "Retrieve Posts（投稿取得）",
    "Select Sync from Instagram, open Posts, and show live posts. Open one post and show its image, caption, date, and Instagram link.（実投稿と詳細を表示）",
  ],
  [
    "01:00–01:25",
    "Insights",
    "Show reach, views, likes, comments, saves, and shares on a post. Then open Analytics and show account metrics.（投稿・アカウント指標を表示）",
  ],
  [
    "01:25–02:05",
    "Publish Now（即時投稿）",
    "Open New Post, select a review image, enter “Meta App Review test post,” select Publish Now, and show the success message.（画像投稿と成功表示を収録）",
  ],
  [
    "02:05–02:20",
    "Verify Publication（公開確認）",
    "Sync again, locate the new post, and open its Instagram link to show that it was published.（Instagram上の公開結果を確認）",
  ],
  [
    "02:20–02:35",
    "Data Management（データ管理）",
    "Open Privacy Policy and User Data Deletion, then show Delete All Signal. Data in Settings. Do not confirm deletion on a real account.（削除は確定しない）",
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
      {copied ? "コピーしました" : "Meta用の英語をコピー"}
    </button>
  );
}
export default function Review() {
  return (
    <AppShell active="/review" title="Meta審査の準備ガイド">
      <section className="submission-hero">
        <div>
          <span>フェーズ1-A · FACEBOOKログイン</span>
          <h2>審査提出パッケージ</h2>
          <p>
            申請するのは下記の5権限だけです。コメント、DM、広告、business_management は申請しません。
          </p>
        </div>
        <div className="submission-score">
          <strong>7</strong>
          <small>実装済み項目</small>
        </div>
      </section>
      <section className="review-section">
        <div className="review-title">
          <div>
            <span>01</span>
            <div>
              <h2>提出前チェック</h2>
              <p>提出前に、Meta側の設定確認と操作動画の撮影を済ませます。</p>
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
              <h2>使用するアカウント</h2>
              <p>Signal.へのログイン用と、Facebook認可用の2種類を区別します。</p>
            </div>
          </div>
        </div>
        <div className="account-guide">
          {accountGuide.map((item, index) => (
            <article key={item.title}>
              <span>{index + 1}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="review-callout">
          <strong>撮影に使うアカウント</strong>
          <p>@mogcia とリンクしたFacebookページを管理している、現在の実Facebookアカウントを使います。このアカウントはMetaアプリのロールに残したままにします。撮影前にリセットするのは「Signal.への既存の接続許可」だけです。</p>
        </div>
      </section>
      <section className="review-section">
        <div className="review-title">
          <div>
            <span>03</span>
            <div>
              <h2>撮影前に接続をリセットする手順</h2>
              <p>本番撮影の直前に、上から順番に実行してください。</p>
            </div>
          </div>
        </div>
        <ol className="reset-steps">
          {resetSteps.map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
        <div className="caution-box">
          <h3>削除・解除してはいけないもの</h3>
          <ul>
            {cautions.map((caution) => <li key={caution}>{caution}</li>)}
          </ul>
        </div>
      </section>
      <section className="review-section">
        <div className="review-title">
          <div>
            <span>04</span>
            <div>
              <h2>権限ごとの申請文</h2>
              <p>各カードの英語文を、Metaの該当権限にある「利用目的」と「審査手順」の欄へ貼り付けます。</p>
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
              <h3>Metaへ貼る英語：この権限の利用目的</h3>
              <p>{p.text}</p>
              <h3>Metaへ貼る英語：審査員の操作手順</h3>
              <p>{p.steps}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="review-section">
        <div className="review-title">
          <div>
            <span>05</span>
            <div>
              <h2>審査動画の撮影台本</h2>
              <p>
                約3分、できればノーカットで撮影します。ブラウザのURLとFacebookの認可画面は必ず映してください。
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
            <span>06</span>
            <div>
              <h2>審査員向け共通手順</h2>
              <p>下の英語をMetaの「Submission Notes（提出メモ）」へ貼り付けます。</p>
            </div>
          </div>
        </div>
        <div className="reviewer-notes">
          <p>
            1. Open{" "}
            <b>https://signal-tool.com/login</b>.
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
            5. Open New Post to publish an image post. Use a JPG or
            PNG file smaller than 8 MB.
          </p>
          <CopyButton
            value={
              "1. Open https://signal-tool.com/login.\n2. Sign in using the Signal. reviewer credentials provided in the App Review submission.\n3. Open Settings > Instagram and connect a Facebook account that manages a Page linked to an Instagram professional account.\n4. Use Posts and Analytics to review the connected account’s media and insights.\n5. Open New Post to publish an image post. Use a JPG or PNG file smaller than 8 MB."
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
            撮影を開始する
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
