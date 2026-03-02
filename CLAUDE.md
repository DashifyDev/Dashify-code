# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow Rules

- **Never run any git commands.** Do not commit, stage, branch, push, or run any `git` CLI commands. Leave all version control operations to the user.

## Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint (note: ignored during builds via next.config.js)
npm run format       # Prettier format all files
npm run init-db      # Initialize MongoDB indexes
npm run migrate-tiles # Migrate tile mobile profiles
```

No test runner is configured — there are no test files in this codebase.

## Architecture

**Dashify/Boardzy** is a Next.js 13 dashboard builder where users create boards containing draggable/resizable tiles. It uses the App Router for pages and the Pages Router exclusively for API routes.

### Routing Split

- `src/app/` — App Router: pages only (dashboard view, library, how-to-use, admin)
- `src/pages/api/` — Pages Router: all API endpoints (no app router API routes)
- `src/pages/404.js` — Custom 404 page

### Data Layer

- **MongoDB + Mongoose** via `src/lib/utils.js` (db connection helper)
- **Models**: `src/models/` — `User`, `Dashboard`, `Tile`, `Pod`, `Template`
- **TanStack Query v4** for all client-side data fetching with query key factories in `src/hooks/useDashboard.js` (`dashboardKeys`)
- **Axios** wrapped in an optimized instance in `src/hooks/useOptimizedQuery.js`

### Core Data Model

- `User` owns many `Dashboard`s (boards)
- `Dashboard` contains arrays of `Tile` ObjectIds and `Pod` ObjectIds
- `Pod` is a container that groups `Tile`s and has its own position/size
- `Tile` has desktop position (`x`, `y`, `width`, `height`) and mobile position (`mobileX`, `mobileY`, `mobileWidth`, `mobileHeight`), plus `order` for text editor navigation

### State Management (Two Contexts)

- **`globalContext`** (`src/context/appContext.js`) — Legacy context: holds `tiles`, `boards`, `dbUser`, `activeBoard`. Still used by `Header.js` for board list and mutations.
- **`optimizedContext`** (`src/context/optimizedContext.js`) — React Query–backed context for board lists; `setBoards`, `setTiles`, `setActiveBoard` are deprecated no-ops here.

Both contexts are mounted in `src/app/layout.js`. The dashboard page (`src/app/dashboard/[id]/page.js`) primarily reads from `optimizedContext` via `useDashboardData`.

### Auth & Guest Mode

- Auth0 (`@auth0/nextjs-auth0`) handles authentication
- Unauthenticated guests get admin-seeded boards (`hasAdminAdded: true`) and can create local boards stored in `localStorage` under key `"Dasify"`
- On login, guest localStorage data is migrated to the DB via `/api/manage/addGuestData`
- `src/utils/safeLocalStorage.js` wraps localStorage access safely

### API Routes (`src/pages/api/`)

- `dashboard/[id].js` — GET/PATCH/DELETE a single dashboard
- `dashboard/addDashboard.js` — POST create / GET list by userId or sessionId
- `dashboard/defaultDashboard.js` — GET admin-seeded boards (for guests)
- `tile/[id].js` — GET/PATCH/DELETE single tile
- `tile/tiles.js` — POST batch create tiles
- `tile/batch-update.js` — PATCH batch update tile positions
- `manage/getUser.js` — POST get or create DB user from Auth0 user
- `manage/uploadImage.js` — POST upload to Cloudinary

### Key Frontend Components

- `GridTiles.js` — Desktop drag-and-resize grid using `react-rnd`
- `MobileGridTiles.js` — Mobile layout (stacked, sorted by `order`)
- `Header.js` — Board list, add/delete/rename boards, tile type selector
- `TipTapEditor/` — Rich text editor for tile content (TipTap v3)
- `SideDrawer.js` — Settings panel for tile appearance

### Path Alias

`@/*` maps to `src/*` (configured in `jsconfig.json`).

### Styling

Tailwind CSS + MUI (Material UI v5 with Emotion). Global styles in `src/app/globals.css`. Custom theme in `src/app/theme/`.

### Image Handling

Cloudinary for uploads. `next/image` configured with remote patterns for `res.cloudinary.com`, `images.unsplash.com`, and Google user content. Sharp is used server-side for optimization.

## Coding Conventions

### Formatting (`.prettierrc`)

Double quotes, semicolons, 2-space indent, printWidth 100, trailing commas (es5), arrowParens: avoid, endOfLine: lf. Run `npm run format` before committing.

### JavaScript Rules

- `const` over `let`, never `var`
- No `console.log` in committed code — use `console.warn` for expected edge cases, `console.error` for real errors
- No unused variables; prefix intentionally unused ones with `_`
- No duplicate imports
- Always use `safeSetItem`/`safeGetItem` from `src/utils/safeLocalStorage.js` — never raw `localStorage` calls

### File Size Guidelines

| Type           | Max Lines |
| -------------- | --------- |
| Component      | 200       |
| API route      | 150       |
| File (general) | 400       |

Split larger files into focused modules.

### Naming Conventions

| Type       | Convention                        | Example                             |
| ---------- | --------------------------------- | ----------------------------------- |
| Components | PascalCase                        | `GridTiles.js`, `SideDrawer.js`     |
| Hooks      | camelCase + `use` prefix          | `useDashboard.js`, `useIsMobile.js` |
| API routes | camelCase or `[param].js`         | `addDashboard.js`, `[id].js`        |
| Models     | camelCase file, PascalCase export | `dashboard.js` exports `Dashboard`  |
| Utils      | camelCase                         | `safeLocalStorage.js`               |

### Component Patterns

- Use `next/dynamic` with `ssr: false` for heavy client components (GridTiles, MobileGridTiles, TipTap editor)
- Add `'use client'` to any App Router component using hooks, state, or browser APIs
- Mongoose models must use `models.X || model('X', schema)` pattern to prevent hot-reload re-registration
