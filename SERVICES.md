# Services Management Guide

## CRITICAL RULE - READ THIS FIRST

**🚨 NEVER EVER EVER run services directly! 🚨**

**FORBIDDEN:**
- ❌ `npm run dev`
- ❌ `npm run dev:frontend`
- ❌ `npm run dev:backend`
- ❌ `npx vite`
- ❌ `npx convex dev`
- ❌ Direct node commands

**REQUIRED:**
- ✅ **ALWAYS ALWAYS ALWAYS use Docker containers**
- ✅ All service operations MUST go through `npm run docker:*` scripts
- ✅ This ensures consistent environment, data persistence, and log collection

---

## Quick Reference

| Operation | Command |
|-----------|---------|
| Check status | `npm run docker:ps` |
| Start all services | `npm run docker:start:all` |
| Start frontend only | `npm run docker:start:frontend` |
| Start backend only | `npm run docker:start:backend` |
| Stop all services | `npm run docker:stop:all` |
| Stop frontend | `npm run docker:stop:frontend` |
| Stop backend | `npm run docker:stop:backend` |
| Restart all services | `npm run docker:restart:all` |
| Restart frontend | `npm run docker:restart:frontend` |
| Restart backend | `npm run docker:restart:backend` |
| Tail frontend logs (100 lines) | `npm run docker:taillogs:frontend` |
| Tail backend logs (100 lines) | `npm run docker:taillogs:backend` |
| Tail logs with custom line count | `npm run docker:taillogs:frontend -- 50` |

---

## Service Endpoints

Once services are running:

- **Frontend (Vite Dev Server)**: http://localhost:5173
- **Backend (Convex)**: http://localhost:3210
- **Convex Dashboard**: http://localhost:3210/_dash

---

## Common Workflows

### Workflow 1: Initial Development Session

```bash
# 1. Check if services are already running
npm run docker:ps

# 2. If not running, start all services
npm run docker:start:all

# 3. Wait for services to be healthy (check logs)
npm run docker:taillogs:backend

# 4. Access application
# Frontend: http://localhost:5173
# Backend: http://localhost:3210
```

### Workflow 2: Checking Service Status

```bash
# List all Docker containers with their status
npm run docker:ps

# Look for:
# - "capo-frontend-1" with status "Up"
# - "capo-backend-1" with status "Up"
```

### Workflow 3: Viewing Service Logs

```bash
# View last 100 lines of frontend logs (default)
npm run docker:taillogs:frontend

# View last 100 lines of backend logs (default)
npm run docker:taillogs:backend

# View last 50 lines of frontend logs
npm run docker:taillogs:frontend -- 50

# View last 500 lines of backend logs
npm run docker:taillogs:backend -- 500
```

**Log Output Format:**
```
=== Docker Container Logs ===
[Docker log output here]

=== Application Log Files ===
[Application log file output here, if any]
```

### Workflow 4: Restarting a Service After Code Changes

```bash
# After editing frontend code
npm run docker:restart:frontend

# After editing backend (Convex) code
npm run docker:restart:backend

# Or restart both at once
npm run docker:restart:all
```

**Note**: Hot-reload is enabled, so most changes will reflect automatically. Restart only when:
- Installing new dependencies
- Changing environment variables
- Experiencing unexpected behavior

### Workflow 5: Stopping Services

```bash
# Stop all services (preserves data)
npm run docker:stop:all

# Stop only frontend (keeps backend running)
npm run docker:stop:frontend

# Stop only backend (keeps frontend running)
npm run docker:stop:backend
```

### Workflow 6: Complete Reset (Last Resort)

```bash
# ⚠️ WARNING: This deletes all Convex database data!
docker compose down -v
npm run docker:start:all
```

Only use this when:
- Database is corrupted
- You need a completely fresh start
- Explicitly instructed to do so

---

## Troubleshooting

### Problem: Service Won't Start

```bash
# 1. Check current status
npm run docker:ps

# 2. View logs to see error
npm run docker:taillogs:frontend   # or :backend

# 3. Try restarting
npm run docker:restart:all

# 4. If still failing, try complete restart
npm run docker:stop:all
npm run docker:start:all
```

### Problem: Port Already in Use

```bash
# Check what's using the port
lsof -i :5173  # Frontend port
lsof -i :3210  # Backend port

# If another process is using the port, stop it
# Then restart services
npm run docker:restart:all
```

### Problem: Changes Not Reflecting

```bash
# 1. Verify volume mounts are working
docker compose config | grep -A 10 volumes

# 2. Restart the service
npm run docker:restart:frontend   # or :backend

# 3. If still not working, rebuild
docker compose down
docker compose up --build -d
```

### Problem: Database Data Lost

**Expected Behavior**: Database data persists in the `convex-data` Docker volume.

**If Data is Lost**:
1. Verify you're using `npm run docker:stop:all` (NOT `docker compose down -v`)
2. Check if volume exists: `docker volume ls | grep convex`
3. If volume was accidentally deleted, data is gone (restore from backup if available)

---

## Data Persistence

### What Persists

✅ **Convex SQLite Database** - Stored in `convex-data` Docker volume
✅ **All Convex schema and data** - Survives container restarts
✅ **Installed npm dependencies** - Cached in container layers

### What Does NOT Persist

❌ **In-memory state** - Lost when containers stop
❌ **Build artifacts** - Rebuilt on container start
❌ **Temporary files** - Not mounted as volumes

### Backup Database

```bash
# Export Convex data
docker exec capo-backend-1 npx convex export --local

# This creates a ZIP file in the container
# Copy it to host:
docker cp capo-backend-1:/app/convex-export.zip ./backup-$(date +%Y%m%d).zip
```

---

## Architecture Overview

### Frontend Service (`capo-frontend-1`)

- **Image**: Built from `Dockerfile.frontend`
- **Base**: node:20-alpine
- **Port**: 5173 (host) → 5173 (container)
- **Command**: `npm run dev:frontend` (Vite dev server)
- **Volumes**:
  - `./ → /app` - Source code hot-reload
  - `./logs/frontend → /app/logs` - Log collection
  - `node_modules` - Isolated dependencies

### Backend Service (`capo-backend-1`)

- **Image**: Built from `Dockerfile.backend`
- **Base**: node:20-alpine with Convex CLI
- **Ports**: 3210, 3211 (host) → 3210, 3211 (container)
- **Command**: `npm run dev:backend` (Convex local backend)
- **Volumes**:
  - `./convex → /app/convex` - Source code hot-reload
  - `convex-data → /root/.convex` - Database persistence ⚠️ CRITICAL
  - `./logs/backend → /app/logs` - Log collection
  - `node_modules` - Isolated dependencies

### Network

- **Name**: `capo-network`
- **Type**: Bridge
- **Service Discovery**:
  - Frontend reaches backend at `http://backend:3210`
  - Backend reaches frontend at `http://frontend:5173`

---

## Environment Variables

### Frontend Environment Variables

Set in `docker-compose.yml`:
- `VITE_HOST=0.0.0.0` - Allow Docker network access
- `VITE_CONVEX_URL=http://backend:3210` - Service discovery

**Adding New Variables**:
1. Edit `docker-compose.yml`
2. Add to `frontend.service.environment`
3. Restart service: `npm run docker:restart:frontend`

### Backend Environment Variables

Set in `docker-compose.yml`:
- `CONVEX_LOCAL_ONLY=1` - Force local mode
- `CONVEX_ENABLE_FILE_POLLING=1` - Detect file changes

**Adding New Variables**:
1. Edit `docker-compose.yml`
2. Add to `backend.service.environment`
3. Restart service: `npm run docker:restart:backend`

---

## Log Management

### Log Locations

- **Frontend**: `./logs/frontend/`
- **Backend**: `./logs/backend/`
- **Docker logs**: `docker compose logs` (managed by Docker, rotated automatically)

### Log Rotation

Docker automatically rotates logs:
- **Max size**: 10MB per log file
- **Max files**: 3 rotated files
- **Total per service**: ~40MB

### Advanced Log Viewing

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

---

## Performance Tips

### Development Speed

1. **Hot-reload is enabled** - Most changes reflect automatically
2. **Dependencies are cached** - First build is slow, subsequent builds are fast
3. **Use volume mounts** - Code changes sync instantly

### Resource Usage

- **Frontend**: ~200-300MB RAM
- **Backend**: ~100-200MB RAM
- **Total**: ~500MB RAM for both services

### Rebuilding When Needed

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

---

## Safety Rules for LLMs

### ALWAYS Do This

✅ Check service status before starting: `npm run docker:ps`
✅ Use npm scripts for all operations: `npm run docker:*`
✅ View logs when troubleshooting: `npm run docker:taillogs:*`
✅ Restart services after dependency changes: `npm run docker:restart:*`
✅ Stop services when done: `npm run docker:stop:all`

### NEVER Do This

❌ Run `npm run dev` or `npm run dev:*` directly
❌ Run `npx vite` or `npx convex dev` directly
❌ Use `docker` commands directly (use npm scripts instead)
❌ Edit running containers (restart instead)
❌ Run `docker compose down -v` unless explicitly instructed

### When in Doubt

1. Check the logs: `npm run docker:taillogs:frontend` or `:backend`
2. Check status: `npm run docker:ps`
3. Restart the affected service: `npm run docker:restart:*`
4. If still broken, stop all and start fresh: `npm run docker:stop:all && npm run docker:start:all`

---

## Quick Diagnostic Commands

```bash
# Full system health check
npm run docker:ps && \
echo "=== Frontend Logs ===" && \
npm run docker:taillogs:frontend -- 10 && \
echo "=== Backend Logs ===" && \
npm run docker:taillogs:backend -- 10

# Show all containers (including stopped ones)
docker compose ps -a

# Show resource usage
docker stats

# Show volume information (verify database persistence)
docker volume ls | grep convex

# Show network information
docker network inspect capo-network
```

---

## Getting Help

If you encounter issues not covered here:

1. **Check the logs first** - 90% of issues are visible in logs
2. **Try restarting** - Fixes 50% of remaining issues
3. **Check service status** - Verify both services are running
4. **Review this document** - Solution is often documented here

Still stuck? The logs will tell you what's wrong. Read them carefully.
