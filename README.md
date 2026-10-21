# ICONIC ESPORTS 🎮🇮🇳
### Professional BGMI Esports Tournament Platform

**ICONIC ESPORTS** is a production-grade competitive esports tournament and matchmaking platform engineered specifically for **Battlegrounds Mobile India (BGMI)**. It bridges grassroots squads with franchised tier-1 esports organizations across India.

---

## ⚡ Key Highlights & Features

1. **Official BMPS 2026 Grand Finals Integration:**
   - 100% verified tournament data from JECC Jaipur (₹4 Crore prize pool, 18 LAN matches).
   - Authentic standings, points, WWCD counts, and MVP accolades.
2. **36 Verified Professional Indian BGMI Teams & 180+ Athletes:**
   - Real-life rosters (Hero Xtreme GodLike, Divine Gaming, Vasista, Gods Reign, Team Apex Gaming, Orangutan, Team Tamilas, Versatile, Reckoning, SouL, Global Esports, Gladiators, Big Brother, Carnival, Entity, Hydra, Gujarat Tigers, etc.).
   - Verified Character UIDs, official tags, and starter/substitute allocations.
3. **Official BGMI 10-Point Scoring Engine:**
   - WWCD: 10 pts | 2nd: 6 pts | 3rd: 5 pts | 4th: 4 pts | 5th: 3 pts | 6th: 2 pts | 7th–8th: 1 pt | 9th–16th: 0 pts.
   - 1 point per finish (kill).
   - Strict tiebreaker hierarchy: Total Points $\rightarrow$ WWCDs $\rightarrow$ Placement Points $\rightarrow$ Finish Points.
4. **Time-Gated Anti-Leak Room Credentials:**
   - Custom Room ID and Password are protected and released exclusively to verified roster athletes assigned to that specific match lobby.
5. **Slot Mapping Hub (Slots 1–25):**
   - Slot #1 reserved strictly for Tournament Host & Official Referees.
   - Atomic concurrency protection preventing double-booking during registration.
6. **Multi-Role Experience:**
   - **Player Panel:** Character UID identity, roster management, squad registration.
   - **Organizer Panel:** Match room scheduling, result submission, evidence uploads.
   - **Admin Control Room:** Platform analytics, organizer approval, user role oversight, audit logs.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend:** Node.js, Express, TypeScript, Socket.IO, Cookie-Parser, JWT, bcryptjs
- **Database & ORM:** Prisma ORM connected to **Supabase PostgreSQL** with connection pooling
- **Security:** HTTP-only cookies, verified server-side role resolution, anti-leak room credential gates

---

## 🚀 Quick Start Guide

### 1. Installation
```bash
npm run install:all
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the server directory:
```bash
cp server/.env.example server/.env
```
Ensure your `DATABASE_URL` (Supabase connection string) and `JWT_SECRET` are set.

### 3. Seed Verified BMPS 2026 & 36 Squads
```bash
npm run seed
```

### 4. Run Automated Test Suite
```bash
npm --prefix server test
```

### 5. Launch Development Environment
```bash
npm run dev
```
- Client runs at: `http://localhost:5173`
- Backend API runs at: `http://localhost:5000`

### 6. Build for Production
```bash
npm run build
```

---

## 🔑 Pre-Configured Verified Staff & Test Accounts

| Role | Email / Identifier | Password | Details |
| :--- | :--- | :--- | :--- |
| **Platform Administrator** | `admin@kraftonindiaesports.com` | `admin123` | Full administrative oversight & audit access |
| **Official League Referee** | `referee@kraftonindiaesports.com` | `password123` | Match room operations & result verification |
| **BMPS Champion Captain** | `manya@godlike.in` | `password123` | Hero Xtreme GodLike Captain (IGN: `GODL Manya`, UID: `5124891024`) |
| **Top Fragger / Eliminator** | `jonathan@apex.in` | `password123` | Team Apex Gaming (IGN: `APEX JONATHAN`, UID: `5123984019`) |

---

## 🛡️ Security & Integrity Protocols
- **Emulator Prohibited:** Strict mobile/tablet physical device enforcement.
- **Roster Snapshotting:** Squad rosters are cryptographically snapshotted upon tournament registration approval.
- **Role Verification:** Client-forged roles are overridden by live database state.
