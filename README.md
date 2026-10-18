# Minimal Marketplace — .NET + Angular project in 2026

A small, complete full-stack app with current tooling:

- **Backend**: ASP.NET Core Web API (C#), .NET 10, EF Core 10 + PostgreSQL, Swagger/OpenAPI, Docker.
  The schema is SQL-first: hand-written scripts in `backend/Marketplace.Data/Db/Scripts/` own it, applied at startup by [DbUp](https://dbup.readthedocs.io/). EF Core is the data access layer only — it maps onto those tables, it does not generate them.
- **Frontend**: Angular (standalone components, new `@if`/`@for` control-flow syntax, esbuild builder), calling the backend over a REST API with `HttpClient`.
- **Data**: Products belong to Categories. Full CRUD on both, via REST.
- **DevOps**: multi-stage Dockerfiles for both apps, a `docker/docker-compose.yml` that wires up Postgres + API + Angular (served by nginx, which reverse-proxies `/api` to the backend), and a GitHub Actions CI/CD pipeline (build → build images → push to a container registry).

This is deliberately "simple but real": it's small enough to read end to end in an afternoon, but structured the way a production project would be (DTOs, layered controllers, containerized, CI-ready) — a good base to extend with auth, tests, pagination, etc.

## Project structure

```
marketplace-app/
├── backend/
│   ├── Marketplace.sln
│   ├── .dockerignore           # sits at the build-context root (backend/)
│   ├── Marketplace.Api/        # web layer only
│   │   ├── Controllers/        # ProductsController, CategoriesController (REST endpoints)
│   │   ├── Dtos/               # Request/response records (never expose entities directly)
│   │   ├── Program.cs          # Minimal hosting model: DI, CORS, Swagger, SQL scripts on startup
│   │   └── Dockerfile          # built with backend/ as the context, not Marketplace.Api/
│   └── Marketplace.Data/       # data layer: the API references it, it references nothing of the API
│       ├── Models/             # Entities: Product, Category
│       ├── MarketplaceDbContext.cs
│       ├── ServiceCollectionExtensions.cs   # AddMarketplaceData(connectionString)
│       └── Db/                 # SQL-first schema: Scripts/*.sql + the DbUp runner
├── frontend/
│   ├── src/app/
│   │   ├── models/             # TS interfaces mirroring the API DTOs
│   │   ├── services/           # ProductService, CategoryService (HttpClient wrappers)
│   │   └── components/         # product-list, product-detail, product-form, category-list
│   ├── nginx.conf              # Serves the Angular build + proxies /api to the backend
│   └── Dockerfile
├── docker/
│   ├── docker-compose.yml      # Full stack: Postgres + API + Angular/nginx
│   └── docker-compose-local.yml # Postgres only (port 7411), for running the API natively
└── .github/workflows/ci-cd.yml # Build, test hook, and container image publish
```

## 1. Best IDE on macOS (no Visual Studio needed)

Visual Studio itself isn't available on Mac, but you have two very good options:

**JetBrains Rider (recommended)** — a paid, full-featured IDE (free for non-commercial/student use) that handles the *entire* stack well: first-class C#/.NET debugging, EF Core tooling, Docker/Compose integration, and solid Angular/TypeScript support all in one app. If you want the closest experience to Visual Studio, with the least fiddling, this is it.

**VS Code + extensions (free)** — perfectly capable, and what most .NET-on-Mac developers use day to day:
- [C# Dev Kit](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit) (official, includes IntelliSense, debugging, test explorer)
- [Angular Language Service](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template) (official Angular team extension)
- [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker) extension for the Dockerfiles/Compose

Either works fine with everything below. The steps use the CLI (`dotnet`, `ng`, `docker`) throughout, so you can follow along regardless of IDE.

## 2. Install prerequisites (macOS)

```bash
# Homebrew (skip if already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# .NET SDK (10, current LTS)
brew install --cask dotnet-sdk

# Node.js (LTS) — needed for Angular CLI/npm
brew install node

# Angular CLI
npm install -g @angular/cli

# Docker Desktop (for Postgres locally + full docker-compose stack)
brew install --cask docker
```

Then open a **new terminal tab** (so `PATH` picks up the new tools) and verify:

```bash
dotnet --version   # should print 10.x
node --version     # v22.x or similar LTS
ng version         # Angular CLI ...
docker --version
```

If any package version above has moved on by the time you read this, `brew search`/`brew info` will show what's current — the steps stay the same.

## 3. Run the backend locally (without Docker)

Start only a Postgres container (fastest inner loop while coding the API):

```bash
# from the repo root - Postgres only, published on port 7411
docker compose -f docker/docker-compose-local.yml up -d
```

Port **7411** is what `appsettings.Development.json` points at, so the API connects with no further configuration. Stop it again with `docker compose -f docker/docker-compose-local.yml down` (add `-v` to drop the data).

Then, from `backend/Marketplace.Api`:

```bash
cd backend/Marketplace.Api
dotnet restore
dotnet run
```

You should see it listening (by default on `http://localhost:5187` for this project's `launchSettings`, or whatever port the console prints — check the console output). Open **`http://localhost:<port>/swagger`** to see and try the REST API interactively. `GET /api/products` and `GET /api/categories` should already return the seeded sample data.

> Note: `Program.cs` calls `DatabaseMigrator.Run(...)` on startup, which applies any not-yet-applied script from `Db/Scripts/` — so the schema is created and seeded on first run with no extra commands, in dev and in containers alike.

### Changing the schema

The `.sql` files are the source of truth, so there is no `dotnet ef migrations` step:

1. Add a new `backend/Marketplace.Data/Db/Scripts/NNN_Description.sql` (the `NNN` prefix sets the run order).
2. Mirror the change in `Marketplace.Data/MarketplaceDbContext.cs` (`OnModelCreating`) so EF knows about it.
3. Restart the API — DbUp applies only the new script.

**Never edit a script that has already been applied.** DbUp journals each one in a `schemaversions` table and skips it forever after; a change to an old file silently never runs. Write a new script instead.

**Never rename or move a script either.** DbUp journals scripts by embedded-resource name (`Marketplace.Data.Db.Scripts.001_InitialSchema.sql`), so moving one makes DbUp treat it as new and re-run it — `001` then fails with `relation "categories" already exists` and the API refuses to start. Realign the journal rather than the scripts:

```sql
UPDATE schemaversions SET scriptname = replace(scriptname, '<old prefix>.', '<new prefix>.');
```

## 4. Run the frontend locally

In a separate terminal, from `frontend/`:

```bash
cd frontend
npm install
ng serve
```

Open **`http://localhost:4200`**. You should see the Products page, backed live by the API you started in step 3 (the dev environment points at `http://localhost:5187/api` — adjust `src/environments/environment.ts` if `dotnet run` printed a different port).

**If `npm install` pulls a much newer Angular than the `^19.0.0` pinned in `package.json`:** that's fine, the code here uses stable APIs (standalone components, `inject()`, the `@if`/`@for` control-flow syntax) that work the same across recent Angular versions. If you'd rather guarantee you're on the true current release, scaffold a throwaway project with `ng new tmp-app` and diff its generated `angular.json`/`package.json` against the ones here, or simply bump the version numbers before installing.

At this point you have a working full-stack app running natively on your Mac — good for day-to-day development.

## 5. Run everything with Docker Compose (the "DevOps" path)

This builds both apps into containers and wires them to a Postgres container, exactly like a real deployment:

```bash
# from the repo root
docker compose -f docker/docker-compose.yml up --build
```

(Or `cd docker && docker compose up --build` — the compose file pins `name: marketplace-app`, so the project, its containers and its volume are named the same either way.)

- Angular (built for production, served by nginx): **http://localhost:8099**
- API directly (e.g. for Swagger/debugging): **http://localhost:5187/swagger** *(Swagger is only enabled when `ASPNETCORE_ENVIRONMENT=Development`; flip that env var in `docker/docker-compose.yml` if you want it available here too)*
- Postgres: exposed on **localhost:7412** if you want to connect a DB GUI (e.g. TablePlus, DBeaver)

Stop everything with `docker compose -f docker/docker-compose.yml down` (add `-v` to also drop the database volume and start fresh next time).

This is the shape you'd hand to a CI/CD pipeline or a cloud VM: three services, one command, no machine-specific setup beyond Docker.

## 6. CI/CD pipeline

`.github/workflows/ci-cd.yml` is ready to use if you push this to GitHub:

1. Builds the backend (`dotnet build`) and frontend (`ng build`) on every push/PR — catches breakage early.
2. On pushes to `main`, builds both Docker images and pushes them to GitHub Container Registry (`ghcr.io`), tagged `latest` and with the commit SHA.
3. Has a placeholder comment where you'd add an actual deploy step (SSH + `docker compose pull && up -d` onto a VM, or push to Azure Container Apps / AWS ECS / Kubernetes — whichever you want to practice next).

No secrets to configure for steps 1–2 (uses the automatic `GITHUB_TOKEN`); you'd add deployment credentials as repo secrets once you wire up step 3.

## Suggested next exercises

Once this is running, good ways to keep working on top of it:
- Add JWT authentication (ASP.NET Core Identity or a lightweight custom scheme) and protect the write endpoints.
- Add a `Marketplace.Api.Tests` project (xUnit + `WebApplicationFactory`) and wire it into the CI job that's commented out.
- Add pagination/sorting to `GET /api/products`.
- Add an Angular `HttpInterceptor` for centralized error handling/loading state.
- Swap the manual DTO mapping for a small mapper (or keep it manual — it's honestly fine at this scale).
