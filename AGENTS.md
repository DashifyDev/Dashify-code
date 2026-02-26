# AGENTS.md

Instructions for AI coding agents (OpenAI Codex, etc.) working in this repository.

## Project

**Boardzy/Dashify** — a Next.js 13 dashboard builder. Users create boards containing draggable, resizable tiles with rich text, images, and links. Supports Auth0 authentication and guest mode (localStorage).

## Commands

```bash
npm run dev      # Dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
npm run format   # Prettier (auto-fix)
npm run init-db  # Initialize MongoDB indexes (run once)
```

There is no test runner — no test files exist in this project.

## Critical Architecture Rules

### Routing Split — Never Violate
- `src/app/` — App Router: **pages and layouts only**
- `src/pages/api/` — **All API routes** (Pages Router). Never create API routes under `src/app/`.

### Data Model
- `User` → `Dashboard` (board) → `Tile[]` + `Pod[]`
- Tile has dual position: desktop (`x`, `y`, `width`, `height`) and mobile (`mobileX`, `mobileY`, `mobileWidth`, `mobileHeight`)
- Width/height always stored as strings: `"300px"` not `300`
- All Mongoose models: use `models.X || model(...)` to prevent re-registration

### State
- Two contexts exist intentionally: `globalContext` (legacy, Header.js) and `optimizedContext` (React Query–backed)
- `optimizedContext.setBoards` / `setTiles` are deprecated no-ops — use `queryClient.invalidateQueries` instead
- Query key factory: `dashboardKeys` in `src/hooks/useDashboard.js`

### Guest Mode
- Unauthenticated users store boards in `localStorage` key `"Dasify"`
- Always use `src/utils/safeLocalStorage.js` for localStorage access (never raw `localStorage`)

### API Routes
- Call `connectDB()` from `src/lib/utils.js` at the top of each API route handler
- Return `{ error: message }` with HTTP status codes on failure

## Code Standards

- **No `console.log`** in committed code — use `console.warn` / `console.error` only for real issues
- **Prefer `const`** over `let`; never `var`
- **Import alias**: `@/*` maps to `src/*`
- **Formatting**: Double quotes, semicolons, 2-space indent, printWidth 100
- **File size**: Components < 200 lines, API routes < 150 lines — split larger files
- **Dynamic imports**: Use `next/dynamic` with `ssr: false` for heavy client components (GridTiles, TipTap editor)

## Tech Stack

- Next.js 13.5 (App Router pages + Pages Router API)
- React 18, JavaScript (no TypeScript)
- MongoDB + Mongoose for persistence
- Auth0 (`@auth0/nextjs-auth0`) for auth
- TanStack Query v4 for client data fetching
- Axios for HTTP
- MUI v5 + Tailwind CSS for styling
- Cloudinary for image uploads
- TipTap v3 for rich text editing
- `react-rnd` for drag-and-resize tiles
