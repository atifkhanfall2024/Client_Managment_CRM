# ClientCRM — MongoDB Edition

Production-style Client Management CRM.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind
- **MongoDB** (Auth + all CRM data via Mongoose)
- JWT httpOnly session cookies
- Local file uploads (`/uploads`)

## Setup

### 1. Start MongoDB

Local example:

```text
mongodb://127.0.0.1:27017/clientcrm
```

Or use MongoDB Atlas and paste the URI into `.env.local`.

### 2. Env

```bash
cp .env.example .env.local
```

```env
MONGODB_URI=mongodb://127.0.0.1:27017/clientcrm
AUTH_SECRET=any-long-random-string
```

### 3. Run

```bash
npm install
npm run dev
```

Open http://localhost:3000/register and create a **Super Admin**.

## Modules

Auth, Users, Clients, Companies, Projects, Tasks, Documents, Notifications, Activity, Dashboard, Reports, Settings

## Notes

- Supabase has been removed from the runtime app.
- Old `supabase/migrations` SQL files are legacy reference only.
