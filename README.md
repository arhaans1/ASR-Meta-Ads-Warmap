# Warmap Generator

A React SPA to create, store, and download Meta Ads Warmaps for high-ticket coaching clients.

## Features

- **Multiple Funnel Types**: Support for Webinar, Webinar-to-Call, and Direct Call funnels
- **Dynamic Forms**: Form fields adapt based on selected funnel type
- **Auto Calculations**: Automatic calculation of unit economics, ROI, and scaling timelines
- **Document Generation**: Download professional .docx warmap documents
- **Database Storage**: Store and retrieve warmaps from Supabase
- **Search**: Search warmaps by client or business name

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Document Generation**: docx + file-saver
- **Routing**: react-router-dom

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd ASR-Meta-Ads-Warmap
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the contents of `supabase-schema.sql`
3. Get your Project URL and anon key from Settings > API

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Run the development server

```bash
npm run dev
```

### 6. Build for production

```bash
npm run build
```

## Funnel Types

### Webinar Funnel
Registration → Attendance → Sale

Best for course launches and group programs.

### Webinar-to-Call Funnel
Registration → Attendance → Call Booking → Call Attendance → Sale

Best for high-ticket coaching with consultation.

### Direct Call Funnel
Opt-in → Call Booking → Call Attendance → Sale

Best for strategy calls and application funnels.

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Layout.jsx
│   ├── SearchBar.jsx
│   ├── FunnelTypeSelector.jsx
│   ├── DynamicFunnelForm.jsx
│   └── WarmapPreview.jsx
├── lib/              # Utility libraries
│   ├── supabase.js       # Supabase client
│   ├── calculations.js   # Funnel metrics calculations
│   ├── funnelConfigs.js  # Funnel type presets
│   └── docxGenerator.js  # Document generation
├── pages/            # Page components
│   ├── Home.jsx
│   ├── SelectFunnelType.jsx
│   ├── CreateWarmap.jsx
│   ├── EditWarmap.jsx
│   └── ViewWarmap.jsx
├── App.jsx           # Router setup
├── main.jsx          # Entry point
└── index.css         # Tailwind styles
```

## Deployment

### Vercel

```bash
npm install -g vercel
vercel
```

Add environment variables in the Vercel dashboard.

### Netlify

```bash
npm run build
```

Drag the `dist/` folder to Netlify and add environment variables.

## License

MIT
