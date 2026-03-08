<h1 align="center">
  <br>
  <img src="https://raw.githubusercontent.com/Scryne/Scrutix/main/public/logo.png" alt="Scrutix" width="200" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI0MCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPijwn5OcKTwvdGV4dD48L3N2Zz4='">
  <br>
  Scrutix
  <br>
</h1>

<h4 align="center">Advanced Election Tracking & Prediction Platform</h4>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#installation">Installation</a> •
  <a href="#environment-variables">Environment Setup</a> •
  <a href="#license">License</a>
</p>

---

![Scrutix Preview](https://raw.githubusercontent.com/Scryne/Scrutix/main/public/preview.jpg "Scrutix Platform Preview") *(Add a preview image to `public/preview.jpg`)*

## 🔍 Overview

**Scrutix** is a comprehensive, modern web platform designed for in-depth election tracking, polling data visualization, and statistical predictions. Built with performance and scalability in mind, it provides real-time insights, interactive maps, and detailed demographic analysis for political events.

## ✨ Features

- **📊 Advanced Data Visualization**: Interactive charts using Recharts for polling trends, regional data, and prediction gauges.
- **🗺️ Interactive Election Maps**: High-performance, customizable map components powered by MapLibre GL JS for visualizing provincial and regional election results.
- **🔮 Prediction Engine**: Sophisticated algorithms for polling aggregation, historical baseline modeling, and demographic adjustments.
- **🛡️ Robust Security & Authentication**: Secure user authentication via NextAuth.js (Auth.js) and role-based access control.
- **⚡ Peak Performance**: Edge-optimized components, dynamic routing via Next.js 14 App Router, and server actions for optimal load times.
- **📈 Global Monitoring & Analytics**: Integrated with Vercel Analytics, Speed Insights, and Sentry for real-time error tracking and performance metrics.
- **🚦 Rate Limiting**: Upstash Redis implemented for API endpoint protection and rate-limiting.

## 🛠 Tech Stack

Scrutix leverages a modern and robust technology stack:

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (React, App Router, Server Components)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching**: [React Query](https://tanstack.com/query/latest)
- **Maps**: [MapLibre GL JS](https://maplibre.org/)
- **Charts**: [Recharts](https://recharts.org/)

### Backend & Database
- **Database**: PostgreSQL (via [Supabase](https://supabase.com/))
- **ORM**: [Prisma](https://www.prisma.io/)
- **Caching & Rate Limiting**: [Upstash Redis](https://upstash.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)

### DevOps & Monitoring
- **Deployment**: [Vercel](https://vercel.com/)
- **CI/CD**: GitHub Actions
- **Error Tracking**: [Sentry](https://sentry.io/)
- **Analytics**: Vercel Analytics & Speed Insights

## ⚙️ Architecture

```mermaid
graph TD;
    Client[Client UI - React/Next.js] -->|Server Actions / API Routes| Server[Next.js Backend];
    Server -->|ORM| DB[(PostgreSQL / Supabase)];
    Server -->|Rate Limit / Cache| Redis[(Upstash Redis)];
    Server -->|Auth Models| Auth[NextAuth.js];
    Client -->|Map Tiles| Map[MapLibre / GeoJSON];
    Server -->|Errors / Metrics| Sentry[Sentry];
```

## 🚀 Installation

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- PostgreSQL database (Local or Supabase)
- Upstash Redis account (Optional for local dev, required for prod rate limiting)

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Scryne/Scrutix.git
   cd Scrutix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy the example environment file and fill in your values (see [Environment Variables](#environment-variables)).
   ```bash
   cp .env.example .env.local
   ```

4. **Initialize Prisma (Database Setup)**
   Generate Prisma client and push the schema to your database.
   ```bash
   npm run db:generate
   npm run db:push
   ```
   *(Optional)* Seed the database with mock data:
   ```bash
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 🔑 Environment Variables

To run this project, you will need to add the following environment variables to your `.env.local` file. Refer to `.env.example` for a complete list, which includes:

```env
# Database (PostgreSQL via Supabase or Local)
DATABASE_URL="postgres://user:password@host:port/dbname?pgbouncer=true"
DIRECT_URL="postgres://user:password@host:port/dbname"

# NextAuth
AUTH_SECRET="your-secret-key" # Generate with: openssl rand -base64 32

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://your-endpoint.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"
```

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Scryne">Scryne</a>
</p>
