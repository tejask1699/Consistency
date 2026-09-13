# 🎯 Consistent — Build Your Rhythm

A modern, high-performance daily habit & routine tracker designed to help you build consistency, track active streaks, and visualize momentum. 

Built with **Next.js 16 (React 19)**, **Redux Toolkit**, **Drizzle ORM**, and **Neon Serverless PostgreSQL**.

---

## ✨ Features

- **🔐 User Authentication**: Secure registration and login using `bcryptjs` password hashing and HTTP-only JWT cookies (`jose`).
- **🧠 State Management**: Global user session management with **Redux Toolkit** and **React-Redux**.
- **📅 Smart Task & Habit Recurrence**: Flexible scheduling supporting `Daily`, `Weekdays (Mon-Fri)`, `Weekly`, `Monthly`, and `One-time` routines without creating dummy DB rows.
- **⚡ Real-time Dynamic Analytics**: Live consistency scores, active streak tracking, and daily breakdown heatmaps calculated directly from PostgreSQL logs.
- **🗓️ Date Filtering**: Interactive date navigation to inspect past routines or plan upcoming days.
- **🎨 Modern Glassmorphism UI**: Beautiful dark-mode design system with Tailwind CSS and smooth micro-interactions.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router with Server Actions)
- **UI & Icons**: React 19, Tailwind CSS v4, Lucide Icons
- **State Management**: Redux Toolkit & React-Redux
- **Database**: Neon Serverless PostgreSQL
- **ORM**: Drizzle ORM & Drizzle Kit
- **Authentication**: JWT (`jose`) & `bcryptjs`

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- A Neon PostgreSQL Database account ([neon.tech](https://neon.tech/))

### 2. Clone Repository
```bash
git clone https://github.com/tejask1699/Consistency.git
cd Consistency
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
DATABASE_URL="postgresql://<user>:<password>@<neon-endpoint>.neon.tech/neondb?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key"
```

### 5. Run Database Migrations
Push the database schema directly to Neon DB:
```bash
npm run db:push
```

### 6. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```text
├── app/
│   ├── layout.tsx         # Root layout with Redux Provider
│   ├── page.tsx           # Main Dashboard (Today, Timeline, Calendar, Trends, Settings)
│   ├── login/page.tsx     # Glassmorphism Login & Sign-up page
│   └── globals.css        # Global CSS design tokens
├── lib/
│   ├── actions/
│   │   ├── auth.ts        # Server Actions for user register/login/logout
│   │   ├── tasks.ts       # Server Actions for habit CRUD & daily completion toggles
│   │   └── analytics.ts   # Server Actions for streak & consistency computations
│   ├── db/
│   │   ├── index.ts       # Neon HTTP Drizzle database connection
│   │   └── schema.ts      # PostgreSQL table schemas (users, tasks, task_logs, user_stats)
│   ├── store/
│   │   ├── index.ts       # Redux store & typed custom hooks
│   │   └── userSlice.ts   # Redux auth user slice
│   └── recurrence.ts      # Task recurrence calculation engine
└── middleware.ts          # Next.js route protection middleware
```

---

## 📜 Scripts

- `npm run dev`: Start local development server
- `npm run build`: Build production bundle
- `npm run start`: Start production server
- `npm run db:generate`: Generate Drizzle migration SQL files
- `npm run db:push`: Push Drizzle schema updates directly to Neon PostgreSQL

---

## 🛡️ License

Distributed under the MIT License.
