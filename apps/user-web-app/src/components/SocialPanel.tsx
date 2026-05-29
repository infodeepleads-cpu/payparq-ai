'use client';

import { useState, useEffect } from 'react';

type Post = {
  id: string;
  platform: string;
  caption: string;
  image_url: string | null;
  status: string;
  scheduled_at: string | null;
  posted_at: string | null;
  created_at: string;
};

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸',
  facebook: '👤',
  linkedin: '💼',
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-50 text-pink-700 border-pink-200',
  facebook: 'bg-blue-50 text-blue-700 border-blue-200',
  linkedin: 'bg-sky-50 text-sky-700 border-sky-200',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-yellow-100 text-yellow-700',
  posted: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

type BlogPost = {
  id: string;
  slug: string;
  title_hr: string;
  city: string;
  status: string;
  published_at: string | null;
};

type BlogGenerateResult = {
  ok?: boolean;
  city?: string;
  slug?: string;
  title?: string;
  message?: string;
  source?: string;
  indexed?: boolean;
  error?: string;
};

export function SocialPanel() {
  const [tab, setTab] = useState<'generate' | 'compose' | 'queue' | 'blog'>('generate');

  // Generator state
  const [genTopic, setGenTopic] = useState('host_parking');
  const [genPlatform, setGenPlatform] = useState('instagram');
  const [genLang, setGenLang] = useState('hr');
  const [genCustom, setGenCustom] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedAds, setGeneratedAds] = useState<string[]>([]);
  const [selectedAd, setSelectedAd] = useState('');

  // Composer state
  const [composePlatform, setComposePlatform] = useState('instagram');
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Queue state
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Blog state
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogGenerating, setBlogGenerating] = useState(false);
  const [blogResult, setBlogResult] = useState<BlogGenerateResult | null>(null);
  const [blogCity, setBlogCity] = useState('');

  useEffect(() => {
    if (tab === 'queue') fetchPosts();
    if (tab === 'blog') fetchBlogPosts();
  }, [tab]);

  const fetchBlogPosts = async () => {
    setBlogLoading(true);
    try {
      const res = await fetch('/api/blog/list');
      const data = await res.json();
      setBlogPosts(data.posts || []);
    } catch { /* ignore */ } finally {
      setBlogLoading(false);
    }
  };

  const handleGenerateBlog = async () => {
    setBlogGenerating(true);
    setBlogResult(null);
    try {
      const res = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: blogCity || undefined, publish: true }),
      });
      const data = await res.json();
      setBlogResult(data);
      if (data.ok) fetchBlogPosts();
    } catch { /* ignore */ } finally {
      setBlogGenerating(false);
    }
  };

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch('/api/social/posts');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch { /* ignore */ } finally {
      setLoadingPosts(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedAds([]);
    try {
      const res = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: genTopic,
          platform: genPlatform,
          language: genLang,
          custom: genCustom || null,
        }),
      });
      const data = await res.json();
      setGeneratedAds(data.ads || []);
    } catch { /* ignore */ } finally {
      setGenerating(false);
    }
  };

  const useAd = (ad: string) => {
    setSelectedAd(ad);
    setCaption(ad);
    setComposePlatform(genPlatform);
    setTab('compose');
  };

  const handleSavePost = async () => {
    if (!caption) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: composePlatform,
          caption,
          image_url: imageUrl || null,
          scheduled_at: scheduledAt || null,
        }),
      });
      if (res.ok) {
        setSaveMsg(scheduledAt ? 'Scheduled!' : 'Saved as draft!');
        setCaption('');
        setImageUrl('');
        setScheduledAt('');
        setSelectedAd('');
        setTimeout(() => { setSaveMsg(''); setTab('queue'); }, 1200);
      }
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    await fetch('/api/social/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setPosts(posts.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-black">Social Media</h2>
          <p className="text-sm text-black/50">Generate ads, schedule posts, manage content.</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-black/40">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          AI Ready
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-black/10">
        {(['generate', 'compose', 'queue', 'blog'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-black text-black' : 'border-transparent text-black/40 hover:text-black/60'
            }`}
          >
            {t === 'generate' ? '✨ Generate' : t === 'compose' ? '✏️ Compose' : t === 'queue' ? '📅 Queue' : '📝 SEO Blog'}
          </button>
        ))}
      </div>

      {/* GENERATE TAB */}
      {tab === 'generate' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-black/60">Topic</label>
              <select
                value={genTopic}
                onChange={e => setGenTopic(e.target.value)}
                className="w-full text-sm border border-black/10 rounded-lg px-3 py-2 bg-white outline-none focus:border-black/30"
              >
                <option value="host_parking">Parking za domaćine</option>
                <option value="hotel">Hotel / Apartman</option>
                <option value="general">Opći oglas</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-black/60">Platform</label>
              <select
                value={genPlatform}
                onChange={e => setGenPlatform(e.target.value)}
                className="w-full text-sm border border-black/10 rounded-lg px-3 py-2 bg-white outline-none focus:border-black/30"
              >
                <option value="instagram">📸 Instagram</option>
                <option value="facebook">👤 Facebook</option>
                <option value="linkedin">💼 LinkedIn</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-black/60">Language</label>
              <select
                value={genLang}
                onChange={e => setGenLang(e.target.value)}
                className="w-full text-sm border border-black/10 rounded-lg px-3 py-2 bg-white outline-none focus:border-black/30"
              >
                <option value="hr">🇭🇷 Hrvatski</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-black/60">Custom prompt (optional — uses AI)</label>
            <input
              type="text"
              value={genCustom}
              onChange={e => setGenCustom(e.target.value)}
              placeholder="npr. parking blizu plaže za turiste..."
              className="w-full text-sm border border-black/10 rounded-lg px-3 py-2 bg-white outline-none focus:border-black/30"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-2.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating...' : '✨ Generate 5 Ads'}
          </button>

          {generatedAds.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-black/60 uppercase tracking-wide">Generated Ads — click to use</p>
              {generatedAds.map((ad, i) => (
                <div
                  key={i}
                  onClick={() => useAd(ad)}
                  className="group relative border border-black/10 rounded-lg p-3 bg-white hover:border-black/30 cursor-pointer transition-all"
                >
                  <p className="text-sm text-black whitespace-pre-wrap pr-16">{ad}</p>
                  <button className="absolute right-3 top-3 text-xs text-black/40 group-hover:text-black font-semibold transition-colors">
                    Use →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMPOSE TAB */}
      {tab === 'compose' && (
        <div className="space-y-4">
          {selectedAd && (
            <div className="border border-black/10 rounded-lg p-3 bg-black/5 text-xs text-black/60">
              ✨ Filled from generator
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-black/60">Platform</label>
            <div className="flex gap-2">
              {(['instagram', 'facebook', 'linkedin'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setComposePlatform(p)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                    composePlatform === p ? PLATFORM_COLORS[p] : 'border-black/10 text-black/40 hover:border-black/20'
                  }`}
                >
                  {PLATFORM_ICONS[p]} {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-black/60">Caption</label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={5}
              placeholder="Napišite oglas ili generirajte gore..."
              className="w-full text-sm border border-black/10 rounded-lg px-3 py-2 bg-white outline-none focus:border-black/30 resize-none"
            />
            <p className="text-xs text-black/30 text-right">{caption.length} chars</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-black/60">Image URL (optional)</label>
            <input
              type="text"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full text-sm border border-black/10 rounded-lg px-3 py-2 bg-white outline-none focus:border-black/30"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-black/60">Schedule (optional — leave blank to save as draft)</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              className="w-full text-sm border border-black/10 rounded-lg px-3 py-2 bg-white outline-none focus:border-black/30"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSavePost}
              disabled={saving || !caption}
              className="flex-1 py-2.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : scheduledAt ? '📅 Schedule Post' : '💾 Save Draft'}
            </button>
            <button
              onClick={() => { setCaption(''); setImageUrl(''); setScheduledAt(''); setSelectedAd(''); }}
              className="px-4 py-2.5 rounded-full border border-black/10 text-sm text-black/60 hover:bg-black/5 transition-colors"
            >
              Clear
            </button>
          </div>

          {saveMsg && <p className="text-sm text-center text-green-700 font-semibold">{saveMsg}</p>}
        </div>
      )}

      {/* QUEUE TAB */}
      {tab === 'queue' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-black/60 uppercase tracking-wide">
              {posts.length} post{posts.length !== 1 ? 's' : ''}
            </p>
            <button onClick={fetchPosts} className="text-xs text-black/40 hover:text-black underline">
              Refresh
            </button>
          </div>

          {loadingPosts && <p className="text-sm text-black/40 text-center py-6">Loading...</p>}

          {!loadingPosts && posts.length === 0 && (
            <div className="text-center py-10 space-y-2">
              <p className="text-sm text-black/40">No posts yet.</p>
              <button onClick={() => setTab('generate')} className="text-xs text-black underline">
                Generate your first ad →
              </button>
            </div>
          )}

          {posts.map(post => (
            <div key={post.id} className="border border-black/10 rounded-lg p-4 space-y-2 bg-white">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${PLATFORM_COLORS[post.platform]}`}>
                    {PLATFORM_ICONS[post.platform]} {post.platform}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[post.status]}`}>
                    {post.status}
                  </span>
                </div>
                <button
                  onClick={() => void handleDeletePost(post.id)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
              <p className="text-sm text-black whitespace-pre-wrap">{post.caption}</p>
              {post.scheduled_at && (
                <p className="text-xs text-black/40">
                  📅 {new Date(post.scheduled_at).toLocaleString()}
                </p>
              )}
              {post.image_url && (
                <p className="text-xs text-black/40 truncate">🖼 {post.image_url}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* BLOG TAB */}
      {tab === 'blog' && (
        <div className="space-y-4">
          {/* Info */}
          <div className="border border-black/10 rounded-lg p-4 bg-black/5 space-y-1">
            <p className="text-xs font-semibold text-black">SEO Geo Blog — automatski</p>
            <p className="text-xs text-black/60">Generira blog post za svaki grad u Hrvatskoj. Objavljuje na <span className="font-mono">/blog/parking-split</span> itd. Automatski šalje URL Googleu via IndexNow.</p>
          </div>

          {/* Generate */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-black/60">Grad (opcionalno — preskače ako je već pokriven)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={blogCity}
                onChange={e => setBlogCity(e.target.value)}
                placeholder="Split, Zagreb, Dubrovnik..."
                className="flex-1 text-sm border border-black/10 rounded-lg px-3 py-2 bg-white outline-none focus:border-black/30"
              />
              <button
                onClick={handleGenerateBlog}
                disabled={blogGenerating}
                className="px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {blogGenerating ? 'Generating...' : '✨ Generate + Publish'}
              </button>
            </div>
          </div>

          {blogResult && (
            <div className={`rounded-lg p-3 text-sm space-y-1 ${blogResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {blogResult.ok ? (
                <>
                  <p className="font-semibold text-green-800">✓ Published: {blogResult.city}</p>
                  <p className="text-green-700 text-xs">{blogResult.title}</p>
                  <div className="flex gap-3 text-xs text-green-600 mt-1">
                    <span>Source: {blogResult.source}</span>
                    <span>{blogResult.indexed ? '✓ IndexNow sent' : '⚠ IndexNow not configured'}</span>
                  </div>
                  <a href={`/blog/${blogResult.slug}`} target="_blank" rel="noreferrer" className="text-xs text-green-700 underline">
                    /blog/{blogResult.slug} →
                  </a>
                </>
              ) : (
                <p className="text-red-700">{blogResult.message || blogResult.error}</p>
              )}
            </div>
          )}

          {/* Published posts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-black/60 uppercase tracking-wide">
                Published Posts ({blogPosts.length})
              </p>
              <button onClick={fetchBlogPosts} className="text-xs text-black/40 hover:text-black underline">Refresh</button>
            </div>

            {blogLoading && <p className="text-sm text-black/40 text-center py-4">Loading...</p>}

            {!blogLoading && blogPosts.length === 0 && (
              <p className="text-xs text-black/40 text-center py-6">No posts yet — generate your first one above.</p>
            )}

            {blogPosts.map(post => (
              <div key={post.id} className="flex items-center justify-between border border-black/10 rounded-lg px-4 py-2.5 bg-white">
                <div>
                  <p className="text-sm font-semibold text-black">{post.title_hr}</p>
                  <p className="text-xs text-black/40">{post.city} · {post.published_at ? new Date(post.published_at).toLocaleDateString('hr-HR') : 'draft'}</p>
                </div>
                <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="text-xs text-black/40 hover:text-black underline ml-4 flex-shrink-0">
                  View →
                </a>
              </div>
            ))}
          </div>

          {/* Setup guide */}
          <div className="border border-amber-100 bg-amber-50 rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-amber-900">Setup za automatsko objavljivanje</p>
            <p className="text-xs text-amber-800">1. <span className="font-mono">GROQ_API_KEY</span> — za AI generiranje sadržaja</p>
            <p className="text-xs text-amber-800">2. <span className="font-mono">INDEXNOW_KEY</span> — za automatski Google/Bing indeks</p>
            <p className="text-xs text-amber-800">3. cron-job.org → GET <span className="font-mono">payparq.com/api/cron/blog-publisher?token=CRON_SECRET</span> — dnevno</p>
          </div>
        </div>
      )}
    </div>
  );
}
