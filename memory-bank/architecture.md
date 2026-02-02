# Architecture Overview

## Frontend Service (`capo-frontend-1`)

**Image**: Built from `Dockerfile.frontend`

**Base**: `node:20-alpine`

**Port**: `5173` (host) → `5173` (container)

**Command**: `npm run dev:frontend` (Vite dev server)

**Volumes**:
- `./ → /app` - Source code hot-reload
- `./logs/frontend → /app/logs` - Log collection
- `node_modules` - Isolated dependencies

## Backend Service (`capo-backend-1`)

**Image**: Built from `Dockerfile.backend`

**Base**: `node:20-alpine` with Convex CLI

**Ports**: `3210, 3211` (host) → `3210, 3211` (container)

**Command**: `npm run dev:backend:docker` (Convex local backend, non-interactive)

**Volumes**:
- `./convex → /app/convex` - Source code hot-reload
- `~/.convex → /root/.convex` - Database persistence (host's home directory)
- `./logs/backend → /app/logs` - Log collection
- `./.env.docker → /app/.env.docker` - Convex environment configuration
- `node_modules` - Isolated dependencies

## Network

**Name**: `capo-network`

**Type**: Bridge

**Service Discovery**:
- Frontend reaches backend at `http://backend:3210`
- Backend reaches frontend at `http://frontend:5173`

## Data Persistence

### What Persists

- **Convex SQLite Database** - Stored in `~/.convex` (host home directory)
- **All Convex schema and data** - Survives container restarts
- **Installed npm dependencies** - Cached in container layers
- **Deployment configuration** - Stored in `~/.convex/local.json`

### What Does NOT Persist

- **In-memory state** - Lost when containers stop
- **Build artifacts** - Rebuilt on container start
- **Temporary files** - Not mounted as volumes

### Critical: Host `.convex` Directory

The backend mounts your **host's home directory `.convex` folder**:

- **Location**: `~/.convex` (outside the project directory)
- **Contains**: Deployment config, SQLite database, modules, exports
- **Persistence**: Survives `docker compose down` (unless you delete `~/.convex`)
- **Access**: Use `docker exec capo-backend-1 npx convex export --local` to backup

## Environment Variables

### Frontend

Set in `docker-compose.yml`:
- `VITE_HOST=0.0.0.0` - Allow Docker network access
- `VITE_CONVEX_URL=http://backend:3210` - Service discovery

**Adding New Variables**:
1. Edit `docker-compose.yml`
2. Add to `frontend.service.environment`
3. Restart service: `npm run docker:restart:frontend`

### Backend

Uses `.env.docker` file:
- `CONVEX_DEPLOYMENT=anonymous:anonymous-nutopia` - Deployment identifier
- `CONVEX_LOCAL_ONLY=1` - Force local mode
- `CONVEX_ENABLE_FILE_POLLING=1` - Detect file changes

**Non-Interactive Setup**:
- `.env.docker` - Environment configuration (mounted into container)
- `~/.convex/local.json` - Contains `{"localDeployment": true}` (prevents login prompts)
- `--configure existing` flag - Skips setup wizard
- `--env-file .env.docker` flag - Loads configuration

**Adding New Variables**:
1. Edit `.env.docker` (project root)
2. Restart backend: `npm run docker:restart:backend`

## Hot-Reload Behavior

### Frontend
- Vite watches for file changes
- Changes reflect automatically in browser
- No restart needed for code changes
- Restart only for dependency changes or environment variables

### Backend
- Convex watches for file changes in `./convex` directory
- Changes reflect automatically
- Restart only for dependency changes or environment variables

## Log Management

### Locations

- **Frontend**: `./logs/frontend/`
- **Backend**: `./logs/backend/`
- **Docker logs**: `docker compose logs` (managed by Docker, rotated automatically)

### Rotation

Docker automatically rotates logs:
- **Max size**: 10MB per log file
- **Max files**: 3 rotated files
- **Total per service**: ~40MB

### Advanced Viewing

```bash
# View logs since specific time
docker compose logs --since 1h frontend

# Follow logs in real-time
docker compose logs -f backend

# View last N lines
docker compose logs --tail 50 frontend

# View logs with timestamps
docker compose logs -t backend
```

## Resource Usage

**Typical Consumption**:
- Frontend: 200-300MB RAM
- Backend: 100-200MB RAM
- Total: ~500MB RAM for both services

## Rebuilding Containers

Only rebuild when:
- Dependencies change (`package.json` modified)
- Dockerfiles are modified
- Build artifacts are corrupted

```bash
# Rebuild specific service
docker compose up --build -d frontend

# Rebuild all services
docker compose up --build -d
```
