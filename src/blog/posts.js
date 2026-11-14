// Blog posts for samvaadik.com/blog.
// Plain JS on purpose: imported by the app AND by scripts/prerender.mjs
// (through src/seo/publicRoutes.js) to pre-render pages and build the sitemap.
//
// Adding a post = adding one object to BLOG_POSTS. Newest first.
//
// Body blocks:
//   { h2 } { h3 }               headings (h2s also build the table of contents)
//   { p }                        paragraph
//   { ul: [...] } { ol: [...] }  lists
//   { table: { head: [...], rows: [[...]] } }
//   { note }                     highlighted tip box
//   { cta }                      "try Samvaadik" box (text = the pitch)
// Inline text supports **bold** and [link text](/path or https://...).
//
// Accuracy rule: only describe Samvaadik features that exist in the app, and
// date any Meta price/limit figures - Meta changes them regularly.

export const BLOG_POSTS = [
  // ───────────────────────────── PRICING ─────────────────────────────
  {
    slug: "whatsapp-business-api-pricing-india",
    category: "Pricing",
    title: "WhatsApp Business API Pricing in India (2026): How Per-Message Billing Works",
    metaTitle: "WhatsApp Business API Pricing in India (2026 Guide)",
    metaDescription:
      "WhatsApp Business API pricing in India for 2026: per-message rates for marketing, utility and authentication templates, what's free, GST and cost examples.",
    keywords:
      "WhatsApp Business API pricing India, WhatsApp API cost per message, WhatsApp marketing message price India, WhatsApp utility message cost, WhatsApp API charges",
    excerpt:
      "Meta now charges per delivered template message. Here's what each message category costs in India, what is free, and how to estimate your monthly bill.",
    date: "2026-11-14",
    updated: "2026-11-14",
    readMinutes: 7,
    body: [
      {
        p: "If you're planning to use the WhatsApp Business API for marketing, order updates or OTPs, the first question is usually: **how much does each message cost?** Since July 2025 the answer is simpler than it used to be. Meta charges **per delivered template message**, and the price depends on the template's category and the customer's country.",
      },
      { p: "This guide explains how the billing works for businesses messaging customers in India, what is free, and how to estimate your monthly cost." },
      { h2: "Per-message pricing: what changed in 2025" },
      {
        p: "Until mid-2025, Meta billed WhatsApp by **24-hour conversations**. From **1 July 2025** it switched to **per-message pricing**: you pay for each template message that is delivered, and nothing for most other messages.",
      },
      {
        ul: [
          "You are charged only when a template message is **delivered**, not when it is sent or fails.",
          "Each template has a **category** (Marketing, Utility or Authentication) and each category has its own rate.",
          "The rate depends on the **recipient's country code** (+91 for India), not where your business is.",
        ],
      },
      { h2: "WhatsApp API rates in India by category" },
      {
        p: "The table below shows the approximate Meta rates for messages delivered to Indian (+91) numbers in 2026. They're shown **before 18% GST**. Meta revises its rate card a few times a year, so always check the latest figures on [Meta's official pricing page](https://developers.facebook.com/docs/whatsapp/pricing) before budgeting.",
      },
      {
        table: {
          head: ["Template category", "Typical use", "Approx. rate per delivered message (India)"],
          rows: [
            ["Marketing", "Offers, launches, festive sales, re-engagement", "≈ ₹0.86"],
            ["Utility", "Order updates, payment reminders, appointment alerts", "≈ ₹0.115"],
            ["Authentication", "OTPs and login codes", "≈ ₹0.115"],
          ],
        },
      },
      {
        note: "Marketing messages cost roughly seven times more than utility messages. Use the right category for each template: a genuine order update should be a Utility template, not a Marketing one.",
      },
      { h2: "What's free on the WhatsApp Business API" },
      {
        ul: [
          "**Replies inside the 24-hour customer service window.** When a customer messages you, a 24-hour window opens. Free-form (non-template) replies you send inside that window are not charged.",
          "**Utility templates sent inside an open customer service window.** If the customer has messaged you in the last 24 hours, utility templates are free.",
          "**Messages to customers who came from a Click-to-WhatsApp ad or Facebook Page CTA.** These open a 72-hour free entry point window.",
          "**Failed messages.** You pay only for delivered templates.",
        ],
      },
      {
        p: "Marketing and authentication templates are charged even inside an open window. So a customer who replies to your campaign doesn't make the campaign free, but your follow-up conversation with them is.",
      },
      { h2: "Example: estimating a monthly bill" },
      { p: "Here's a typical month for a D2C brand in India, using the approximate rates above:" },
      {
        table: {
          head: ["Messages", "Count", "Approx. cost"],
          rows: [
            ["Festive offer campaign (Marketing)", "5,000", "≈ ₹4,300"],
            ["Order confirmations and shipping updates (Utility)", "3,000", "≈ ₹345"],
            ["Replies to customer questions (in window)", "1,200", "Free"],
            ["**Total before GST**", "", "**≈ ₹4,645**"],
            ["**Total with 18% GST**", "", "**≈ ₹5,480**"],
          ],
        },
      },
      {
        p: "Meta's message charges are separate from the subscription for whichever platform you use to send them. When you compare WhatsApp marketing tools, check whether the price you're quoted includes Meta's charges or adds a markup on top of them.",
      },
      { h2: "How to reduce your WhatsApp API costs" },
      {
        ol: [
          "**Categorise templates correctly.** Order, payment and appointment updates belong in Utility. Mixing promotional lines into a utility template can get it re-categorised as Marketing.",
          "**Segment your campaigns.** Sending one offer to 2,000 interested customers costs less and performs better than sending it to 20,000 people who never buy.",
          "**Reply quickly.** Conversations inside the 24-hour window are free, so a fast team or a [chatbot](/features/whatsapp-chatbot-builder) saves money as well as sales.",
          "**Retry only failed messages.** Re-sending a whole campaign to people who already received it doubles your bill. Samvaadik's [bulk messaging](/features/whatsapp-bulk-messaging) retries only the failed recipients.",
          "**Measure read rates.** If a campaign's read rate is poor, fix the audience or message before you send the next one.",
        ],
      },
      {
        cta: "Samvaadik shows delivery and read stats for every campaign and retries only failed messages, so you don't pay twice for the same customer.",
      },
    ],
    faqs: [
      {
        q: "Is the WhatsApp Business API free in India?",
        a: "No. Meta charges for each delivered template message. Customer-initiated conversations are free for 24 hours, and utility templates sent inside that window are free too.",
      },
      {
        q: "What is the cost of one WhatsApp marketing message in India?",
        a: "Around ₹0.86 per delivered message before GST in 2026. Utility and authentication messages cost around ₹0.115. Meta updates rates periodically, so check its official rate card for current prices.",
      },
      {
        q: "Is GST charged on WhatsApp Business API messages?",
        a: "Yes. 18% GST applies on top of Meta's message charges for Indian businesses.",
      },
    ],
    related: [
      "whatsapp-messaging-limits-explained",
      "whatsapp-template-rejected-reasons",
    ],
  },

  // ─────────────────────────── BULK SAFELY ───────────────────────────
  {
    slug: "send-bulk-whatsapp-messages-without-getting-banned",
    category: "Guides",
    title: "How to Send Bulk WhatsApp Messages Without Getting Banned",
    metaTitle: "Send Bulk WhatsApp Messages Without Getting Banned",
    metaDescription:
      "Why WhatsApp numbers get banned for bulk messaging and the safe way to do it: the official API, approved templates, opt-ins, warm-up and quality rating.",
    keywords:
      "send bulk WhatsApp messages, bulk WhatsApp without ban, WhatsApp number banned, WhatsApp bulk sender, safe bulk WhatsApp messaging",
    excerpt:
      "Bulk sender tools and browser extensions get numbers banned. Here's why, and the official way to message thousands of customers safely.",
    date: "2026-11-14",
    updated: "2026-11-14",
    readMinutes: 6,
    body: [
      {
        p: "Most businesses that lose a WhatsApp number didn't do anything unusual. They used a cheap **bulk sender tool** or a Chrome extension to send an offer to their contact list, and within hours the number was banned. Here's why that happens and how to send bulk WhatsApp messages the way Meta actually allows.",
      },
      { h2: "Why WhatsApp bans numbers for bulk messaging" },
      {
        p: "The regular WhatsApp and WhatsApp Business apps are built for **one-to-one chat**. Bulk sender software automates those apps, which breaks WhatsApp's terms. WhatsApp's systems look for patterns like:",
      },
      {
        ul: [
          "Many messages sent in a short time from a new or quiet number",
          "Messages to people who haven't saved your number or chatted with you",
          "Identical text sent to hundreds of contacts",
          "Lots of recipients blocking or reporting you",
          "Unofficial clients, extensions or modified WhatsApp apps",
        ],
      },
      { p: "Once enough of these signals add up, the number is restricted or banned, and appeals for automated bulk sending rarely succeed." },
      { h2: "The safe way: the official WhatsApp Business API" },
      {
        p: "Meta offers a separate product for messaging customers at scale: the **WhatsApp Business Platform**, usually called the WhatsApp Business API. It's designed for bulk and automated messaging, so using it for campaigns is allowed rather than a violation. The trade-offs are:",
      },
      {
        ul: [
          "**Business-initiated messages must use approved templates.** You create a template, Meta reviews it, and then you can send it to any opted-in customer.",
          "**Each message is charged** per Meta's [per-message pricing](/blog/whatsapp-business-api-pricing-india).",
          "**There are daily limits** that grow as you send quality messages. See [WhatsApp messaging limits explained](/blog/whatsapp-messaging-limits-explained).",
        ],
      },
      { h2: "7 rules for safe bulk WhatsApp campaigns" },
      {
        ol: [
          "**Use the official API, never bulk sender apps or extensions.**",
          "**Message only people who opted in.** Collect consent at checkout, on forms, or when customers message you first. Bought lists cause blocks.",
          "**Warm up new numbers gradually.** Start with smaller batches of your most engaged customers and increase over days, not all at once.",
          "**Make every message relevant.** Segment by city, purchase or interest instead of blasting everyone.",
          "**Give people a way out.** Add a \"Stop\" quick-reply button and respect opt-outs.",
          "**Watch your quality rating.** If it turns yellow, slow down and review what you're sending. The [messaging limits guide](/blog/whatsapp-messaging-limits-explained) explains quality rating.",
          "**Don't resend to people who already received the message.** Retry only failed messages.",
        ],
      },
      { h2: "What about the WhatsApp Business App's broadcast lists?" },
      {
        p: "Broadcast lists in the free WhatsApp Business App are allowed, but they only reach people who have **saved your number**, are limited to 256 contacts per list, and offer no scheduling, analytics or automation. They're fine for a small shop. For anything bigger, the API is the right tool. Our [App vs API comparison](/blog/whatsapp-business-app-vs-api) covers the differences in detail.",
      },
      {
        cta: "Samvaadik runs on the official WhatsApp Business API with Meta-approved templates, a built-in warm-up for new numbers, scheduling and delivery analytics.",
      },
    ],
    faqs: [
      {
        q: "Can I send bulk WhatsApp messages without getting banned?",
        a: "Yes, if you use the official WhatsApp Business API with approved templates and send only to customers who opted in. Bulk sender apps that automate the normal WhatsApp app are what get numbers banned.",
      },
      {
        q: "How many WhatsApp messages can I send per day?",
        a: "On the API, Meta sets a daily limit on unique customers you can message with templates, starting at 250 for new accounts and rising to 2,000, 10,000, 100,000 and unlimited as you keep quality high.",
      },
      {
        q: "Can a banned WhatsApp number be recovered?",
        a: "You can request a review from inside the app, but bans for automated bulk messaging are rarely reversed. It's far safer to move bulk messaging to the official API before it happens.",
      },
    ],
    related: [
      "whatsapp-messaging-limits-explained",
      "whatsapp-business-app-vs-api",
    ],
  },

  // ────────────────────────── TEMPLATE REJECTED ──────────────────────
  {
    slug: "whatsapp-template-rejected-reasons",
    category: "Guides",
    title: "WhatsApp Template Rejected? 10 Common Reasons and How to Get Approved",
    metaTitle: "WhatsApp Template Rejected? 10 Reasons and Fixes",
    metaDescription:
      "Why Meta rejects WhatsApp message templates and how to fix them: variable formatting, missing samples, wrong category, policy issues, with approved examples.",
    keywords:
      "WhatsApp template rejected, WhatsApp template approval, WhatsApp message template guidelines, template rejected reason, how to get WhatsApp template approved",
    excerpt:
      "Template rejections are almost always caused by the same few mistakes. Here's how to spot them and write templates Meta approves the first time.",
    date: "2026-11-14",
    updated: "2026-11-14",
    readMinutes: 7,
    body: [
      {
        p: "Every business-initiated WhatsApp message on the API needs an **approved message template**. Meta reviews templates automatically, usually within minutes, and rejects anything that breaks its formatting rules or policies. The good news: almost every rejection comes from the same short list of mistakes.",
      },
      { h2: "The 3 template categories" },
      {
        table: {
          head: ["Category", "Use it for", "Example"],
          rows: [
            ["Marketing", "Promotions, offers, announcements, re-engagement", "\"Diwali sale: 20% off all kurtas till Sunday\""],
            ["Utility", "Updates about an existing order, account or booking", "\"Your order #1043 has been shipped\""],
            ["Authentication", "One-time passwords and verification codes", "\"123456 is your verification code\""],
          ],
        },
      },
      {
        p: "Choosing the wrong category is one of the most common problems. If Meta decides a \"utility\" template is really promotional, it will be **re-categorised as Marketing** or rejected.",
      },
      { h2: "10 reasons WhatsApp templates get rejected" },
      { h3: "1. Variable at the start or end of the message" },
      {
        p: "A body can't begin or end with a variable like `{{1}}`. Write \"Hi {{1}}, your order is ready.\" rather than \"{{1}}, your order is ready\", and close with a full sentence.",
      },
      { h3: "2. Too many variables, too little text" },
      {
        p: "A message that is mostly placeholders looks like it could carry anything. Keep a healthy amount of fixed text around each variable, and avoid two variables next to each other (`{{1}} {{2}}`).",
      },
      { h3: "3. Wrong variable numbering" },
      { p: "Variables must be sequential: `{{1}}`, `{{2}}`, `{{3}}`. Skipping a number, repeating braces incorrectly or using `{1}` causes an instant rejection." },
      { h3: "4. Missing or unrealistic sample values" },
      {
        p: "Meta asks for an example for every variable and media header. Provide realistic samples, like \"Priya\" and \"#1043\", not \"test\" or \"abc\".",
      },
      { h3: "5. Promotional content in a utility template" },
      { p: "Adding \"Use code SAVE10 on your next order!\" to a shipping update turns it into marketing. Keep utility templates purely transactional." },
      { h3: "6. Policy-restricted products or claims" },
      {
        p: "Templates that promote items restricted by WhatsApp's Commerce Policy (for example, certain drugs, weapons, gambling or adult products) or make misleading claims are rejected.",
      },
      { h3: "7. Asking for sensitive information" },
      { p: "Never ask customers to send full card numbers, passwords or full ID numbers over WhatsApp." },
      { h3: "8. Threatening or aggressive tone" },
      { p: "Payment reminders are allowed, but language like \"legal action will be taken immediately\" is likely to be rejected. Stay factual and polite." },
      { h3: "9. Spelling, formatting or broken links" },
      { p: "Obvious typos, random capitalisation, excessive emojis and URLs that don't work all hurt approval. Use your own domain rather than link shorteners where you can." },
      { h3: "10. Duplicate templates" },
      { p: "Submitting the same content again under a new name, or reusing a name that was recently deleted, can be blocked. Edit the rejected template or change the content meaningfully." },
      { h2: "Example of a template that gets approved" },
      {
        note: "**Category:** Utility · **Name:** order_shipped\n\nHi {{1}}, good news! Your order {{2}} has been shipped and should reach you by {{3}}. You can track it here: {{4}}\n\nThank you for shopping with us.",
      },
      {
        p: "It names the customer, describes a real transaction, has fixed text around every variable and ends with a complete sentence.",
      },
      { h2: "What to do after a rejection" },
      {
        ol: [
          "Check the rejection reason in Meta's WhatsApp Manager (Message templates section).",
          "Fix the specific issue (often the variables or category) rather than rewriting from scratch.",
          "Resubmit and check the status again after a few minutes.",
          "If you believe the decision is wrong, request a review in WhatsApp Manager.",
        ],
      },
      {
        cta: "In Samvaadik you can create text, media, button and carousel templates, track their approval status, and reuse approved templates across campaigns and automations.",
      },
    ],
    faqs: [
      {
        q: "How long does WhatsApp template approval take?",
        a: "Most templates are reviewed automatically within minutes. Some take longer, up to 24 hours or more if they need manual review.",
      },
      {
        q: "Can I edit an approved WhatsApp template?",
        a: "Yes, approved templates can be edited a limited number of times. Each edit is reviewed again before the new version is used.",
      },
      {
        q: "Why was my utility template changed to marketing?",
        a: "Meta re-categorises templates that contain promotional content, such as offers or discount codes. Keep utility templates strictly about the customer's order, account or booking.",
      },
    ],
    related: [
      "whatsapp-business-api-pricing-india",
      "send-bulk-whatsapp-messages-without-getting-banned",
    ],
  },

  // ─────────────────────────── APP VS API ────────────────────────────
  {
    slug: "whatsapp-business-app-vs-api",
    category: "Guides",
    title: "WhatsApp Business App vs WhatsApp Business API: Which One Do You Need?",
    metaTitle: "WhatsApp Business App vs API: Differences Explained",
    metaDescription:
      "WhatsApp Business App vs API compared: features, limits, pricing, automation and team access, plus how to tell when it's time to switch.",
    keywords:
      "WhatsApp Business App vs API, difference between WhatsApp Business and API, WhatsApp Business API benefits, WhatsApp API for small business",
    excerpt:
      "The free app works for a small shop. The API is built for campaigns, automation and teams. Here's a side-by-side comparison and how to decide.",
    date: "2026-11-14",
    updated: "2026-11-14",
    readMinutes: 6,
    body: [
      {
        p: "WhatsApp offers two products for businesses with confusingly similar names: the free **WhatsApp Business App** and the **WhatsApp Business Platform (API)**. They solve different problems. Here's how they compare and how to know which one fits your business.",
      },
      { h2: "Side-by-side comparison" },
      {
        table: {
          head: ["", "WhatsApp Business App", "WhatsApp Business API"],
          rows: [
            ["Cost", "Free", "Pay per delivered template message"],
            ["Who it's for", "Sole owners and small shops", "Growing businesses, D2C brands, support teams"],
            ["Bulk messaging", "Broadcast lists, 256 contacts each, only people who saved your number", "Template campaigns to any opted-in customer, scaling to unlimited"],
            ["Automation", "Greeting, away message, quick replies", "Chatbots, AI agents, triggered messages"],
            ["Team access", "Phone plus a few linked devices", "Shared inbox for the whole team"],
            ["Integrations", "None", "Connects to stores, CRMs, sheets and your own software"],
            ["Analytics", "Basic message stats", "Delivery and read reports per campaign"],
            ["Interface", "WhatsApp app on phone or desktop", "Through a platform like Samvaadik"],
          ],
        },
      },
      { h2: "When the WhatsApp Business App is enough" },
      {
        ul: [
          "You handle most chats yourself.",
          "You message fewer than a few hundred customers.",
          "You don't need automation or integrations.",
        ],
      },
      { h2: "Signs it's time to move to the API" },
      {
        ul: [
          "You want to send offers to thousands of customers without risking a ban.",
          "Customers ask the same questions all day and you want a [chatbot](/features/whatsapp-chatbot-builder) or [AI agent](/features/whatsapp-ai-agent) to answer.",
          "More than one person needs to reply from the same number. A [shared team inbox](/features/whatsapp-team-inbox) solves this.",
          "You want automatic order updates from your store, such as [WooCommerce order notifications](/woocommerce-whatsapp-integration).",
          "You need to know which campaigns are delivered and read.",
        ],
      },
      { h2: "Can I keep using the WhatsApp Business App on the same number?" },
      {
        p: "Yes. Meta now supports **coexistence**: you connect your existing WhatsApp Business App number to the API and keep using the app on your phone, while campaigns and automation run through the API. Alternatively, you can fully migrate the number to the API, or use a new number for it.",
      },
      { h2: "What you need to get started with the API" },
      {
        ol: [
          "A Facebook / Meta Business account (Business Verification is recommended for higher limits).",
          "A phone number for WhatsApp: your existing app number via coexistence, or a new one.",
          "A display name that matches your business.",
          "A platform to send messages, manage templates and handle chats. Without one, you'd need developers to build directly on Meta's API.",
        ],
      },
      {
        cta: "Samvaadik connects your number to the official WhatsApp Business API in a few clicks, supports coexistence with the WhatsApp Business App, and adds campaigns, chatbots, AI agents and a team inbox on top.",
      },
    ],
    faqs: [
      {
        q: "Is the WhatsApp Business API free?",
        a: "No. The app is free, while the API charges per delivered template message. Replies within the 24-hour customer service window are free.",
      },
      {
        q: "Do I need a new number for the WhatsApp Business API?",
        a: "Not necessarily. With coexistence you can connect your existing WhatsApp Business App number and keep using the app alongside the API.",
      },
      {
        q: "Can small businesses use the WhatsApp Business API?",
        a: "Yes. There's no minimum size. Many small D2C brands and service businesses use it for campaigns, order updates and automated replies.",
      },
    ],
    related: [
      "send-bulk-whatsapp-messages-without-getting-banned",
      "whatsapp-business-api-pricing-india",
    ],
  },

  // ─────────────────────────── LIMITS ─────────────────────────────────
  {
    slug: "whatsapp-messaging-limits-explained",
    category: "Guides",
    title: "WhatsApp Messaging Limits Explained: Tiers, Quality Rating and How to Increase Them",
    metaTitle: "WhatsApp Messaging Limits & Tiers Explained (2026)",
    metaDescription:
      "How WhatsApp Business API messaging limits work in 2026: 250, 2K, 10K, 100K and unlimited tiers, portfolio-level limits, quality rating and how to scale up.",
    keywords:
      "WhatsApp messaging limits, WhatsApp API tier, WhatsApp 250 limit, WhatsApp quality rating, increase WhatsApp messaging limit, WhatsApp tier upgrade",
    excerpt:
      "Your WhatsApp messaging limit decides how many customers you can reach each day. Here's how the tiers work after Meta's October 2025 change and how to move up.",
    date: "2026-11-14",
    updated: "2026-11-14",
    readMinutes: 6,
    body: [
      {
        p: "On the WhatsApp Business API you can't send a template to a million people on day one. Meta sets a **messaging limit**: the maximum number of **unique customers** you can start conversations with using templates in a **rolling 24-hour period**. Replies to customers who message you first don't count against it.",
      },
      { h2: "The messaging limit tiers" },
      {
        table: {
          head: ["Tier", "Unique customers per 24 hours", "Typical stage"],
          rows: [
            ["Starting limit", "250", "New account, business not yet verified"],
            ["Tier 1", "2,000", "Verified business or proven quality sending"],
            ["Tier 2", "10,000", "Consistent volume with good quality"],
            ["Tier 3", "100,000", "Large, established senders"],
            ["Unlimited", "No cap", "High volume with consistently high quality"],
          ],
        },
      },
      {
        note: "In **October 2025** Meta moved limits from individual phone numbers to the **business portfolio**. All numbers in your portfolio now share one limit, and the old 1,000 tier was replaced by 2,000. Older guides that mention a 1K tier or per-number limits are out of date.",
      },
      { h2: "How to move up to a higher tier" },
      {
        ol: [
          "**Complete Meta Business Verification.** It's the fastest way off the starting limit.",
          "**Use a good share of your current limit.** Meta raises limits automatically when you regularly message close to your cap with good quality.",
          "**Keep your quality rating high.** Upgrades pause when quality drops.",
          "**Grow gradually.** Warm up new numbers with smaller batches before large campaigns.",
        ],
      },
      { h2: "What is the WhatsApp quality rating?" },
      {
        p: "Meta rates your recent messages as **High (green)**, **Medium (yellow)** or **Low (red)**, based mostly on how customers react: blocks, reports and negative feedback. Low quality can stop your tier from increasing and, if it continues, can reduce your limit.",
      },
      { p: "To keep quality high:" },
      {
        ul: [
          "Message only customers who opted in.",
          "Segment campaigns so each message is relevant.",
          "Don't send too often. Several promotions a week leads to blocks.",
          "Include an easy opt-out, like a \"Stop\" quick-reply button.",
          "Make the first line clear about who you are and why you're messaging.",
        ],
      },
      { h2: "Other limits worth knowing" },
      {
        ul: [
          "**Marketing message caps per customer.** Meta limits how many marketing messages a person receives from businesses overall, so some campaign messages may not be delivered (error 131049) even if you're within your tier.",
          "**Throughput.** There's also a per-second sending rate per number. A good platform queues and paces sends for you.",
        ],
      },
      {
        cta: "Samvaadik shows your current messaging tier and quality rating, and includes a staged warm-up for newer numbers so campaigns grow at a safe pace.",
      },
    ],
    faqs: [
      {
        q: "What is the WhatsApp 250 message limit?",
        a: "New WhatsApp Business API accounts that haven't completed business verification can start conversations with up to 250 unique customers per rolling 24 hours. Verification and quality sending raise it.",
      },
      {
        q: "Do customer replies count towards my messaging limit?",
        a: "No. The limit applies to business-initiated template messages to unique customers. Replying to customers who message you first doesn't use it.",
      },
      {
        q: "How long does it take to reach the unlimited tier?",
        a: "It depends on volume and quality. Meta upgrades automatically when you regularly use a large share of your current limit while keeping quality high.",
      },
    ],
    related: [
      "send-bulk-whatsapp-messages-without-getting-banned",
      "whatsapp-business-api-pricing-india",
    ],
  },

  // ──────────────────────── WOOCOMMERCE CART ─────────────────────────
  {
    slug: "woocommerce-abandoned-cart-recovery-whatsapp",
    category: "Ecommerce",
    title: "WooCommerce Abandoned Cart Recovery on WhatsApp: A Practical Guide",
    metaTitle: "WooCommerce Abandoned Cart Recovery on WhatsApp",
    metaDescription:
      "Recover abandoned WooCommerce carts with WhatsApp: why it outperforms email, when to send, template examples, and how to automate it for your store.",
    keywords:
      "WooCommerce abandoned cart recovery, WooCommerce WhatsApp abandoned cart, abandoned cart WhatsApp message, WhatsApp cart recovery, WooCommerce WhatsApp",
    excerpt:
      "Most shoppers who abandon checkout never open your reminder email. A WhatsApp message gets read. Here's how to set up cart recovery for a WooCommerce store.",
    date: "2026-11-14",
    updated: "2026-11-14",
    readMinutes: 5,
    body: [
      {
        p: "Most online shoppers who start a checkout don't finish it. For WooCommerce stores in India, where customers live on WhatsApp and rarely check email, a **WhatsApp abandoned cart message** is one of the simplest ways to win some of those sales back.",
      },
      { h2: "Why WhatsApp works better than email for cart recovery" },
      {
        ul: [
          "**It gets seen.** WhatsApp messages are opened far more often than marketing emails, which often land in Promotions.",
          "**It's conversational.** Shoppers can reply with a question about size, delivery or COD, and you can close the sale in the chat.",
          "**It's visual.** Include the product image so the customer instantly remembers what they left behind.",
        ],
      },
      { h2: "When to send the recovery message" },
      {
        p: "Timing matters. Too early feels pushy, while too late and the shopper has bought elsewhere. Around **one hour after the checkout is abandoned** is a sensible default, and you can test shorter or longer delays for your store.",
      },
      { h2: "Example cart recovery template" },
      {
        note: "**Category:** Marketing · **Header:** product image\n\nHi {{1}}, you left {{2}} in your cart at our store. Your order total is {{3}}. Complete your order here before it sells out: {{4}}\n\nNeed help? Just reply to this message.",
      },
      {
        p: "Use the customer's name, the items, the cart total and a direct checkout link. Cart recovery is promotional, so submit it as a **Marketing** template. Read [why templates get rejected](/blog/whatsapp-template-rejected-reasons) before submitting.",
      },
      { h2: "Best practices" },
      {
        ol: [
          "**Send one well-timed reminder.** Repeated nudges get you blocked.",
          "**Only message customers who gave their phone number at checkout** and agreed to be contacted.",
          "**Make replying easy** so questions reach a person or a [chatbot](/features/whatsapp-chatbot-builder).",
          "**Track results.** Compare how many recovered orders each template brings in.",
        ],
      },
      { h2: "Automating it for your WooCommerce store" },
      {
        p: "Doing this manually doesn't scale. With Samvaadik's [WooCommerce WhatsApp integration](/woocommerce-whatsapp-integration), you connect your store once and:",
      },
      {
        ul: [
          "Samvaadik checks your store for abandoned checkouts every 10 minutes.",
          "It sends your approved recovery template after the delay you choose, with the customer's name, cart items, total, checkout link and product image filled in.",
          "Every recovery attempt appears in a log, alongside your order notifications for placed, shipped, delivered, cancelled and refunded orders.",
        ],
      },
      {
        cta: "Connect your WooCommerce store to Samvaadik to send order updates and recover abandoned carts on WhatsApp automatically.",
      },
    ],
    faqs: [
      {
        q: "Can I send abandoned cart messages on WhatsApp from WooCommerce?",
        a: "Yes. Using the official WhatsApp Business API and an integration like Samvaadik, abandoned checkouts trigger an approved WhatsApp template automatically.",
      },
      {
        q: "Is an abandoned cart message a marketing or utility template?",
        a: "Marketing. Cart recovery encourages a purchase, so Meta treats it as promotional.",
      },
      {
        q: "When should I send a WhatsApp abandoned cart reminder?",
        a: "About an hour after the checkout is abandoned is a good starting point. Test shorter and longer delays to see what works for your store.",
      },
    ],
    related: [
      "whatsapp-template-rejected-reasons",
      "whatsapp-business-api-pricing-india",
    ],
  },
];

export const BLOG_INDEX = {
  path: "/blog",
  metaTitle: "WhatsApp Marketing Blog: Guides, Pricing & Tips | Samvaadik",
  metaDescription:
    "Practical guides on WhatsApp Business API pricing, template approval, messaging limits, bulk messaging and ecommerce automation for Indian businesses.",
  h1: "The Samvaadik Blog",
  intro:
    "Practical guides on WhatsApp marketing, the WhatsApp Business API and customer messaging, written for Indian businesses.",
};

export const blogPath = (slug) => `/blog/${slug}`;

export const getBlogPost = (slug) => BLOG_POSTS.find((p) => p.slug === slug);
