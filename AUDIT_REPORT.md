# ICONIC ESPORTS — System Audit & Upgrade Architecture Report
**Author:** Principal Software Architect & Senior Full-Stack Engineer  
**Date:** October 2026  
**Platform Target:** Battlegrounds Mobile India (BGMI) Competitive Ecosystem  

---

## 1. Executive Summary

**ICONIC ESPORTS** is a specialized competitive platform engineered for the Battlegrounds Mobile India (BGMI) esports ecosystem in India. The current codebase comprises a **React 18 / Vite / TypeScript / Tailwind CSS** single-page application and a **Node.js / Express / TypeScript / Prisma ORM** backend service connected to a **Supabase PostgreSQL** database instance.

This audit evaluates the codebase across structural integrity, feature completeness, database & schema alignment, authentication & role authorization, UX resilience, and production readiness.

---

## 2. Repository & Architecture Discovery

### 2.1 File & Directory Structure
```
iconicesports/
├── client/
│   ├── src/
│   │   ├── components/      # UI cards, tables, modals, navigation, buttons
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # 11 distinct view controllers
│   │   ├── api.ts           # Axios client with bearer token interceptor
│   │   ├── App.tsx          # Client-side router definition
│   │   ├── types.ts         # TypeScript schema definitions
│   │   ├── index.css        # Tailwind base and tactical styling tokens
│   │   └── main.tsx         # React root mounting
│   ├── index.html
│   ├── tailwind.config.js   # Custom BGMI esports tokens, colors, and shadows
│   ├── vite.config.ts       # Vite proxy config for API (/api) & Socket (/socket.io)
│   └── tsconfig.json
├── server/
│   ├── prisma/
│   │   ├── schema.prisma    # 11 relational models targeting Supabase PostgreSQL
│   │   └── seed.ts          # Comprehensive BGMI teams, athletes, and matches seed
│   ├── src/
│   │   ├── controllers/     # 8 modular REST controllers
│   │   ├── middleware/      # JWT verification & role authorization (ADMIN, ORGANIZER, etc.)
│   │   ├── prisma.ts        # Prisma client singleton
│   │   └── server.ts        # Express HTTP server & Socket.IO server initialization
│   ├── tsconfig.json
│   └── .env                 # Supabase PostgreSQL Pooler (6543) & Direct (5432) credentials
├── package.json             # Root concurrency scripts (install:all, dev, build, seed)
└── README.md
```

### 2.2 Tech Stack Alignment
- **Frontend:** React 18.3, Vite 5.4, TypeScript 5.7, Tailwind CSS 3.4, Lucide Icons, Framer Motion.
- **Backend:** Node.js, Express 4.21, TypeScript 5.7, Prisma 5.22, Socket.IO 4.8.
- **Database:** Supabase PostgreSQL with transaction pooler (`aws-1-ap-southeast-1.pooler.supabase.com:6543`) and direct session pooler (Port 5432).
- **Security:** bcryptjs password hashing, HTTP-only JWT cookies + Bearer token headers.

---

## 3. Comprehensive Feature Inventory

| Module / Feature | Classification | Technical Finding & Current Status |
| :--- | :---: | :--- |
| **Authentication (Login & Register)** | **B (Partially Implemented)** | Working JWT session & cookie generation, but login responses omit deep captain relations (`captainedTeams`), causing client captain checks to misfire before page refresh. |
| **User Profile Management** | **A (Working & Verified)** | Athlete IGN, 10-digit BGMI Character UID, role assignment, and device info persist and update cleanly. |
| **Official 10-Point Scoring Engine** | **A (Working & Verified)** | Accurate BGMI WWCD (10, 6, 5, 4, 3, 2, 1, 1, 0) and kill point matrix with automated tiebreaker cascades. |
| **Tournament Listing & Filters** | **A (Working & Verified)** | Format (Squad/Duo/Solo) and Status (Registration Open, Live, Completed) query filtering operates correctly. |
| **Tournament Squad Registration** | **B (Partially Implemented)** | Captain validation and 4-man roster check work; however, registrations previously lacked direct 1–25 slot allocation linkage. |
| **Slot Mapping Grid (Slots 1–25)** | **B (Partially Implemented)** | Read-only modal displays slot assignments (Slot 1 reserved for Host/Referees), but lacked direct slot claiming for captains. |
| **Match Room Credentials Delivery** | **A (Working & Verified)** | Anti-leak time gating and role authorization restrict access to registered athletes and staff; copy actions operational. |
| **Fragger & MVP Leaderboard** | **A (Working & Verified)** | Aggregates finishes, match counts, and MVP accolades across all tournament matches. |
| **Admin Dashboard: Tournaments & Matches** | **A (Working & Verified)** | Allows tournament publication, match room credential updates, and 10-point score submissions. |
| **Admin Dashboard: Squad Registrations Tab** | **C (UI-Only / Incomplete)** | Tab state declared in TypeScript union, but tab trigger and approval/rejection review view was omitted in UI. |
| **Real-time Live Sync** | **B (Partially Implemented)** | Socket.IO server configured with `join_match` and `leave_match` rooms, but client currently relies on polling/refetching. Supabase Realtime not yet connected. |
| **Asset Storage (Logos, Banners)** | **C (UI-Only / Mock URLs)** | Uses static Unsplash URLs and external links; Supabase Storage buckets for custom team crests and banners are missing. |
| **Button & Form Interaction Stability** | **B (Partially Implemented)** | Raw `<button>` elements previously lacked double-submission prevention and used intrusive browser `window.alert()` popups. |
| **Automated Testing Suite** | **E (Missing)** | Zero unit, integration, or E2E tests in both client and server packages. |

---

## 4. Prioritized Upgrade Plan

### Phase 1: Authentication Resilience, UI Stability & Slot Claiming (Immediate)
- **Goal:** Eliminate data-loss risks, provide resilient button states, and enable flawless slot reservation.
- **Tasks:**
  1. Return `captainedTeams` with roster members directly on login/registration responses.
  2. Implement reusable polymorphic `Button` with built-in loading locks, zero layout shifts, and BGMI styling tokens.
  3. Replace browser `alert()` popups with a lightweight in-app tactical Toast notification system.
  4. Enable explicit Slot Selection (Slots 2–25) during tournament registration and direct slot claiming from the slot modal.

### Phase 2: Admin Command Center Completion & Supabase Storage Integration
- **Goal:** Provide tournament organizers full roster control and native media uploads.
- **Tasks:**
  1. Add the Registrations Review tab in `AdminDashboardPage` with one-click slot approval and rejection.
  2. Configure Supabase Storage buckets for team crests, player avatars, and tournament banners.
  3. Wrap authenticated routes in protected route components to prevent unauthorized flashes.

### Phase 3: Supabase Realtime & Match Room Live State
- **Goal:** Instantaneous credential release and live lobby check-in.
- **Tasks:**
  1. Implement Supabase Realtime channels for instant room ID/password release and live match scoring updates.
  2. Add Captain Lobby Check-in button ("Squad Ready in Slot") to assist referees during room assembly.

### Phase 4: Quality Assurance, Security Hardening & CI/CD
- **Goal:** Production readiness and automated testing.
- **Tasks:**
  1. Add Vitest unit test suites for scoring calculations and slot collision logic.
  2. Add Zod payload validation to all Express endpoints.
  3. Configure Dockerfile or Vercel/Railway build manifests.

---

## 5. Recommended Next Safe Implementation Step

**Recommended Step 1:**  
Enhance client authentication flow (`AuthContext.tsx`), connect the new resilient `Button` and interactive slot claiming in `TournamentDetailPage.tsx` and `SlotListModal.tsx`, and deploy the non-blocking tactical Toast notification system.  
*Requires user approval before execution.*
