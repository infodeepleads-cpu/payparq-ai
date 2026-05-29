import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { FooterBrand } from "@/components/FooterBrand";
import { SiteHeader } from "@/components/SiteHeader";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const revalidate = 3600;

async function getPost(slug: string) {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: "Blog | Payparq" };
  return {
    title: `${post.title_hr || post.title} | Payparq`,
    description: post.meta_description || post.excerpt_hr || post.excerpt || "",
    keywords: post.meta_keywords || "",
    openGraph: {
      title: post.title_hr || post.title,
      description: post.meta_description || post.excerpt_hr || post.excerpt || "",
      type: "article",
      publishedTime: post.published_at,
    },
  };
}

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const title = post.title_hr || post.title;
  const content = post.content_hr || post.content;
  const excerpt = post.excerpt_hr || post.excerpt;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SiteHeader />
      <main className="flex-1 pt-24 md:pt-28">
        <article className="max-w-2xl mx-auto px-6 md:px-12 py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-black/40 mb-8">
            <Link href="/blog" className="hover:text-black transition-colors">Blog</Link>
            <span>/</span>
            {post.city && (
              <>
                <span>{post.city}</span>
                <span>/</span>
              </>
            )}
            <span className="text-black/60 truncate max-w-[200px]">{title}</span>
          </nav>

          {/* Header */}
          <header className="mb-10">
            {post.city && (
              <span className="text-[11px] font-semibold uppercase tracking-widest text-black/40 mb-3 block">
                {post.city}, Hrvatska
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-black leading-snug">
              {title}
            </h1>
            {excerpt && (
              <p className="text-lg text-black/60 mt-4 leading-relaxed">{excerpt}</p>
            )}
            <div className="flex items-center gap-4 mt-6 pt-6 border-t border-black/10">
              <span className="text-xs text-black/40">
                Payparq Blog
              </span>
              {post.published_at && (
                <span className="text-xs text-black/40">
                  {new Date(post.published_at).toLocaleDateString("hr-HR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </header>

          {/* Content */}
          <div
            className="prose prose-sm max-w-none text-black/80 leading-relaxed
              prose-headings:font-semibold prose-headings:text-black prose-headings:tracking-tight
              prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3
              prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
              prose-p:mb-4 prose-p:leading-7
              prose-ul:my-4 prose-li:mb-1
              prose-strong:text-black"
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* CTA */}
          <div className="mt-16 rounded-xl border border-black/10 bg-black p-8 text-center space-y-3">
            <h3 className="text-xl font-semibold text-white">
              {post.city
                ? `Iznajmite parking u ${post.city}u`
                : "Iznajmite svoje parking mjesto"}
            </h3>
            <p className="text-sm text-white/60">
              Automatska rezervacija, naplata i upravljanje. Počnite besplatno.
            </p>
            <Link
              href="/list-your-space"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              Počni besplatno →
            </Link>
          </div>

          {/* Back */}
          <div className="mt-10">
            <Link href="/blog" className="text-sm text-black/40 hover:text-black transition-colors">
              ← Svi članci
            </Link>
          </div>
        </article>
      </main>
      <FooterBrand />
    </div>
  );
}
