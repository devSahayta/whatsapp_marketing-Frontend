# Samvaadik — WhatsApp Marketing Frontend

A React-based frontend for Samvaadik, a WhatsApp Business marketing automation platform for bulk messaging, campaign management, and analytics.

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React 18.3 |
| Build Tool | Vite 5.4 |
| Routing | React Router 7.8 |
| Authentication | Kinde OAuth |
| Styling | Tailwind CSS 3.4 + PostCSS |
| HTTP Client | Axios |
| Icons | Lucide React |
| Animations | Framer Motion |
| Charts | Recharts |
| Database | Supabase |
| Payments | Razorpay |
| Export | jsPDF, XLSX |
| PDF Viewer | React-PDF |
| Notifications | React Hot Toast |
| SEO | React Helmet Async |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn

### Installation

```bash
git clone https://github.com/devSahayta/whatsapp_marketing-Frontend.git
cd whatsapp_marketing-Frontend
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_KINDE_CLIENT_ID=your_kinde_client_id
VITE_KINDE_DOMAIN=https://your-domain.kinde.com
VITE_KINDE_REDIRECT_URL=http://localhost:5173
VITE_KINDE_LOGOUT_REDIRECT_URL=http://localhost:5173/
VITE_BACKEND_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAZORPAY_KEY=your_razorpay_key
```

### Running Locally

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

---

## Project Structure

```
whatsapp_marketing-Frontend/
├── public/                          # Static assets
├── src/
│   ├── api/                         # API layer (Axios calls to backend)
│   │   ├── apiClient.js             # Axios instance with auth token
│   │   ├── analytics.js             # Dashboard metrics & message stats
│   │   ├── campaigns.js             # Campaign CRUD + send/cancel
│   │   ├── flightTracking.js        # Flight status for event attendees
│   │   ├── googleSheets.js          # Export campaign data to Google Sheets
│   │   ├── groups.js                # WhatsApp groups management
│   │   ├── integrations.js          # Third-party integration status
│   │   ├── knowledgeBases.js        # AI knowledge base CRUD
│   │   ├── media.js                 # Media upload (images/videos)
│   │   ├── payment.js               # Razorpay order creation & verification
│   │   ├── templates.js             # WhatsApp message templates
│   │   ├── userApi.js               # User profile management
│   │   └── waccount.js              # WhatsApp Business account
│   │
│   ├── components/                  # Reusable UI components
│   │   ├── NavBar.jsx               # Top navigation bar
│   │   ├── Sidebar.jsx              # Mobile sliding drawer menu
│   │   ├── SubscriptionGuard.jsx    # Redirects expired subscribers
│   │   ├── SEO.jsx                  # Dynamic meta tags per page
│   │   ├── ChatList.jsx             # Conversation list
│   │   ├── ChatWindow.jsx           # Active chat messages + input
│   │   ├── GroupForm.jsx            # Create/edit group form
│   │   ├── RSVPTable.jsx            # Group members table
│   │   ├── DocumentUploadForm.jsx   # File upload for participants
│   │   ├── DocumentViewer.jsx       # PDF/document viewer
│   │   ├── MediaPreview.jsx         # Preview images/videos
│   │   ├── DeleteConfirmModal.jsx   # Delete confirmation dialog
│   │   ├── WebhookHelp.jsx          # Webhook setup documentation
│   │   ├── WhatsaapForm.jsx         # WhatsApp account config form
│   │   ├── Iridescence.jsx          # WebGL animated background
│   │   ├── analytics/               # Dashboard analytics widgets
│   │   │   ├── OverviewCards.jsx        # Key metrics cards
│   │   │   ├── MessageStatusCards.jsx   # Delivery status breakdown
│   │   │   ├── MessageDailyChart.jsx    # Daily message volume chart
│   │   │   └── GroupsPerformanceTable.jsx
│   │   ├── campaigns/
│   │   │   └── MediaGallery.jsx     # Media selector for campaigns
│   │   └── landing/                 # Marketing landing page sections
│   │       ├── NotLoggedInLandingPage.jsx
│   │       ├── LandingHero.jsx
│   │       ├── LandingCoreFeatures.jsx
│   │       ├── LandingAnalyticsPreview.jsx
│   │       ├── LandingCampaignAutomation.jsx
│   │       ├── LandingProblemSolution.jsx
│   │       ├── LandingWhySamvaadik.jsx
│   │       ├── WhoIsSamvaadikForSection.jsx
│   │       ├── HowItWorksSection.jsx
│   │       ├── SecurityComplianceSection.jsx
│   │       ├── FinalCTASection.jsx
│   │       └── Footer.jsx
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuthUser.js           # Get current authenticated user ID
│   │   ├── useSubscription.js       # Subscription status, plan, expiry
│   │   └── useUserCredits.js        # Available message credits
│   │
│   ├── pages/                       # Route-level page components
│   │   ├── LandingPage.jsx          # Analytics dashboard (authenticated)
│   │   ├── GroupsPage.jsx           # List all WhatsApp groups
│   │   ├── CreateGroup.jsx          # Create new group
│   │   ├── GroupDashboard.jsx       # Group member details & RSVP
│   │   ├── ChatPage.jsx             # Real-time messaging interface
│   │   ├── Campaigns.jsx            # Campaign list with filters
│   │   ├── CreateCampaign.jsx       # Campaign builder
│   │   ├── EditCampaign.jsx         # Edit existing campaign
│   │   ├── CampaignDetails.jsx      # Campaign analytics & results
│   │   ├── TemplateList.jsx         # WhatsApp message templates
│   │   ├── CreateTemplate.jsx       # Template builder with preview
│   │   ├── SendTemplate.jsx         # Send template to groups
│   │   ├── KnowledgeBases.jsx       # AI knowledge base list
│   │   ├── CreateKnowledgeBase.jsx  # Create knowledge base
│   │   ├── KnowledgeBaseDetail.jsx  # View/manage knowledge base
│   │   ├── WAccountPage.jsx         # WhatsApp Business account setup
│   │   ├── Integrations.jsx         # Third-party integrations
│   │   ├── FlightStatus.jsx         # Flight tracking for events
│   │   ├── DocumentUpload.jsx       # Participant document upload
│   │   ├── DocumentViewerPage.jsx   # View participant documents
│   │   ├── PricingPage.jsx          # Subscription plans + Razorpay
│   │   ├── SubscriptionExpired.jsx  # Expired subscription page
│   │   ├── ContactUs.jsx            # Support contact form
│   │   ├── AboutUs.jsx              # Company info
│   │   ├── TermsAndConditions.jsx
│   │   ├── PrivacyPolicy.jsx
│   │   └── RefundCancellationPolicy.jsx
│   │
│   ├── styles/                      # Component-level CSS files
│   │   ├── global.css
│   │   ├── navbar.css
│   │   ├── sidebar.css
│   │   ├── LandingPage.css
│   │   ├── chat.css
│   │   ├── createGroup.css
│   │   ├── events.css
│   │   ├── form.css
│   │   ├── pages.css
│   │   ├── table.css
│   │   ├── animations.css
│   │   └── ...
│   │
│   ├── utils/                       # Utility functions
│   │   ├── exportCampaignPdf.js     # Export campaign report as PDF
│   │   ├── timezoneHelper.js        # Timezone conversion helpers
│   │   └── toast.js                 # Toast notification wrappers
│   │
│   ├── App.jsx                      # Root component with all routes
│   ├── main.jsx                     # React entry point + Kinde provider
│   └── index.css                    # Base styles
│
├── .env                             # Environment variables (not committed)
├── index.html                       # HTML entry with SEO meta tags
├── vite.config.js                   # Vite configuration
├── tailwind.config.js               # Tailwind CSS configuration
├── postcss.config.js                # PostCSS configuration
├── eslint.config.js                 # ESLint rules
├── vercel.json                      # Vercel deployment config
└── package.json
```

---

## Routing

### Protected Routes (require login + active subscription)

| Path | Page |
|---|---|
| `/` | Analytics Dashboard |
| `/groups` | Groups List |
| `/createGroup` | Create Group |
| `/dashboard/:eventId` | Group Member Dashboard |
| `/chat` | Chat Interface |
| `/whatsapp-account` | WhatsApp Account Setup |
| `/campaigns` | Campaigns List |
| `/campaigns/create` | Create Campaign |
| `/campaigns/edit/:campaignId` | Edit Campaign |
| `/campaigns/:id` | Campaign Details |
| `/templates` | Templates (requires WA account) |
| `/template/create` | Create Template (requires WA account) |
| `/templates/send/:templateId` | Send Template (requires WA account) |
| `/knowledge-bases` | Knowledge Bases |
| `/knowledge-bases/create` | Create Knowledge Base |
| `/knowledge-bases/:id` | Knowledge Base Detail |
| `/flight-status/:eventId` | Flight Tracking |
| `/integrations` | Third-Party Integrations |

### Public Routes

| Path | Page |
|---|---|
| `/pricing` | Pricing Plans |
| `/expired` | Subscription Expired |
| `/contact` | Contact Us |
| `/about` | About Us |
| `/terms-and-conditions` | Terms & Conditions |
| `/privacy-policy` | Privacy Policy |
| `/refund-cancellation-policy` | Refund Policy |
| `/document-upload/:participantId` | Document Upload (no auth) |
| `/document-viewer/:participantId` | Document Viewer (no auth) |

---

## Authentication Flow

1. **Kinde OAuth** handles login/signup via `KindeProvider` in `main.jsx`
2. On login, `getToken()` fetches the Bearer token and sets it on the Axios client
3. New users are auto-synced to the backend via `addUserToBackend()`
4. Route guards:
   - `PrivateRoute` — redirects unauthenticated users to the landing page
   - `PrivateSubscribedRoute` — additionally checks subscription status via `SubscriptionGuard`
   - `WhatsappAccountRoute` — requires an active WhatsApp Business account

---

## Deployment

The app is configured for **Vercel** deployment (`vercel.json`). All routes are rewritten to `index.html` to support client-side routing.

```bash
npm run build   # Outputs to /dist
```

Set the same environment variables from `.env` in your Vercel project settings.
