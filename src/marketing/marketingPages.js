// Content for the public SEO landing pages (features, integrations, use cases).
// Rendered by src/pages/MarketingPage.jsx; every entry is automatically added
// to the router, the build-time pre-render and sitemap.xml.
//
// Rules for editing:
// - Only describe what the product actually does today (no "coming soon").
// - metaTitle <= ~60 chars, metaDescription <= ~155 chars.
// - Slugs are permanent URLs. Don't rename without adding a redirect in vercel.json.
// - Do NOT use paths under /integrations - those are app screens.
//
// `icon` values are lucide-react icon names mapped in MarketingPage.jsx.

export const MARKETING_PAGES = [
  // ───────────────────────────── FEATURES ─────────────────────────────
  {
    path: "/features/whatsapp-bulk-messaging",
    category: "Feature",
    navLabel: "Bulk Campaigns",
    icon: "Send",
    summary:
      "Send approved template messages to thousands of contacts, schedule campaigns and retry failed sends.",
    metaTitle: "Bulk WhatsApp Messaging & Campaign Scheduler | Samvaadik",
    metaDescription:
      "Send bulk WhatsApp messages via the official Business API. Import contacts from CSV or Google Sheets, schedule campaigns and track delivery and reads.",
    keywords:
      "bulk WhatsApp messaging, WhatsApp bulk sender, WhatsApp campaign scheduler, WhatsApp broadcast, bulk WhatsApp India",
    h1: "Bulk WhatsApp Messaging Through the Official Business API",
    intro:
      "Reach your whole customer list on WhatsApp without risking your number. Samvaadik sends Meta-approved template messages through the official WhatsApp Business API, so you can run promotions, reminders and announcements at scale and see exactly who received and read them.",
    highlights: ["Official WhatsApp Business API", "Schedule in IST", "Delivery & read tracking"],
    featuresTitle: "Everything you need to run WhatsApp campaigns",
    features: [
      {
        icon: "Users",
        title: "Contact groups from CSV or Google Sheets",
        text: "Upload a CSV using our sample format or import straight from a Google Sheet. Keep separate groups for customers, leads or events and reuse them across campaigns.",
      },
      {
        icon: "FileText",
        title: "Template builder with Meta approval",
        text: "Create text, image, video and document templates with variables and buttons, submit them to Meta and track approval status in one place.",
      },
      {
        icon: "GalleryHorizontal",
        title: "Carousel templates",
        text: "Showcase several products or offers in one message with swipeable media cards, each with its own image or video and buttons.",
      },
      {
        icon: "CalendarClock",
        title: "Scheduled campaigns",
        text: "Pick a group and a template, choose a date and time in India Standard Time, and the campaign runs automatically. Edit or delete it any time before it goes out.",
      },
      {
        icon: "RefreshCw",
        title: "Retry only failed messages",
        text: "If some messages fail, retry just those contacts with one click. People who already received the message are not messaged twice.",
      },
      {
        icon: "BarChart3",
        title: "Campaign analytics",
        text: "See sent, delivered, read and failed counts for every campaign, and export campaign results to Google Sheets for reporting.",
      },
    ],
    stepsTitle: "How bulk messaging works in Samvaadik",
    steps: [
      { title: "Connect your WhatsApp Business number", text: "Link your number to the official WhatsApp Business API from your Samvaadik account." },
      { title: "Create and approve a template", text: "Write your message, add media or buttons and submit it to Meta for approval." },
      { title: "Import your contacts", text: "Upload a CSV or pick a Google Sheet to create a contact group." },
      { title: "Send now or schedule", text: "Launch the campaign immediately or schedule it, then track delivery and reads live." },
    ],
    useCasesTitle: "Popular uses",
    useCases: [
      { title: "Offers and festive sales", text: "Announce discounts and new launches with images, videos or product carousels." },
      { title: "Reminders", text: "Send appointment, payment, renewal and event reminders on the app customers actually check." },
      { title: "Updates and alerts", text: "Share service updates, schedules and important notices with large groups at once." },
    ],
    faqs: [
      {
        q: "Will my WhatsApp number get blocked for sending bulk messages?",
        a: "Samvaadik uses the official WhatsApp Business API and only sends templates that Meta has approved, which is the method Meta supports for business messaging at scale. Number quality still depends on sending relevant messages to people who opted in, so we recommend messaging only customers who agreed to hear from you.",
      },
      {
        q: "How many messages can I send per day?",
        a: "Meta sets a daily limit on how many unique customers a business number can start conversations with. New numbers start lower and the limit increases automatically as you keep sending quality messages. Samvaadik itself doesn't add an extra cap on top of Meta's limit.",
      },
      {
        q: "Can I send images, videos and documents?",
        a: "Yes. Templates can include an image, video or document header, and carousel templates can show multiple media cards in one message.",
      },
      {
        q: "Can I schedule a campaign for later?",
        a: "Yes. Choose the date and time (in IST) when you create the campaign and it runs automatically. You can edit or delete a scheduled campaign before it starts.",
      },
      {
        q: "What happens if some messages fail?",
        a: "You can see which messages failed and retry only those contacts, without re-sending to people who already received the message.",
      },
    ],
    related: [
      "/features/whatsapp-chatbot-builder",
      "/google-sheets-whatsapp-integration",
      "/features/whatsapp-team-inbox",
    ],
  },

  {
    path: "/features/whatsapp-chatbot-builder",
    category: "Feature",
    navLabel: "Chatbot Builder",
    icon: "Workflow",
    summary:
      "Build WhatsApp chatbot flows with a drag-and-drop canvas: triggers, replies, conditions, delays and AI steps.",
    metaTitle: "No-Code WhatsApp Chatbot Builder | Samvaadik",
    metaDescription:
      "Build WhatsApp chatbots with a drag-and-drop flow builder. Keyword and image triggers, conditions, delays, AI agent steps and handoff to your team. No coding.",
    keywords:
      "WhatsApp chatbot builder, WhatsApp chatbot, no code WhatsApp bot, WhatsApp auto reply, WhatsApp flow builder",
    h1: "Build a WhatsApp Chatbot Without Writing Code",
    intro:
      "Answer common questions, qualify leads and guide customers automatically, 24x7. Samvaadik's visual flow builder lets you drag steps onto a canvas and connect them, from the first keyword a customer sends to the moment a human takes over.",
    highlights: ["Drag-and-drop canvas", "AI steps built in", "Human handoff"],
    featuresTitle: "Building blocks for every conversation",
    features: [
      {
        icon: "KeyRound",
        title: "Keyword triggers",
        text: "Start a flow when a customer sends a keyword such as \"price\", \"menu\" or \"hi\", with exact-match, contains or starts-with matching.",
      },
      {
        icon: "Image",
        title: "Image triggers",
        text: "Start a flow when a customer sends a photo, for example a payment screenshot, a product picture or a document.",
      },
      {
        icon: "MessageSquare",
        title: "Messages, templates and scheduled messages",
        text: "Reply with text or media, send an approved template, or schedule a follow-up message for later.",
      },
      {
        icon: "GitBranch",
        title: "Wait for input and conditions",
        text: "Ask a question, wait for the reply and branch the conversation using conditions like equals, contains, greater than or less than.",
      },
      {
        icon: "Timer",
        title: "Delays",
        text: "Pause between steps, from minutes to days, to space out follow-ups naturally.",
      },
      {
        icon: "Bot",
        title: "AI agent, AI fallback and handoff",
        text: "Hand the conversation to an AI agent, let AI answer anything the flow doesn't cover, or pass the chat to a team member in the inbox.",
      },
    ],
    stepsTitle: "Launch your first flow in minutes",
    steps: [
      { title: "Create a flow", text: "Name your flow and open the visual builder." },
      { title: "Add a trigger", text: "Choose a keyword or image trigger to start the conversation." },
      { title: "Drag in steps", text: "Connect messages, questions, conditions, delays and AI or handoff steps." },
      { title: "Activate", text: "Set the flow to Active. Keyword conflicts with other flows are flagged before you go live." },
    ],
    useCasesTitle: "What businesses automate",
    useCases: [
      { title: "FAQs and store information", text: "Timings, prices, locations and policies answered instantly." },
      { title: "Lead qualification", text: "Ask a few questions, branch on answers and route hot leads to sales." },
      { title: "Payment and document collection", text: "Use image triggers to receive screenshots or photos and confirm receipt automatically." },
    ],
    faqs: [
      {
        q: "Do I need coding skills to build a WhatsApp chatbot?",
        a: "No. Flows are built by dragging steps onto a canvas and connecting them. Each step has a simple settings panel.",
      },
      {
        q: "Can the chatbot use AI?",
        a: "Yes. You can add an AI agent step that holds a natural conversation using instructions you write, or an AI fallback that answers anything your flow doesn't cover.",
      },
      {
        q: "Can a customer talk to a real person?",
        a: "Yes. Add a \"Handoff to Agent\" step and the conversation moves to the shared inbox so your team can reply.",
      },
      {
        q: "What starts a chatbot flow?",
        a: "A flow starts when a customer sends a matching keyword or an image. If two flows use the same keyword, Samvaadik warns you so customers don't get mixed replies.",
      },
    ],
    related: [
      "/features/whatsapp-ai-agent",
      "/features/whatsapp-team-inbox",
      "/features/whatsapp-bulk-messaging",
    ],
  },

  {
    path: "/features/whatsapp-ai-agent",
    category: "Feature",
    navLabel: "AI Agent",
    icon: "Bot",
    summary:
      "AI agents that reply to customers on WhatsApp using instructions you write, with limits and human handoff.",
    metaTitle: "AI Agent for WhatsApp Customer Support | Samvaadik",
    metaDescription:
      "Create an AI agent that replies to WhatsApp customers in natural language. Brief it like a new employee, set limits and hand off to a human anytime.",
    keywords:
      "WhatsApp AI agent, AI chatbot for WhatsApp, WhatsApp AI customer support, AI auto reply WhatsApp, WhatsApp GPT bot",
    h1: "An AI Agent That Answers Your Customers on WhatsApp",
    intro:
      "Give customers instant, natural replies at any hour. Brief a Samvaadik AI agent the way you would brief a new employee, covering its role, tone and boundaries, and plug it into your chatbot flows. When a conversation needs a person, it hands over to your team.",
    highlights: ["Natural-language replies", "Your instructions, your tone", "Human handoff built in"],
    featuresTitle: "Control how your AI agent behaves",
    features: [
      {
        icon: "ClipboardList",
        title: "Instructions in plain language",
        text: "Describe what the agent should do, how it should sound and what it must not say. No prompt engineering knowledge needed.",
      },
      {
        icon: "Cpu",
        title: "Choose the AI model",
        text: "Pick the model that fits your needs, balancing response quality against usage cost.",
      },
      {
        icon: "Repeat",
        title: "Conversation limits",
        text: "Set the maximum number of turns per conversation to prevent loops and keep usage under control.",
      },
      {
        icon: "LogOut",
        title: "Exit keywords",
        text: "Let customers type a word like \"menu\" or \"stop\" to leave the AI conversation and return to your main flow.",
      },
      {
        icon: "UserCheck",
        title: "Fallback to a human",
        text: "When the limit is reached or the agent can't help, the chat is handed to your team in the shared inbox.",
      },
      {
        icon: "FlaskConical",
        title: "Test before going live",
        text: "Chat with your agent in a test window, refine the instructions and switch it to Active when you're happy.",
      },
    ],
    stepsTitle: "Set up an AI agent",
    steps: [
      { title: "Name and describe the agent", text: "For example: Order Support Agent or FAQ Bot." },
      { title: "Write its instructions", text: "Explain its role, tone, what it knows and when to hand over." },
      { title: "Set limits and exits", text: "Choose the model, maximum turns and exit keywords." },
      { title: "Test and connect", text: "Try it in the test chat, then add it to a chatbot flow as an AI Agent or AI Fallback step." },
    ],
    useCasesTitle: "Where an AI agent helps",
    useCases: [
      { title: "After-hours support", text: "Customers get a helpful answer at 11 pm instead of waiting until morning." },
      { title: "Product and service questions", text: "Explain plans, features, availability and policies in a conversational way." },
      { title: "First-line triage", text: "Collect the details your team needs, then hand over for a faster resolution." },
    ],
    faqs: [
      {
        q: "How is an AI agent different from a regular chatbot?",
        a: "A regular chatbot follows the exact steps you design. An AI agent understands free-form questions and replies in natural language based on the instructions you give it. In Samvaadik you can combine both in one flow.",
      },
      {
        q: "Can I stop the AI from going off-topic?",
        a: "Yes. Your instructions define its role and boundaries, the turn limit caps conversation length, and exit keywords let customers leave the AI at any time.",
      },
      {
        q: "What happens when the AI can't answer?",
        a: "You choose the fallback. By default the conversation is handed to a human agent in the Samvaadik inbox.",
      },
      {
        q: "Can I try the agent before customers see it?",
        a: "Yes. Every agent has a test chat where you can talk to it and adjust instructions before activating it.",
      },
    ],
    related: [
      "/features/whatsapp-chatbot-builder",
      "/features/whatsapp-team-inbox",
      "/features/whatsapp-business-api",
    ],
  },

  {
    path: "/features/whatsapp-team-inbox",
    category: "Feature",
    navLabel: "Team Inbox",
    icon: "MessagesSquare",
    summary:
      "One shared WhatsApp inbox for customer replies, with bot, AI and live-support modes per chat.",
    metaTitle: "Shared WhatsApp Inbox for Teams | Samvaadik",
    metaDescription:
      "Manage customer WhatsApp chats in one shared inbox. See replies to your campaigns, switch between bot, AI and live support per chat, and reply from your browser.",
    keywords:
      "WhatsApp shared inbox, WhatsApp team inbox, WhatsApp customer support software, multi agent WhatsApp, WhatsApp live chat",
    h1: "A Shared WhatsApp Inbox for Your Whole Team",
    intro:
      "Campaigns start conversations, and the inbox is where they turn into sales. Every customer reply lands in one place in Samvaadik, alongside the templates you sent, so your team can pick up any chat from a browser.",
    highlights: ["All chats in one place", "Bot, AI or live per chat", "Works in the browser"],
    featuresTitle: "Built for fast, organised replies",
    features: [
      {
        icon: "Inbox",
        title: "Centralised inbox",
        text: "All conversations on your WhatsApp Business number in a single list, with templates you sent shown in context.",
      },
      {
        icon: "ToggleRight",
        title: "Bot, AI or live support",
        text: "Switch each chat between your chatbot, AI mode or live support, so automation never talks over a team member.",
      },
      {
        icon: "Paperclip",
        title: "Media and documents",
        text: "See the images, videos, audio and documents customers send, along with your template messages, right in the conversation thread.",
      },
      {
        icon: "ShieldCheck",
        title: "Follows WhatsApp's 24-hour rule",
        text: "Reply freely while the customer service window is open. After 24 hours, Samvaadik prompts you to use an approved template, as Meta requires.",
      },
      {
        icon: "Bell",
        title: "Notifications",
        text: "In-app notifications for new customer messages and new store orders, so nothing sits unanswered.",
      },
      {
        icon: "Smartphone",
        title: "Desktop and mobile friendly",
        text: "The inbox adapts to smaller screens, so you can answer customers on the go.",
      },
    ],
    stepsTitle: "From campaign to conversation",
    steps: [
      { title: "Send a campaign or receive a message", text: "Customer replies arrive in the inbox automatically." },
      { title: "Let automation handle the basics", text: "Chatbot flows and AI agents answer common questions." },
      { title: "Take over when needed", text: "Switch the chat to live support and reply personally within the 24-hour window, or send a template after it." },
    ],
    useCasesTitle: "Teams that use the inbox",
    useCases: [
      { title: "Sales teams", text: "Follow up on campaign replies while interest is high." },
      { title: "Customer support", text: "Resolve order, booking and service queries on WhatsApp." },
      { title: "Operations and events", text: "Coordinate with customers or guests directly from their contact record." },
    ],
    faqs: [
      {
        q: "Can I reply to customers from my computer?",
        a: "Yes. The Samvaadik inbox runs in your web browser on desktop and mobile.",
      },
      {
        q: "Why can't I send a free-form message to some customers?",
        a: "WhatsApp lets businesses send free-form messages only within 24 hours of the customer's last message. Outside that window you need to send an approved template, which Samvaadik lets you pick from your templates.",
      },
      {
        q: "Will the chatbot reply while my team is chatting?",
        a: "No, as long as you switch the chat to live support. Each conversation can be set to bot, AI or live mode.",
      },
    ],
    related: [
      "/features/whatsapp-chatbot-builder",
      "/features/whatsapp-ai-agent",
      "/features/whatsapp-bulk-messaging",
    ],
  },

  {
    path: "/features/whatsapp-business-api",
    category: "Feature",
    navLabel: "Developer API",
    icon: "Code2",
    summary:
      "Scoped API keys and webhooks to send WhatsApp messages and receive replies from your own software.",
    metaTitle: "WhatsApp Business API for Developers | Samvaadik",
    metaDescription:
      "Connect your CRM, website or app to WhatsApp. Scoped API keys to send messages, upload media and manage templates, plus webhooks for incoming messages.",
    keywords:
      "WhatsApp Business API, WhatsApp API for developers, WhatsApp API India, send WhatsApp message API, WhatsApp webhook",
    h1: "WhatsApp Business API Access for Your Own Software",
    intro:
      "Send WhatsApp messages from your CRM, website, ERP or app without building on Meta's API from scratch. Samvaadik handles the WhatsApp connection and gives you secure, scoped API keys and a webhook for incoming messages.",
    highlights: ["Scoped API keys", "Incoming-message webhook", "Usage logs"],
    featuresTitle: "What you can do with the API",
    features: [
      {
        icon: "Send",
        title: "Send messages",
        text: "Trigger WhatsApp messages from your own systems, such as order updates, OTP-style alerts or reminders.",
      },
      {
        icon: "Upload",
        title: "Upload media",
        text: "Upload images, videos and documents to include in your messages.",
      },
      {
        icon: "FileText",
        title: "Manage templates",
        text: "Create and manage message templates programmatically.",
      },
      {
        icon: "CalendarClock",
        title: "Read scheduled messages",
        text: "Fetch scheduled messages to keep your system in sync with Samvaadik.",
      },
      {
        icon: "Webhook",
        title: "Webhook for incoming messages",
        text: "Set a webhook URL and receive customer replies in real time in your own application.",
      },
      {
        icon: "KeySquare",
        title: "Scoped, secure keys",
        text: "Each key gets only the permissions you select. Keys are shown once on creation, can be deleted anytime and every call is logged.",
      },
    ],
    stepsTitle: "Get started with the API",
    steps: [
      { title: "Connect your WhatsApp number", text: "Link your WhatsApp Business account in Samvaadik." },
      { title: "Create an API key", text: "Choose the permissions this key needs and copy it securely." },
      { title: "Add your webhook", text: "Point incoming messages to your server's URL." },
      { title: "Call the API", text: "Send messages from your code and monitor calls in the usage logs." },
    ],
    useCasesTitle: "Common integrations",
    useCases: [
      { title: "CRM and lead forms", text: "Message new leads instantly when they fill a form on your website." },
      { title: "Transactional updates", text: "Send booking, order and payment confirmations from your backend." },
      { title: "Custom support tools", text: "Receive WhatsApp replies in your own helpdesk via webhook." },
    ],
    faqs: [
      {
        q: "Do I need my own Meta developer app to use the API?",
        a: "No. You connect your WhatsApp Business number to Samvaadik once, and your software talks to Samvaadik using an API key.",
      },
      {
        q: "How are API keys secured?",
        a: "Each key is limited to the permissions you choose. The full key is shown only once when created, every call is logged, and you can delete a key at any time.",
      },
      {
        q: "Can I receive customer replies in my system?",
        a: "Yes. Add a webhook URL and Samvaadik forwards incoming WhatsApp messages to it in real time.",
      },
    ],
    related: [
      "/woocommerce-whatsapp-integration",
      "/features/whatsapp-bulk-messaging",
      "/features/whatsapp-team-inbox",
    ],
  },

  // ─────────────────────────── INTEGRATIONS ───────────────────────────
  {
    path: "/woocommerce-whatsapp-integration",
    category: "Integration",
    navLabel: "WooCommerce",
    icon: "ShoppingCart",
    summary:
      "Automatic WhatsApp order updates, reminders and abandoned cart recovery for WooCommerce stores.",
    metaTitle: "WooCommerce WhatsApp Notifications & Cart Recovery",
    metaDescription:
      "Send automatic WhatsApp order notifications from WooCommerce: placed, shipped, delivered, cancelled and refunded. Recover abandoned carts and send order reminders.",
    keywords:
      "WooCommerce WhatsApp integration, WooCommerce WhatsApp notifications, WhatsApp order notification, abandoned cart WhatsApp, WooCommerce abandoned cart recovery",
    h1: "WooCommerce WhatsApp Integration for Order Updates and Cart Recovery",
    intro:
      "Customers open WhatsApp, not order emails. Connect your WooCommerce store to Samvaadik and send automatic WhatsApp messages at every order stage, remind customers about pending orders, and win back abandoned carts.",
    highlights: ["Order status automations", "Abandoned cart recovery", "Delivery logs"],
    featuresTitle: "Automations for your WooCommerce store",
    features: [
      {
        icon: "PackageCheck",
        title: "Order status notifications",
        text: "Send a WhatsApp message automatically when an order is placed, shipped, delivered, cancelled or refunded.",
      },
      {
        icon: "ShoppingCart",
        title: "Abandoned cart recovery",
        text: "Samvaadik checks for abandoned checkouts every 30 minutes and sends a recovery message after the delay you choose.",
      },
      {
        icon: "CalendarClock",
        title: "Pending order reminders",
        text: "Remind customers on chosen days after ordering while the order is still Processing or On-hold, which is useful for COD confirmation or payment follow-ups.",
      },
      {
        icon: "Braces",
        title: "Variable mapping",
        text: "Map each template placeholder to an order field such as customer name, order number, items, order total or tracking URL.",
      },
      {
        icon: "Image",
        title: "Product images",
        text: "Include the product image in the message so customers instantly recognise their order.",
      },
      {
        icon: "ListChecks",
        title: "Send logs and backup delivery",
        text: "See every message sent and why any failed. If a store notification arrives late, a backup check detects it and still sends the message.",
      },
    ],
    stepsTitle: "Connect WooCommerce in minutes",
    steps: [
      { title: "Connect your store", text: "Enter your store credentials. Samvaadik verifies them and registers the webhooks automatically." },
      { title: "Pick templates", text: "Use the template guide to create approved templates for each order event." },
      { title: "Map variables", text: "Link template placeholders to order fields." },
      { title: "Turn on automations", text: "Enable order alerts, reminders and cart recovery, then watch the logs." },
    ],
    useCasesTitle: "Why stores add WhatsApp",
    useCases: [
      { title: "Fewer \"where is my order?\" calls", text: "Proactive shipping and delivery updates answer the question before it's asked." },
      { title: "Lower COD cancellations", text: "Reminders on pending orders prompt customers to confirm or pay." },
      { title: "Recovered revenue", text: "Cart recovery messages bring back shoppers who left at checkout." },
    ],
    faqs: [
      {
        q: "Do I need a plugin to connect WooCommerce?",
        a: "You connect using your store's API credentials. Samvaadik verifies them and registers the required webhooks on your store automatically.",
      },
      {
        q: "Which order events can trigger a WhatsApp message?",
        a: "Order placed, shipped, delivered, cancelled and refunded. Each event can send a different approved template.",
      },
      {
        q: "How does abandoned cart recovery work?",
        a: "Samvaadik checks for abandoned checkouts every 30 minutes and sends your recovery template once the delay you set has passed. Every attempt appears in the recovery log.",
      },
      {
        q: "Do you support Shopify?",
        a: "You can already connect a Shopify store to Samvaadik. Order automations and cart recovery for Shopify are on our roadmap.",
      },
    ],
    related: [
      "/features/whatsapp-bulk-messaging",
      "/features/whatsapp-business-api",
      "/features/whatsapp-chatbot-builder",
    ],
  },

  {
    path: "/google-sheets-whatsapp-integration",
    category: "Integration",
    navLabel: "Google Sheets",
    icon: "Sheet",
    summary:
      "Import and sync WhatsApp contacts from Google Sheets and export campaign results back.",
    metaTitle: "Send WhatsApp Messages from Google Sheets | Samvaadik",
    metaDescription:
      "Import WhatsApp contacts from Google Sheets, keep groups in sync and export campaign results back to a sheet. Samvaadik only accesses the sheets you choose.",
    keywords:
      "Google Sheets WhatsApp integration, send WhatsApp from Google Sheets, bulk WhatsApp from Excel, import contacts Google Sheets WhatsApp",
    h1: "Send WhatsApp Campaigns Straight from Google Sheets",
    intro:
      "Your contact lists already live in spreadsheets. Connect Google Sheets to Samvaadik, pick a sheet and turn it into a WhatsApp contact group in seconds. Then send your campaign results back to Sheets for reporting.",
    highlights: ["Import in seconds", "Sync contacts", "Export results"],
    featuresTitle: "Google Sheets + WhatsApp, working together",
    features: [
      {
        icon: "Download",
        title: "Import contacts",
        text: "Pick a spreadsheet with name, phone number and optional email columns and create a contact group from it.",
      },
      {
        icon: "RefreshCw",
        title: "Sync contacts",
        text: "Keep a group up to date with the latest rows in your sheet instead of re-uploading files.",
      },
      {
        icon: "Upload",
        title: "Export campaign results",
        text: "Send campaign delivery data to Google Sheets to share with your team or build reports.",
      },
      {
        icon: "Lock",
        title: "Access only what you choose",
        text: "Samvaadik can only open the specific sheets you select in Google's file picker, not your whole Drive. Disconnect anytime.",
      },
    ],
    stepsTitle: "How it works",
    steps: [
      { title: "Connect your Google account", text: "Sign in with Google from Samvaadik." },
      { title: "Choose a sheet", text: "Select the spreadsheet with your contacts in the file picker." },
      { title: "Create the group", text: "Contacts are imported into a WhatsApp group ready for campaigns." },
      { title: "Send and export", text: "Run your campaign, then export the results back to Sheets." },
    ],
    useCasesTitle: "Great for",
    useCases: [
      { title: "Teams that work in spreadsheets", text: "Sales and marketing lists stay in Sheets while messages go out from Samvaadik." },
      { title: "Event guest lists", text: "Turn an RSVP sheet into a WhatsApp group for updates." },
      { title: "Reporting", text: "Share campaign results with managers without screenshots." },
    ],
    faqs: [
      {
        q: "What format should my Google Sheet be in?",
        a: "Use the columns name and phoneno (and optionally email) in the first sheet. You can download a sample template from Samvaadik.",
      },
      {
        q: "Can Samvaadik see all my Google Drive files?",
        a: "No. Samvaadik can only access the sheets you explicitly select, and you can disconnect your Google account at any time.",
      },
      {
        q: "Can I still upload a CSV instead?",
        a: "Yes. CSV upload is available alongside Google Sheets import.",
      },
    ],
    related: [
      "/features/whatsapp-bulk-messaging",
      "/use-cases/event-management",
      "/woocommerce-whatsapp-integration",
    ],
  },

  // ──────────────────────────── USE CASES ─────────────────────────────
  {
    path: "/use-cases/event-management",
    category: "Use case",
    navLabel: "Events & Weddings",
    icon: "PartyPopper",
    summary:
      "Guest communication for weddings and corporate events: RSVP lists, document collection and flight tracking.",
    metaTitle: "WhatsApp for Event & Wedding Guest Management | Samvaadik",
    metaDescription:
      "Manage event and wedding guests on WhatsApp: guest lists, ID collection for check-in, airport pickup requests, arrival flight tracking and instant guest updates.",
    keywords:
      "WhatsApp for events, wedding guest management WhatsApp, event RSVP WhatsApp, guest communication platform, destination wedding guest management",
    h1: "WhatsApp Guest Management for Events and Weddings",
    intro:
      "Hundreds of guests, travel plans and documents, and one WhatsApp number to keep everyone informed. Samvaadik helps event planners, wedding planners and corporate event teams manage guest lists, collect documents and track arrivals, all through the app guests already use.",
    highlights: ["Guest lists & RSVPs", "Document collection", "Flight tracking"],
    featuresTitle: "Tools built for guest-heavy events",
    features: [
      {
        icon: "Users",
        title: "Guest lists",
        text: "Import guests from CSV or Google Sheets into an event group and manage them in one dashboard.",
      },
      {
        icon: "FileBadge",
        title: "Document collection",
        text: "Send each guest a personal link to upload ID documents for check-in and hotel verification, including family members travelling with them.",
      },
      {
        icon: "Plane",
        title: "Arrival flight tracking",
        text: "Track arrival flights for all guests in one view and refresh statuses to plan airport pickups.",
      },
      {
        icon: "Car",
        title: "Airport pickup requests",
        text: "Guests tell you whether they need an airport pickup when they submit their details.",
      },
      {
        icon: "Megaphone",
        title: "Bulk guest updates",
        text: "Share schedules, venue details and last-minute changes with every guest using approved templates.",
      },
      {
        icon: "Bot",
        title: "Instant answers to guest questions",
        text: "Use chatbot flows and an AI agent to answer FAQs about timings, dress code and venues, so your team isn't answering the same question 200 times.",
      },
    ],
    stepsTitle: "Run guest communication on WhatsApp",
    steps: [
      { title: "Create the event group", text: "Import your guest list from CSV or Google Sheets." },
      { title: "Collect details", text: "Send document upload links and capture travel and pickup needs." },
      { title: "Track arrivals", text: "Monitor flights and coordinate pickups from the dashboard." },
      { title: "Keep guests informed", text: "Send updates and let automation answer common questions." },
    ],
    useCasesTitle: "Who uses it",
    useCases: [
      { title: "Wedding planners", text: "Destination and multi-day weddings with large guest lists." },
      { title: "Corporate event teams", text: "Conferences, offsites and dealer meets with travel logistics." },
      { title: "Hospitality partners", text: "Hotels and venues coordinating check-ins with planners." },
    ],
    faqs: [
      {
        q: "Do guests need to install anything?",
        a: "No. Guests receive messages on WhatsApp and open document upload links in their phone's browser.",
      },
      {
        q: "How are guest documents used?",
        a: "Documents are collected only for check-in and hotel verification and are visible to the event team in Samvaadik.",
      },
      {
        q: "Can I message all guests at once?",
        a: "Yes. Send approved WhatsApp templates to the whole guest group, or schedule them for a specific time.",
      },
    ],
    related: [
      "/google-sheets-whatsapp-integration",
      "/features/whatsapp-bulk-messaging",
      "/features/whatsapp-chatbot-builder",
    ],
  },
];

export const FEATURES_HUB = {
  path: "/features",
  metaTitle: "WhatsApp Marketing & Automation Features | Samvaadik",
  metaDescription:
    "Samvaadik features: bulk WhatsApp campaigns, no-code chatbot builder, AI agents, shared inbox, developer API, WooCommerce and Google Sheets integrations.",
  h1: "Everything You Need to Grow on WhatsApp",
  intro:
    "Samvaadik brings campaigns, automation, AI and customer conversations together on the official WhatsApp Business API.",
};

export const getMarketingPage = (path) =>
  MARKETING_PAGES.find((p) => p.path === path);
