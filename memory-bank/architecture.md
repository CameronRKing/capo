# Services Architecture

## Overview

Hybrid architecture: Frontend runs in Docker container, backend runs on host.

**Why this approach?**
- Convex backend binary fails in Alpine Linux containers (glibc incompatibility)
- Backend runs successfully on host
- Frontend lightweight in Docker (~180MB Alpine image)
- Clean separation of concerns

---

## Frontend Service (`capo-frontend-1`)

**Container**: Docker
**Image**: Built from `Dockerfile.frontend`
**Base**: `node:20-alpine` (~180MB)
**Port**: 5173 (host) → 5173 (container)
**Command**: `npm run dev:frontend` (Vite dev server)

**Volumes**:
- `./ → /app` - Source code hot-reload
- `./logs/frontend → /app/logs` - Log collection
- `/app/node_modules` - Isolated dependencies (not mounted)
- `/app/.vite` - Vite cache (not mounted)

**Environment Variables**:
- `VITE_HOST=0.0.0.0` - Allow Docker network access
- `VITE_CONVEX_URL=http://host.docker.internal:3210` - Connect to host backend

**Why host.docker.internal?**
Docker Desktop special DNS name that resolves to host machine. Allows container to reach services running on host.

---

## Backend Service (Host Process)

**Type**: Host process (NOT containerized)
**Command**: `npm run dev:backend` (runs `convex dev --local`)
**Port**: 3210 (backend), 3211 (dashboard)
**Data**: Stored in `~/.convex` (host home directory)

**Process Management**:
- Agents must ASK PERMISSION before starting
- Run in background: `npm run dev:backend &`
- Kill when done: `pkill -f "convex dev"`
- Verify cleanup: `lsof -i :3210`

**Why not containerized?**
Convex backend binary requires glibc (standard C library). Alpine Linux uses musl, causing binary execution failures. Standard `node:20` image would work but is ~900MB vs ~180MB for Alpine.

**Running on host**:
- Works perfectly with native libraries
- Easier debugging (direct process access)
- No network complexity (localhost:3210)
- User has full control

---

## Network

**Frontend (Container)**:
- Exposed on host port 5173
- Accessible at http://localhost:5173
- Connects to backend via `host.docker.internal:3210`

**Backend (Host)**:
- Runs on host ports 3210, 3211
- Accessible at http://localhost:3210
- Dashboard at http://localhost:3210/_dash
- Frontend reaches it via Docker's special DNS

**No Docker network** between services (they're on different hosts).

---

## Data Persistence

### Frontend
**No data persistence** - Vite dev server serves static files, no database.

### Backend
**Convex data persists in `~/.convex`**:
- `~/.convex/local.json` - Local deployment configuration
- `~/.convex/anonymous-convex-backend-state/anonymous-nutopia/` - Deployment data
- `convex_local_backend.sqlite3` - SQLite database
- `convex_local_storage/` - File storage

**Survives**:
- Container restarts
- Container stops
- System reboots

**Lost if**:
- `~/.convex` directory deleted
- Database file deleted

**Backup**: See [data-management.md](/memory-bank/data-management.md)

---

## Hot-Reload Behavior

### Frontend (Vite)
- **Enabled**: Vite watches for file changes
- **Automatic**: Reloads browser on save
- **No restart needed**: Changes reflect immediately

### Backend (Convex)
- **Enabled**: Convex CLI watches for file changes
- **Automatic**: Pushes schema/function changes to backend
- **No restart needed**: Changes reflect immediately
- **Function redeployment**: Automatic on file save

**When to restart backend**:
- Installing new npm dependencies
- Changing environment variables
- Unexpected behavior (last resort)

---

## Resource Usage

### Frontend Container
- **RAM**: ~200-300MB
- **CPU**: Low (idle), spikes during hot-reload
- **Disk**: ~180MB image size

### Backend Process
- **RAM**: ~100-200MB
- **CPU**: Low (idle), spikes during query execution
- **Disk**: ~50MB for `~/.convex` (grows with data)

**Total**: ~500MB RAM for both services

---

## Log Management

### Frontend
- **Docker logs**: `docker compose logs frontend` (rotated automatically, 10MB max)
- **Application logs**: `./logs/frontend/` (if app writes files)
- **Vite output**: Console only (captured by Docker logs)

### Backend
- **Console output**: stdout/stderr (visible when running in terminal)
- **No file logging**: Convex dev server logs to console only
- **Database logs**: In `~/.convex` if enabled

**View frontend logs**:
```bash
npm run docker:taillogs:frontend  # Last 100 lines
npm run docker:taillogs:frontend -- 50  # Last 50 lines
docker compose logs -f frontend  # Follow in real-time
```

---

## Environment Variables

### Frontend (Docker)
Set in `docker-compose.yml`:
- `VITE_HOST=0.0.0.0` - Bind to all interfaces (required for Docker)
- `VITE_CONVEX_URL=http://host.docker.internal:3210` - Backend location

**Adding new variables**:
1. Edit `docker-compose.yml`
2. Add to `frontend.service.environment`
3. Restart: `npm run docker:restart:frontend`

### Backend (Host)
No `.env` file needed. Convex uses:
- `~/.convex/local.json` - Contains `{"localDeployment": true}`
- Environment variables (optional):
  - `CONVEX_LOCAL_ONLY=1` - Force local mode
  - `CONVEX_DEPLOYMENT=anonymous:anonymous-nutopia` - Deployment name

---

## Container vs Host Decision Tree

**Run in Docker (Frontend)**:
- ✅ Stateless services (dev servers, static file serving)
- ✅ No system dependencies
- ✅ Benefits from isolation
- ✅ Lightweight on Alpine

**Run on Host (Backend)**:
- ✅ Requires native libraries (glibc)
- ✅ Needs system integration
- ✅ Easier debugging
- ✅ User wants direct control

**Never containerize**:
- Services that fail on Alpine due to library dependencies
- Services requiring host system integration
- When container overhead outweighs benefits

---

## Rebuilding Containers

**Only rebuild when**:
- Dependencies change (`package.json` modified)
- Dockerfile is modified
- Build artifacts are corrupted

**Frontend rebuild**:
```bash
docker compose up --build -d frontend
```

**Backend not containerized** - no rebuild needed. Just restart process.

---

## Troubleshooting

See [troubleshooting.md](/memory-bank/troubleshooting.md) for:
- Container won't start
- Backend won't start
- Can't reach backend from frontend
- Port conflicts
- Data loss issues

---

## Migration Strategy

**From containerized backend to host backend**:
1. Stop and remove backend container
2. Start backend on host: `npm run dev:backend &`
3. Update frontend `VITE_CONVEX_URL` to `host.docker.internal:3210`
4. Verify connection
5. Delete old backend Dockerfile (optional)

**From host backend to containerized backend**:
1. Use `node:20` (not Alpine) as base image
2. Build new backend container
3. Update frontend `VITE_CONVEX_URL` to `http://backend:3210`
4. Stop host backend
5. Start containerized backend
6. Verify connection

**Current setup**: Frontend containerized, backend on host (recommended).
