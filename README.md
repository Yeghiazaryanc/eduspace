# EduSpace — Full-Stack Learning Management System (LMS)

EduSpace is a production-oriented, full-stack Learning Management System built with **React, TypeScript, Node.js, Express, and PostgreSQL**. It provides role-based workflows for **Students** and **Administrators**, emphasizing clean architecture, network resilience, performance optimization, and automated testing.

---

## Key Features

### Student Experience
- **Course Discovery & Debounced Search:** Real-time course filtering with 500ms debouncing and automatic cancellation of stale network requests.
- **Enrollment Management:** Instant enrollment and unenrollment with dynamic course partitioning (`My Enrolled Courses` vs. `Available Courses`).
- **Interactive Learning Player:** Dedicated course viewer with validated YouTube embed playback, lesson playlists, and text materials.
- **Community Engagement:** Optimistic course liking with automatic rollback on failure, and paginated comment threads (`Load More`).
- **Profile & Preferences:** Instant multipart avatar uploads (with client/server validation), profile editing, and persistent Light/Dark theme synchronization across devices.
- **Smart Notifications:** Visibility-aware notification polling with read/clear actions.

### Admin Capabilities
- **Course Management (CRUD):** Create, edit, and delete courses with guarded form submissions.
- **Lesson Builder:** Add, update, and remove course lessons with automatic order management via reusable modals.

---

## Engineering & Architectural Highlights

- **Separation of Concerns (SOLID):** All asynchronous state, API communication, and business logic are isolated inside dedicated Custom Hooks (`useDashboard`, `useCourseDetails`, `useComments`, `useCourseActions`, `useNotifications`), keeping Page components thin and declarative.
- **Performance Optimizations:**
  - **Route-Based Code Splitting:** Implemented with `React.lazy` and `Suspense` to minimize initial bundle size and improve First Contentful Paint (FCP).
  - **Algorithmic Efficiency:** Replaced $O(N \times M)$ nested array lookups with a `Set`-backed $O(N)$ single-pass partitioning algorithm in `useDashboard`, and zero-allocation `.reduce()` counting in `useNotifications`.
  - **CLS Prevention:** Implemented Skeleton Loading states (`CourseCardSkeleton`) to prevent Cumulative Layout Shift during data fetches.
- **Network Resilience & Race Condition Protection:**
  - **Parallel Data Fetching:** Eliminated Request Waterfalls using `Promise.all` for independent API endpoints.
  - **`AbortController` Cleanup:** Prevents stale responses and Zombie State across rapid route changes, search queries, and background notification polling.
  - **Page Visibility API:** Pauses background notification polling when the browser tab is inactive to reduce server load and client battery usage.
  - **Centralized Axios Interceptors:** Automatic `Bearer` JWT injection, request timeouts, and global `401 Unauthorized` session recovery.
- **UX & Fault Tolerance:**
  - **Optimistic vs. Pessimistic UI:** Optimistic updates with snapshot rollback for low-risk actions (likes), and pessimistic confirmation for destructive actions (deletions).
  - **Error Boundaries:** Graceful runtime fallback UI preventing full application crashes.
- **Automated Testing:** Configured with **Vitest** and **React Testing Library** covering pure utility logic and DOM component rendering.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, React Router, Zustand, Axios, React Hot Toast |
| **Testing** | Vitest, React Testing Library, JSDOM, Jest-DOM |
| **Backend** | Node.js, Express, PostgreSQL, JWT Authentication, Multer |

---

## Project Structure

```text
eduspace/
├── client/                     # React + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components & __tests__
│   │   ├── hooks/              # Custom hooks (isolated business logic)
│   │   ├── pages/              # Route-level container pages (lazy-loaded)
│   │   ├── services/           # Centralized Axios instance & interceptors
│   │   ├── store/              # Zustand global stores (Auth, Theme)
│   │   ├── types/              # Shared TypeScript domain interfaces
│   │   └── utils/              # Pure helper functions & unit tests
│   ├── .env.example
│   └── package.json
├── server/                     # Node.js + Express + PostgreSQL Backend
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **PostgreSQL** (v14+ recommended)

### 1. Clone the Repository
```bash
git clone [https://github.com/Yeghiazaryanc/](https://github.com/Yeghiazaryanc/)<eduspace>.git
cd <eduspace>
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Update server/.env with your PostgreSQL credentials and JWT_SECRET
npm run dev
```

### 3. Frontend Setup
```bash
cd ../client
npm install
cp .env.example .env
# Ensure VITE_API_URL points to your running backend (default: http://localhost:3000)
npm run dev
```

### 4. Running Tests & Production Build
```bash
cd client
npm run test     # Run Vitest unit & component test suite
npm run build    # Type-check with TypeScript and create optimized production bundle
```

---

## Roadmap & Production Enhancements

- **CI/CD Pipeline:** GitHub Actions workflow to enforce `tsc`, `vitest`, and `vite build` checks on every Pull Request.
- **Containerization:** Multi-stage `Dockerfile` and `docker-compose.yml` for reproducible deployment of Frontend (Nginx), Backend, and PostgreSQL.
- **Real-Time Architecture:** Migrate notification Short Polling to **Server-Sent Events (SSE)** or WebSockets.
- **Enterprise Auth Security:** Transition JWT storage from `localStorage` to `HttpOnly`, `Secure`, `SameSite=Strict` cookies with Refresh Token Rotation.