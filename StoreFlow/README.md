# StoreFlow — Supermarket Operations Management System

*"Keep the store moving."*

StoreFlow is a full-stack operations platform for supermarket teams: tasks, attendance,
inventory, restocking, cleaning, deliveries, customer service, and a full Employee ID
system, all wired together and backed by a real database.

- **Frontend:** HTML5 / CSS3 / vanilla JavaScript (no framework), Fetch API
- **Backend:** C# / ASP.NET Core 8 Web API, EF Core, JWT authentication
- **Database:** SQLite for local development, with a production recommendation below

---

## 1. Project structure

```
StoreFlow/
  Backend/                 ASP.NET Core Web API
    Controllers/           One controller per module (Tasks, Inventory, Employees, ...)
    Models/                EF Core entities + enums
    DTOs/                  Request/response contracts
    Data/                  DbContext + SeedData
    Services/              Cross-cutting services (JWT, employee ID generation,
                            notifications, activity log, current-user accessor)
    Helpers/                Password hashing, JWT token generation
    Middleware/             Global exception handling
    Program.cs              App startup, DI, auth, CORS, schema creation + seed on boot
    appsettings.json
  Frontend/                 Static HTML/CSS/JS app (no login page — see Demo accounts below)
    index.html               Main app shell (sidebar, topbar, view router, startup sequence)
    css/                       Design tokens, base styles, components, layout, responsive
    js/
      api.js, auth.js, state.js, router.js    Core plumbing
      components/                              Toast + modal helpers
      views/                                    One file per module (dashboard, tasks, ...)
  .env.example
  render.yaml
  README.md (this file)
```

This project intentionally keeps domain logic inside controllers (rather than a full
repository + service-per-entity layering) given the number of modules involved, while
still isolating true cross-cutting concerns — JWT issuing, employee ID generation,
notifications, and activity logging — into their own services. This keeps ~40 endpoints
consistent and easy to follow without hundreds of near-duplicate interfaces.

---

## 2. Local setup

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- A static file server for the frontend (VS Code "Live Server" extension, `npx serve`,
  or Python's `http.server` all work — the frontend is plain static files)

### Backend

```bash
cd Backend
dotnet restore

# Run the API — this creates the schema straight from the EF Core model
# (no migration files to generate), creates storeflow.db, and seeds demo
# data automatically on startup:
dotnet run
```

The API listens on **http://localhost:5080** (configured in
`Properties/launchSettings.json`). Swagger UI is available at
`http://localhost:5080/swagger` in development.

### Frontend

The frontend is plain static files — no build step. From the `Frontend/` folder, serve
it with any static server, for example:

```bash
cd Frontend
npx serve -l 5500
# or: python3 -m http.server 5500
```

Then open **http://localhost:5500/login.html**.

`Frontend/js/config.js` points the UI at `http://localhost:5080/api` by default. If you
run the backend on a different port, update `window.STOREFLOW_API_BASE` there.

> The backend's `appsettings.json` CORS list already allows `http://localhost:5500` and
> `http://127.0.0.1:5500`. If you serve the frontend from a different port, add it to
> `Cors:AllowedOrigins` in `appsettings.json` (or via the `Cors__AllowedOrigins__N`
> environment variables shown in `.env.example`).

### Demo accounts

There's no login screen — opening `index.html` automatically signs in as the
demo manager account (`manager@storeflow.local` / `Password123!`) so the app
is immediately browsable after deploying, which matters if you're pushing
straight to a host without standing up the backend's real auth flow for
every visitor. The backend's actual authentication (JWT, password hashing,
roles, deactivation) is unchanged — only the visible login *screen* was
removed. If you want a real per-user login screen back later, add one that
calls `POST /api/auth/login` the same way `Auth.login()` in
`Frontend/js/auth.js` already does, and swap `Auth.ensureSession()`'s silent
demo login for a redirect to it.

Nine more seeded employees (STF0002 through STF0010) share the same
password, and you can still call the login endpoint directly (e.g. from
Swagger) to explore the app as any of them — Sarah Williams (STF0002),
Aisha Khan (STF0003), and so on.

---

## 3. Deployment

Both halves deploy from **one Render account, one Blueprint file
(`render.yaml`)** — no Vercel involved. Render doesn't support .NET as a
serverless runtime any more than Vercel does, but unlike Vercel it also
offers plain long-running Docker web services *and* static site hosting side
by side, so one platform covers both halves of this app.

### Deploy both services

No local setup step needed — just push the repo to GitHub, then:

1. In Render, choose **New → Blueprint** and point it at your repo. Render
   reads `render.yaml` and creates two services in one go:
   - `storeflow-api` — the ASP.NET Core backend, built from
     `Backend/Dockerfile`. On first boot it creates the SQLite schema
     directly from the EF Core model (`Database.EnsureCreated()`) and seeds
     demo data — no migration files to generate or commit beforehand.
   - `storeflow-frontend` — the static frontend, served directly from
     `Frontend/` with no build step.
2. Render assigns each service its own URL, e.g.
   `https://storeflow-api.onrender.com` and
   `https://storeflow-frontend.onrender.com`.
3. Two placeholder values need updating with those real URLs after the first
   deploy (Render can't know them beforehand):
   - On `storeflow-api`, set the `Cors__AllowedOrigins__0` environment
     variable to your real frontend URL, then redeploy that service.
   - In `Frontend/js/config.js`, set `window.STOREFLOW_API_BASE` to your real
     backend URL + `/api` (e.g. `https://storeflow-api.onrender.com/api`),
     commit, and push — `storeflow-frontend` redeploys automatically.
4. From then on, **every `git push` redeploys both services automatically**
   — the same "push and it builds" workflow Vercel gives you for static
   sites, just covering the API too.

### Why not Vercel

Vercel only runs serverless functions (Node.js, Python, Go, Ruby) — there's
no .NET runtime option, so ASP.NET Core can't run there at all, not just
"poorly." Even setting that aside, SQLite needs a persistent writable file,
and every serverless invocation gets a throwaway filesystem, so the database
would reset (or fail outright) on every request. Render's plain Docker web
services don't have either limitation.

If you'd rather split platforms anyway — say, Vercel for the frontend's CDN
and edge network, Render for the API — that still works: just point
`Frontend/js/config.js` at Render's API URL and set `Cors__AllowedOrigins__0`
to your Vercel URL instead of the Render frontend URL. The `render.yaml`
blueprint would then only need its `storeflow-api` service.

### Production database recommendation

**Do not use SQLite in production.** It's a single file with limited concurrent-write
support, and Render's free tier (like most platforms) doesn't guarantee a persistent
disk between deploys — you'd lose your data on every redeploy. SQLite here is a
deliberate choice for local development and demoing only.

For production, point `ConnectionStrings:DefaultConnection` at a managed relational
database instead:

- **PostgreSQL** (Render has a built-in managed Postgres offering, or use Supabase,
  Neon, or Azure Database for PostgreSQL) — swap the
  `Microsoft.EntityFrameworkCore.Sqlite` package for
  `Npgsql.EntityFrameworkCore.PostgreSQL` and update `UseSqlite(...)` to `UseNpgsql(...)`
  in `Program.cs`.
- **Azure SQL / SQL Server** — swap in `Microsoft.EntityFrameworkCore.SqlServer` and
  `UseSqlServer(...)`.

The EF Core models are provider-agnostic at the code level; only the package reference
and the one `UseXxx(...)` call in `Program.cs` need to change. If you later want real
incremental schema migrations instead of `EnsureCreated()` (worth doing once you move
off SQLite to a persistent production database), switch back to `dotnet ef migrations
add` + `Database.Migrate()` — see the note in "Known simplifications" below.

---

## 4. Security notes

- Passwords are hashed with BCrypt (`BCrypt.Net-Next`), never stored in plain text.
- Authentication uses JWT bearer tokens (`Jwt:Key` **must** be replaced with a real
  random secret before any real deployment — the placeholder in `appsettings.json` is
  for local development only).
- All endpoints except `/api/auth/login` require a valid bearer token; manager-only
  endpoints are additionally protected with `[Authorize(Roles = "Manager")]` and
  double-checked in a few places (e.g. attendance history) against the requesting
  user's own ID.
- Employee IDs (`STF-0001`, ...) are generated **server-side only**, inside a
  mutex-guarded generator that scans existing IDs, so two concurrent employee creations
  can't collide.
- Deactivating an employee blocks login (`EmploymentStatus` check in `/auth/login`) but
  never deletes their historical tasks, attendance, or activity records.
- EF Core's parameterized queries are used throughout (no raw SQL), which rules out SQL
  injection from user input.

---

## 5. Manually verified workflows

Each of these was traced end-to-end against the actual controller/DTO/frontend code
before delivery:

1. **Login → Dashboard → Create Task → Assign Employee → Change Status → Complete Task**
   `POST /auth/login` → `GET /dashboard` → `POST /tasks` → drag card / `PATCH
   /tasks/{id}/status` → assignee gets a notification → task shows in "Done" column.
2. **Login → Clock In → Start Break → End Break → Clock Out**
   `POST /attendance/clock-in` blocks a second concurrent clock-in; `break/start` and
   `break/end` are order-enforced; `clock-out` is blocked while a break is open.
3. **Inventory → Find Milk → Reduce Quantity → Low Stock Warning → Create Restocking
   Task → Complete Restock → Inventory Updates**
   `PATCH /inventory/{id}/quantity` recomputes `Status` via `ComputeStatus(...)`; a
   restocking task references the same `InventoryItemId`; completing it
   (`PATCH /restocking/{id}/complete`) increments the item's quantity and recomputes
   status again.
4. **Delivery → Mark Delayed → Dashboard Warning Appears**
   `PUT /deliveries/{id}` with `status: "Delayed"` is reflected in
   `GET /dashboard`'s `deliveriesDelayed` count and the delivery card's red border.
5. **Customer Service → Create Issue → Assign Employee → Update Status → Resolve Issue**
   `POST /customer-issues` → `PUT /customer-issues/{id}` (assign + status) → assignee is
   notified → `Resolved` sets `ResolvedAt`, feeding into the resolution-time report.
6. **Task → Add Comment → Activity Feed Updates → Notification Appears**
   `POST /tasks/{id}/comments` logs an `ActivityLog` row (visible on the dashboard feed)
   and notifies the assignee (and any `@Name` mention it detects).
7. **Manager → Reports → View real statistics generated from database data**
   `GET /reports` computes every figure from live EF Core queries (completed/overdue
   tasks, per-employee hours from `Attendance`, inventory alert counts, customer
   resolution times) — nothing is hardcoded.

---

## 6. Known simplifications

Being upfront about a few pragmatic choices made to keep ~40 endpoints and ~30 frontend
views consistent and shippable:

- **No separate repository layer.** Controllers talk to `StoreFlowContext` (EF Core)
  directly, with `NotificationService`, `ActivityLogService`, `EmployeeIdGenerator`, and
  `CurrentUserService` pulled out as the genuinely cross-cutting pieces.
- **Schema creation uses `EnsureCreated()`, not migrations.** This means zero local setup
  before pushing — the schema is built straight from the current model on startup — but
  it also means there's no migration history and no automatic schema-upgrade path if you
  change a model later against an existing database with real data in it. Fine for this
  demo (SQLite resets on most redeploys anyway); switch to `dotnet ef migrations add` +
  `Database.Migrate()` once you're on a persistent production database you actually need
  to evolve over time without losing data.
- **JWT is stateless**, so `/api/auth/logout` is a no-op on the server (kept for a clean
  API contract) — the frontend simply discards the token from `localStorage`.
- **@mentions** in task comments do a simple case-sensitive name match rather than a
  full mention-picker UI.
- **Delivery numbers** are generated as `DLV{n}` from a running count rather than a
  fully collision-proof scheme — fine for demo volume, worth hardening (e.g. a dedicated
  sequence table) before high-concurrency production use.
- This project was authored without a live .NET compiler in the loop, so while every
  file was checked carefully for consistency (matching DTO field names end-to-end,
  balanced braces, route conflicts, etc.), **run `dotnet build` yourself as the first
  real compile check** before relying on it.
