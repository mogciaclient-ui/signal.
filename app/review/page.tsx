import Link from "next/link";
import { AppShell } from "../components";

const groups = [
  { title: "Authentication", items: ["Signal.ログイン画面", "Facebook経由のInstagram接続・再接続画面", "未接続・接続切れ表示"], done: 3 },
  { title: "Basic", items: ["Instagramアカウント表示", "投稿一覧", "投稿詳細"], done: 3 },
  { title: "Insights", items: ["投稿インサイト画面", "アカウント分析画面"], done: 2 },
  { title: "Publishing", items: ["画像アップロードUI", "即時投稿確認", "投稿成功画面"], done: 3 },
  { title: "Scheduling", items: ["予約登録", "予約一覧・編集", "キャンセル", "二重投稿防止"], done: 4 },
  { title: "Legal", items: ["Privacy Policy", "Terms of Service", "User Data Deletion"], done: 3 },
];

export default function Review() {
  return (
    <AppShell active="/review" title="Meta審査準備">
      <div className="review-hero">
        <div>
          <span>PHASE 1-A</span>
          <h2>Facebook Login方式で審査準備</h2>
          <p>実データで各Permissionの操作動画を収録します。</p>
        </div>
        <div className="progress-ring"><strong>18</strong><small>/ 18 UI項目</small></div>
      </div>
      <div className="review-grid">
        {groups.map((group) => (
          <section className="review-card" key={group.title}>
            <div><h3>{group.title}</h3><span>{group.done}/{group.items.length}</span></div>
            {group.items.map((item, index) => (
              <p key={item} className={index < group.done ? "checked" : "pending"}>
                <i>{index < group.done ? "✓" : "○"}</i>{item}
              </p>
            ))}
          </section>
        ))}
      </div>
      <section className="review-guide">
        <h2>審査動画の操作順</h2>
        <ol>
          <li><b>instagram_basic / pages_show_list</b><span>Facebookログイン → Instagram接続 → 投稿一覧 → 投稿詳細</span></li>
          <li><b>instagram_manage_insights</b><span>投稿詳細の指標 → Instagram分析 → アカウント推移</span></li>
          <li><b>instagram_content_publish</b><span>新しい投稿 → 画像とキャプション → 投稿 → 公開確認</span></li>
        </ol>
        <div className="button-row">
          <Link className="secondary" href="/login">ログイン画面を見る</Link>
          <Link className="primary" href="/settings/instagram">デモを開始</Link>
        </div>
      </section>
    </AppShell>
  );
}
