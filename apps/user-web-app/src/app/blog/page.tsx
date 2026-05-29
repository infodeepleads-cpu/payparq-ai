import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { SiteHeader } from "@/components/SiteHeader";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const revalidate = 3600;

async function getPosts() {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("blog_posts")
    .select("slug, title, title_hr, excerpt, excerpt_hr, city, published_at, locale")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);
  return data || [];
}

export default async function BlogIndex() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SiteHeader />
      <main className="flex-1 pt-24 md:pt-28">
        <section className="max-w-4xl mx-auto px-6 md:px-12 py-16">
          <div className="mb-12">
            <p className="text-[11px] uppercase tracking-[0.24em] text-black/40 mb-2">Blog</p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-black">
              Parking savjeti i vodiči
            </h1>
            <p className="text-base text-black/60 mt-3">
              Sve što trebate znati o parkingu u Hrvatskoj — gradovi, savjeti, cijene.
            </p>
          </div>

          {posts.length === 0 && (
            <p className="text-sm text-black/40">Uskoro — objave se generiraju automatski.</p>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {posts.map(post => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block border border-black/10 rounded-xl p-5 hover:border-black/30 transition-colors"
              >
                {post.city && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-black/40 mb-2 block">
                    {post.city}
                  </span>
                )}
                <h2 className="text-base font-semibold text-black group-hover:underline underline-offset-2">
                  {post.title_hr || post.title}
                </h2>
                {(post.excerpt_hr || post.excerpt) && (
                  <p className="text-sm text-black/60 mt-1.5 line-clamp-2">
                    {post.excerpt_hr || post.excerpt}
                  </p>
                )}
                <p className="text-xs text-black/30 mt-3">
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString("hr-HR")
                    : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <FooterBrand />
    </div>
  );
}
