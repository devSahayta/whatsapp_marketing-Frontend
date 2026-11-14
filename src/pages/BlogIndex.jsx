// Blog listing page (/blog).
import React from "react";
import SEO, { SITE_URL } from "../components/SEO";
import Footer from "../components/landing/Footer";
import { CtaBand } from "./MarketingPage";
import { PostCard } from "./BlogPost";
import { BLOG_POSTS, BLOG_INDEX, blogPath } from "../blog/posts";

const BlogIndex = () => {
  const url = `${SITE_URL}${BLOG_INDEX.path}`;
  const jsonLd = [
    {
      "@type": "Blog",
      "@id": `${url}#blog`,
      url,
      name: "The Samvaadik Blog",
      description: BLOG_INDEX.metaDescription,
      inLanguage: "en-IN",
      publisher: { "@id": `${SITE_URL}/#organization` },
      blogPost: BLOG_POSTS.map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        url: `${SITE_URL}${blogPath(p.slug)}`,
        datePublished: p.date,
      })),
    },
  ];

  return (
    <>
      <SEO
        title={BLOG_INDEX.metaTitle}
        description={BLOG_INDEX.metaDescription}
        path={BLOG_INDEX.path}
        jsonLd={jsonLd}
      />
      <div className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <section className="px-4 sm:px-6 lg:px-8 pt-14 pb-10 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-gray-900">
              {BLOG_INDEX.h1}
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-gray-600 leading-relaxed">{BLOG_INDEX.intro}</p>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 pb-6">
          <div className="max-w-6xl mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BLOG_POSTS.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>

        <CtaBand title="Ready to try WhatsApp marketing?" />
      </div>
      <Footer />
    </>
  );
};

export default BlogIndex;
