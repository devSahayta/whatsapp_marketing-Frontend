## RSVP AI Agent — Frontend

A Vite + React frontend for managing RSVP events, uploading/viewing documents (PDF), and tracking invitees. It integrates with Supabase for data and storage.

### Features
- Event creation and management
- RSVP table with search/sort-friendly layout
- Document upload and inline PDF viewing
- Dashboard and landing pages
- Responsive UI with Tailwind CSS   

### Tech Stack
- React 18, React Router
- Vite 5
- Tailwind CSS + PostCSS + Autoprefixer
- Supabase JS (`@supabase/supabase-js`)
- PDF rendering via `react-pdf`

---

## Project Structure

```
dist/                    # Production build output (generated)
src/
  api/
    userApi.js          # User-related API helpers
  components/
    DocumentUploadForm.jsx
    DocumentViewer.jsx
    EventDashboard.jsx
    EventForm.jsx
    NavBar.jsx
    RSVPTable.jsx
  config/
    supabaseClient.js   # Supabase client initialization
  pages/
    CallBatchPage.jsx
    CreateEvent.jsx
    Dashboard.jsx
    DocumentUpload.jsx
    DocumentViewerPage.jsx
    EventsPage.jsx
    LandingPage.jsx
  styles/               # CSS files (Tailwind + custom)
  index.css
  main.jsx              # App entry for Vite
  App.jsx               # Top-level routes/layout
public/                 # Static assets (if any)
index.html              # Root HTML template for Vite
vite.config.js
vercel.json             # Deployment config (Vercel)
```

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm 9+
- A Supabase project (URL and anon key)

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root (same folder as `package.json`). Add your environment variables:
   ```bash
   # Vite environment variables must be prefixed with VITE_
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```
   The app reads these in `src/config/supabaseClient.js`.

### Development
Start the dev server:
```bash
npm run dev
```
Then open the printed local URL (usually `http://localhost:5173`).

### Linting
```bash
npm run lint
```

### Build
Create a production build in `dist/`:
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

---

## Configuration

### Supabase
- Edit `src/config/supabaseClient.js` to adjust initialization as needed.
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present in your environment.

### Tailwind
Tailwind is configured via `tailwind.config.js` and `postcss.config.js`. Global styles live primarily in `src/index.css` and `src/styles/`.

---

## Deployment (Vercel)

This project includes `vercel.json`. To deploy:
1. Push to a Git repository (GitHub, GitLab, Bitbucket).
2. Import the repository into Vercel.
3. Set the following Environment Variables in your Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Build command: `npm run build`
5. Output directory: `dist`

Vercel will handle previews for pull requests and automatic deployments on push to the default branch.

---

## Available Scripts (from package.json)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

---

## Troubleshooting
- Blank page in production: verify env vars are set on the host, and that `dist/` is deployed.
- Supabase auth/storage errors: confirm your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` and project policies.
- PDF not rendering: ensure the file is a valid PDF and served with the correct MIME type. Check console for `react-pdf` worker warnings.
- Styling not applied: confirm Tailwind build steps ran (via `npm run build`) and that class names are not dynamically constructed in unsupported ways.

---

## License
This project is provided as-is. Add your preferred license text here.

## Acknowledgements
- Built with Vite + React
- Supabase for backend services
- `react-pdf` for document viewing
