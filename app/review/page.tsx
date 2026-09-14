"use client";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "../components";
const permissions = [
  {
    name: "pages_show_list",
    purpose:
      "Identify managed Facebook Pages and the linked Instagram professional account.（管理ページとリンク済みInstagramアカウントを特定）",
    text: "Signal. uses pages_show_list after Facebook Login to retrieve the Facebook Pages managed by the authenticated user and identify the Page linked to the user's Instagram professional account. This is required so the user can connect the correct Instagram account to Signal. The data is used only for account connection and is not shared or sold.",
    steps:
      "Open Settings > Instagram, click “Connect Instagram with Facebook,” complete Facebook Login, and return to Signal. The connected @mogcia Instagram account is displayed.",
  },
  {
    name: "pages_read_engagement",
    purpose:
      "Access the basic information required to resolve the linked Instagram professional account.（リンク済みInstagramアカウントの基本情報へアクセス）",
    text: "Signal. uses pages_read_engagement together with pages_show_list and instagram_basic to read the basic Page information required by the Instagram API with Facebook Login and access the Instagram professional account linked to that Page. Signal. does not publish to or manage the Facebook Page.",
    steps:
      "Complete the Facebook connection in Settings > Instagram. Signal. resolves the linked Page and then displays the connected Instagram professional account.",
  },
  {
    name: "instagram_basic",
    purpose: "Display Instagram account information, posts, and post details.（アカウント情報・投稿を表示）",
    text: "Signal. uses instagram_basic to retrieve the connected Instagram professional account's ID and username and to display media owned by that account, including media type, caption, image or thumbnail, permalink, and publish time. Users use this data to review and manage their own Instagram content inside Signal.",
    steps:
      "After connecting @mogcia, open Posts. Show the real media grid, open one post, and show its caption, media, publish time, and Instagram permalink.",
  },
  {
    name: "instagram_manage_insights",
    purpose: "Retrieve performance metrics for the user’s own account and posts.（自社アカウントと投稿の指標を取得）",
    text: "Signal. uses instagram_manage_insights to retrieve insights for the authenticated user's own Instagram professional account and media. Signal. displays account reach, views, engaged accounts, total interactions, and available media metrics such as reach, views, likes, comments, saves, and shares so the user can evaluate content performance.",
    steps:
      "Open Analytics and show the account metrics. Then open a post from Posts and show its media-level reach, views, likes, comments, saves, and shares.",
  },
  {
    name: "instagram_content_publish",
    purpose: "Publish an image and caption explicitly selected by the user.（選択した画像とキャプションを公開）",
    text: "Signal. uses instagram_content_publish only when the authenticated user explicitly chooses to publish a post. The user selects a JPG or PNG image, enters a caption, and starts publishing. Signal. uploads the image, creates an Instagram media container, checks its processing status, and publishes it to the user's connected Instagram professional account.",
    steps:
      "Open New Post, select a test image, enter “Meta App Review test post,” choose Publish now, and submit. Show the success screen and verify the new post on Instagram.",
  },
];
const checklist = [
  ["Implemented（実装済み）", "Facebook Login and @mogcia connection（Facebook接続）"],
  ["Implemented（実装済み）", "Live post list and post details（実投稿一覧・詳細）"],
  ["Implemented（実装済み）", "Post and account Insights（投稿・アカウント分析）"],
  ["Implemented（実装済み）", "Image publishing（画像投稿）"],
  ["Implemented（実装済み）", "Token management and duplicate prevention（トークン管理・二重投稿防止）"],
  ["Implemented（実装済み）", "Privacy, Terms, and Data Deletion（各公開ページ）"],
  ["Implemented（実装済み）", "Protected Signal. reviewer account（審査専用アカウント）"],
  ["Verify in Meta（Metaで確認）", "Add all five permissions to Advanced Access review（5権限を申請）"],
  ["Verify in Meta（Metaで確認）", "App domain, public URLs, and contact email（公開設定）"],
  ["Verify in Meta（Metaで確認）", "Business verification status（ビジネス認証）"],
  ["Before submission（提出前）", "Add Signal. reviewer credentials to the submission（審査用ログイン情報）"],
  ["Before submission（提出前）", "Record the flow below and attach it to each permission（動画添付）"],
];
const accountGuide = [
  {
    title: "Signal. reviewer account（Signal.審査用アカウント）",
    body: "Use the email address and password entered in the Meta App Review submission. This account is used only to sign in to Signal.（Metaの申請欄に記載するSignal.用メールアドレスとパスワード）",
  },
  {
    title: "Facebook account for recording（撮影用Facebookアカウント）",
    body: "Use a real Facebook account added to the Meta app as an Administrator, Developer, or Tester. It must manage the Facebook Page linked to the @mogcia Instagram professional account. Make sure any role invitation has been accepted.（Metaアプリロール登録済みで、@mogciaとリンクしたFacebookページを管理できる実アカウント）",
  },
  {
    title: "Do not use an unrelated general account（ロール外の一般アカウントは使わない）",
    body: "Before Advanced Access is approved, an account with no app role may be unable to grant or use the requested permissions. A Meta-generated Test User may also be unsuitable when a real Page and Instagram professional account are required.（承認前は未登録アカウントで5権限が動かない可能性があります）",
  },
];
const resetSteps = [
  "In Signal., open Settings > Instagram and select Disconnect Instagram. This keeps the Signal. reviewer login but removes its saved Instagram connection and synced review data.（Signal.で連携解除。審査用ログインは残ります）",
  "In Facebook, sign in with the same recording account. Open Settings & privacy > Settings > Apps and websites. If Signal. appears under Business integrations instead, open it there.（撮影用Facebookアカウントの設定を開く）",
  "Select Signal. and remove only its connection/access. Do not delete the Meta Developer app, App Review permissions, Facebook Page, or Instagram account.（Signal.への許可だけを削除）",
  "Log out of Facebook, then open a private/incognito browser window.（Facebookからログアウトし、シークレットウィンドウを開く）",
  "Open Signal., sign in with the Signal. reviewer account, and go to Settings > Instagram.（Signal.審査用アカウントでログイン）",
  "Start recording before selecting Connect Instagram with Facebook. Show the browser URL, complete Facebook Login without cuts, approve the requested access, and return to Signal.（接続ボタンを押す前から録画し、認可画面を省略しない）",
  "Confirm that @mogcia and Connected are visible. Then continue to Posts, Analytics, and New Post without changing accounts.（接続完了後、そのまま機能実演へ進む）",
];
const cautions = [
  "Do not remove the recording Facebook account from the Meta app roles before filming.（撮影前にアプリロールから外さない）",
  "Do not delete the Signal. app in Meta for Developers or remove the five App Review requests.（Meta Developerのアプリや申請権限を削除しない）",
  "Do not expose passwords, access tokens, App Secret, or one-time codes in the video.（パスワード・トークン・App Secret・認証コードを映さない）",
  "The Facebook consent screen may use human-readable descriptions instead of showing all five technical permission names. Keep recording the complete flow.（技術的な権限名がすべて出なくてもフロー全体を収録する）",
  "Use the same app version, UI, and reviewer credentials that Meta will test after submission.（動画と審査時のUI・認証情報を一致させる）",
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
      {copied ? "Copied（コピー済み）" : "Copy Text（文面をコピー）"}
    </button>
  );
}
export default function Review() {
  return (
    <AppShell active="/review" title="Meta Review Guide（審査準備）">
      <section className="submission-hero">
        <div>
          <span>PHASE 1-A · FACEBOOK LOGIN</span>
          <h2>Submission Package（提出用パッケージ）</h2>
          <p>
            Five permissions are included. Comments, DMs, ads, and business_management are not requested.（申請対象は5権限のみ）
          </p>
        </div>
        <div className="submission-score">
          <strong>7</strong>
          <small>Implemented Items（実装完了）</small>
        </div>
      </section>
      <section className="review-section">
        <div className="review-title">
          <div>
            <span>01</span>
            <div>
              <h2>Pre-submission Checklist（提出前チェック）</h2>
              <p>Complete Meta verification and recording items before submission.（Meta確認と撮影を完了してください）</p>
            </div>
          </div>
        </div>
        <div className="submission-checklist">
          {checklist.map(([status, item]) => (
            <div key={item}>
              <span className={status.startsWith("Implemented") ? "done" : "todo"}>
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
              <h2>Accounts to Use（使用するアカウント）</h2>
              <p>Keep the Signal. login and Facebook authorization account clearly separated.（2種類のアカウントを区別してください）</p>
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
          <strong>Recommended recording account（推奨する撮影アカウント）</strong>
          <p>Use the current real Facebook account that manages the linked Page and @mogcia, and keep it registered in the Meta app role. Reset only the existing Signal. authorization before recording.（今の実Facebookアカウントをロールに残し、Signal.への既存許可だけをリセットします）</p>
        </div>
      </section>
      <section className="review-section">
        <div className="review-title">
          <div>
            <span>03</span>
            <div>
              <h2>Reset and Reconnect（初回状態への戻し方）</h2>
              <p>Follow these steps in order before the final recording.（本番撮影前に上から順番に実行）</p>
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
          <h3>Do Not Do These（やってはいけないこと）</h3>
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
              <h2>Permission Explanations（権限ごとの申請文）</h2>
              <p>Paste the English text into each permission’s use-case and reviewer-steps fields.（各申請欄へ貼り付け）</p>
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
            <span>05</span>
            <div>
              <h2>Review Screencast Script（審査動画台本）</h2>
              <p>
                About three minutes, preferably uncut. Always show the browser URL and Facebook authorization screen.（約3分・ノーカット推奨）
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
              <h2>Reviewer Instructions（審査員向け共通手順）</h2>
              <p>Add this text to the Submission Notes.（Submission Notesへ記載）</p>
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
            Start Recording（撮影を開始）
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
