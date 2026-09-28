# Minimal Marketplace — .NET + Angular project in 2026

A small, complete full-stack app with current tooling:

- **Backend**: ASP.NET Core Web API (C#), .NET 10, EF Core 10 + PostgreSQL, Swagger/OpenAPI, Docker.
- **Frontend**: Angular (standalone components, new `@if`/`@for` control-flow syntax, esbuild builder), calling the backend over a REST API with `HttpClient`.
- **Data**: Products belong to Categories. Full CRUD on both, via REST.
- **DevOps**: multi-stage Dockerfiles for both apps, a `docker-compose.yml` that wires up Postgres + API + Angular (served by nginx, which reverse-proxies `/api` to the backend), and a GitHub Actions CI/CD pipeline (build → build images → push to a container registry).

This is deliberately "simple but real": it's small enough to read end to end in an afternoon, but structured the way a production project would be (DTOs, layered controllers, containerized, CI-ready) — a good base to extend with auth, tests, pagination, etc.

## Project structure

```
marketplace-app/
├── backend/
│   ├── Marketplace.sln
│   └── Marketplace.Api/
│       ├── Controllers/       # ProductsController, CategoriesController (REST endpoints)
│       ├── Models/            # EF Core entities: Product, Category
│       ├── Dtos/              # Request/response records (never expose entities directly)
│       ├── Data/               # DbContext + seed data
│       ├── Program.cs          # Minimal hosting model: DI, CORS, Swagger, migrations on startup
│       └── Dockerfile
├── frontend/
│   ├── src/app/
│   │   ├── models/             # TS interfaces mirroring the API DTOs
│   │   ├── services/           # ProductService, CategoryService (HttpClient wrappers)
│   │   └── components/         # product-list, product-detail, product-form, category-list
│   ├── nginx.conf              # Serves the Angular build + proxies /api to the backend
│   └── Dockerfile
├── docker-compose.yml          # Postgres + API + Angular/nginx, wired together
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

# EF Core CLI tool, used to create/apply migrations
dotnet tool install --global dotnet-ef
```

Then open a **new terminal tab** (so `PATH` picks up the new tools) and verify:

```bash
dotnet --version   # should print 10.x
node --version     # v22.x or similar LTS
ng version         # Angular CLI ...
docker --version
dotnet ef --version
```

If any package version above has moved on by the time you read this, `brew search`/`brew info` will show what's current — the steps stay the same.

## 3. Run the backend locally (without Docker)

Start only a Postgres container (fastest inner loop while coding the API):

```bash
docker run --name marketplace-db -e POSTGRES_DB=marketplace \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 -d postgres:16-alpine
```

Then, from `backend/Marketplace.Api`:

```bash
cd backend/Marketplace.Api
dotnet restore

# Create the initial migration from the models, then apply it to the DB
dotnet ef migrations add InitialCreate
dotnet ef database update

dotnet run
```

You should see it listening (by default on `http://localhost:5187` for this project's `launchSettings`, or whatever port the console prints — check the console output). Open **`http://localhost:<port>/swagger`** to see and try the REST API interactively. `GET /api/products` and `GET /api/categories` should already return the seeded sample data.

> Note: `Program.cs` also calls `db.Database.Migrate()` on startup, so once the migration exists, just running `dotnet run` again keeps the schema up to date automatically — handy in dev and in containers.

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
docker compose up --build
```

- Angular (built for production, served by nginx): **http://localhost:8080**
- API directly (e.g. for Swagger/debugging): **http://localhost:5187/swagger** *(Swagger is only enabled when `ASPNETCORE_ENVIRONMENT=Development`; flip that env var in `docker-compose.yml` if you want it available here too)*
- Postgres: exposed on **localhost:5432** if you want to connect a DB GUI (e.g. TablePlus, DBeaver)

Stop everything with `docker compose down` (add `-v` to also drop the database volume and start fresh next time).

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
