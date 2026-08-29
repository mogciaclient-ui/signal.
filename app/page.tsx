import Link from "next/link";
const posts = [
  { color: "peach", date: "8月25日", title: "夏季限定メニューのお知らせ", reach: "1,842", likes: "128" },
  { color: "mint", date: "8月21日", title: "朝の一杯を、もっと心地よく。", reach: "1,506", likes: "96" },
  { color: "blue", date: "8月18日", title: "店内の新しい席をご紹介", reach: "1,284", likes: "84" },
];
export default function Home() {
  return <main className="shell">
    <aside className="sidebar">
      <Link href="/" className="brand">Signal<span>.</span></Link>
      <nav aria-label="メインナビゲーション">
        <Link href="/" className="nav-item active"><span>⌂</span>ホーム</Link>
        <Link href="/posts" className="nav-item"><span>▦</span>投稿</Link>
        <Link href="/analytics" className="nav-item"><span>⌁</span>分析</Link>
        <Link href="/scheduled" className="nav-item"><span>◷</span>予約投稿</Link>
      </nav>
      <nav className="bottom-nav"><Link href="/settings/instagram" className="nav-item"><span>⚙</span>設定</Link><div className="profile"><div className="avatar">S</div><div><strong>Signal Coffee</strong><small>@signal_coffee</small></div><span>⌄</span></div></nav>
    </aside>
    <section className="content">
      <header className="topbar"><div><p className="eyebrow">2026年8月29日 土曜日</p><h1>おはようございます</h1></div><Link className="primary" href="/scheduled/new"><span>＋</span>新しい投稿</Link></header>
      <div className="connection card"><div className="ig-mark">◎</div><div><strong>Instagram</strong><p>@signal_coffee</p></div><span className="status"><i />接続済み</span><div className="sync"><small>最終同期</small><strong>今日 09:42</strong></div><button className="icon-button" aria-label="Instagramから同期">↻</button></div>
      <div className="metrics">
        <article className="metric-card"><div className="metric-top"><span>今月の投稿</span><i className="lavender">▦</i></div><strong>24</strong><small><b>↑ 12%</b> 前月比</small></article>
        <article className="metric-card"><div className="metric-top"><span>合計リーチ</span><i className="sun">⌁</i></div><strong>32,480</strong><small><b>↑ 8.4%</b> 前月比</small></article>
        <article className="metric-card"><div className="metric-top"><span>予約投稿</span><i className="sky">◷</i></div><strong>2</strong><small className="muted">次回 8/30 18:00</small></article>
      </div>
      <div className="section-heading"><div><h2>最近の投稿</h2><p>パフォーマンスをひと目で確認</p></div><Link href="/posts">すべて見る <span>→</span></Link></div>
      <div className="recent-posts">{posts.map((post) => <article className="post-card" key={post.title}><div className={`post-image ${post.color}`}><span>Signal.</span></div><div className="post-body"><small>{post.date}</small><strong>{post.title}</strong><div><span>リーチ <b>{post.reach}</b></span><span>いいね <b>{post.likes}</b></span></div></div></article>)}</div>
    </section>
  </main>;
}
