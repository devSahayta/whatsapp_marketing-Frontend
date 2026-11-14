// Blog article page (/blog/:slug). Content lives in src/blog/posts.js.
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, ChevronRight, Clock, Lightbulb } from "lucide-react";
import SEO, { SITE_URL } from "../components/SEO";
import Footer from "../components/landing/Footer";
import { FaqList, CtaBand } from "./MarketingPage";
import { BLOG_INDEX, blogPath, getBlogPost } from "../blog/posts";

const OG_IMAGE = `${SITE_URL}/images/og-image.jpg`;

export const formatDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Inline formatting: **bold**, `code`, [text](href). Internal links use the
// router; external links open in a new tab.
const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

export const Inline = ({ text }) =>
  text.split(INLINE).map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`")) {
      return (
        <code key={i} className="rounded bg-gray-100 px-1.5 py-0.5 text-[0.9em] text-gray-800">
          {part.slice(1, -1)}
        </code>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, href] = link;
      const cls = "font-medium text-indigo-600 underline decoration-indigo-200 underline-offset-2 hover:decoration-indigo-600";
      return href.startsWith("/") ? (
        <Link key={i} to={href} className={cls}>
          {label}
        </Link>
      ) : (
        <a key={i} href={href} className={cls} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      );
    }
    return part;
  });

const Block = ({ block }) => {
  if (block.h2) {
    return (
      <h2 id={slugify(block.h2)} className="scroll-mt-24 mt-12 mb-4 text-2xl sm:text-3xl font-extrabold text-gray-900">
        {block.h2}
      </h2>
    );
  }
  if (block.h3) {
    return <h3 className="mt-8 mb-2 text-xl font-bold text-gray-900">{block.h3}</h3>;
  }
  if (block.p) {
    return (
      <p className="my-4 text-lg leading-relaxed text-gray-700">
        <Inline text={block.p} />
      </p>
    );
  }
  if (block.ul || block.ol) {
    const items = block.ul || block.ol;
    const Tag = block.ul ? "ul" : "ol";
    return (
      <Tag className={`my-5 space-y-2 pl-6 text-lg leading-relaxed text-gray-700 ${block.ul ? "list-disc" : "list-decimal"} marker:text-indigo-500`}>
        {items.map((item, i) => (
          <li key={i} className="pl-1">
            <Inline text={item} />
          </li>
        ))}
      </Tag>
    );
  }
  if (block.table) {
    return (
      <div className="my-6 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[520px] text-left text-sm sm:text-base">
          <thead className="bg-gray-50 text-gray-900">
            <tr>
              {block.table.head.map((h, i) => (
                <th key={i} scope="col" className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {block.table.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className="px-4 py-3 align-top">
                    <Inline text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (block.note) {
    return (
      <aside className="my-6 flex gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-5 text-gray-800">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" aria-hidden="true" />
        <div className="space-y-2 leading-relaxed">
          {block.note.split("\n\n").map((para, i) => (
            <p key={i} className="whitespace-pre-line">
              <Inline text={para} />
            </p>
          ))}
        </div>
      </aside>
    );
  }
  if (block.cta) {
    return (
      <aside className="my-10 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-lg">
        <p className="text-lg font-semibold leading-relaxed">{block.cta}</p>
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-2.5 font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            Book a demo <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/features"
            className="inline-flex items-center justify-center rounded-full border border-white/60 px-6 py-2.5 font-semibold text-white hover:bg-white/10"
          >
            Explore features
          </Link>
        </div>
      </aside>
    );
  }
  return null;
};

const buildJsonLd = (post) => {
  const url = `${SITE_URL}${blogPath(post.slug)}`;
  return [
    {
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      headline: post.title,
      description: post.metaDescription,
      image: OG_IMAGE,
      datePublished: post.date,
      dateModified: post.updated || post.date,
      inLanguage: "en-IN",
      keywords: post.keywords,
      articleSection: post.category,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      isPartOf: { "@id": `${SITE_URL}${BLOG_INDEX.path}#blog` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { name: "Home", item: `${SITE_URL}/` },
        { name: "Blog", item: `${SITE_URL}${BLOG_INDEX.path}` },
        { name: post.title, item: url },
      ].map((c, i) => ({ "@type": "ListItem", position: i + 1, ...c })),
    },
    ...(post.faqs?.length
      ? [
          {
            "@type": "FAQPage",
            mainEntity: post.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]
      : []),
  ];
};

const BlogPost = ({ slug }) => {
  const post = getBlogPost(slug);
  if (!post) return null;

  const toc = post.body.filter((b) => b.h2).map((b) => b.h2);
  const related = (post.related || []).map(getBlogPost).filter(Boolean);

  return (
    <>
      <SEO
        title={post.metaTitle}
        description={post.metaDescription}
        keywords={post.keywords}
        path={blogPath(post.slug)}
        type="article"
        publishedTime={post.date}
        modifiedTime={post.updated || post.date}
        jsonLd={buildJsonLd(post)}
      />

      <div className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <article className="px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <div className="max-w-3xl mx-auto">
            <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-500">
              <ol className="flex flex-wrap items-center gap-1">
                <li>
                  <Link to="/" className="hover:text-gray-900">Home</Link>
                </li>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                <li>
                  <Link to={BLOG_INDEX.path} className="hover:text-gray-900">Blog</Link>
                </li>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                <li className="font-medium text-gray-900" aria-current="page">
                  {post.category}
                </li>
              </ol>
            </nav>

            <header>
              <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                {post.category}
              </span>
              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-gray-900">
                {post.title}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
                <span>By the Samvaadik team</span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  <time dateTime={post.updated || post.date}>
                    {post.updated && post.updated !== post.date ? "Updated " : ""}
                    {formatDate(post.updated || post.date)}
                  </time>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {post.readMinutes} min read
                </span>
              </div>
            </header>

            {toc.length > 2 && (
              <nav aria-label="Contents" className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">In this guide</p>
                <ol className="list-decimal space-y-1.5 pl-5 text-gray-700 marker:text-gray-400">
                  {toc.map((h) => (
                    <li key={h}>
                      <a href={`#${slugify(h)}`} className="hover:text-indigo-600">
                        {h}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            <div className="mt-6">
              {post.body.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </div>

            {post.faqs?.length > 0 && (
              <section className="mt-14">
                <h2 className="mb-6 text-2xl sm:text-3xl font-extrabold text-gray-900">
                  Frequently asked questions
                </h2>
                <FaqList faqs={post.faqs} />
              </section>
            )}
          </div>
        </article>

        {related.length > 0 && (
          <section className="px-4 sm:px-6 lg:px-8 py-10">
            <div className="max-w-5xl mx-auto">
              <h2 className="mb-6 text-2xl font-extrabold text-gray-900">Keep reading</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {related.map((r) => (
                  <PostCard key={r.slug} post={r} />
                ))}
              </div>
            </div>
          </section>
        )}

        <CtaBand title="Grow your business on WhatsApp" />
      </div>
      <Footer />
    </>
  );
};

export const PostCard = ({ post }) => (
  <Link
    to={blogPath(post.slug)}
    className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
  >
    <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{post.category}</span>
    <h3 className="mt-2 text-lg font-bold leading-snug text-gray-900 group-hover:text-indigo-700">
      {post.title}
    </h3>
    <p className="mt-2 flex-1 text-gray-600 leading-relaxed">{post.excerpt}</p>
    <span className="mt-4 text-sm text-gray-500">
      {formatDate(post.date)} · {post.readMinutes} min read
    </span>
  </Link>
);

export default BlogPost;
