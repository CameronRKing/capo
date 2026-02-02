# Troubleshooting Guide

## Service Won't Start

```bash
# Check current status
npm run docker:ps

# View logs to see error
npm run docker:taillogs:frontend   # or :backend

# Try restarting
npm run docker:restart:all

# If still failing, complete restart
npm run docker:stop:all
npm run docker:start:all
```

## Port Already in Use

```bash
# Check what's using the port
lsof -i :5173  # Frontend
lsof -i :3210  # Backend

# Stop the conflicting process, then restart services
npm run docker:restart:all
```

## Changes Not Reflecting

```bash
# Verify volume mounts are working
docker compose config | grep -A 10 volumes

# Restart the service
npm run docker:restart:frontend   # or :backend

# If still not working, rebuild
docker compose down
docker compose up --build -d
```

## Database Data Lost

**Expected**: Database data persists in `~/.convex` (host directory), surviving container restarts.

**If Data is Lost**:
1. Verify directory exists: `ls -la ~/.convex`
2. Verify mount in container: `docker exec capo-backend-1 ls -la /root/.convex`
3. Check `local.json` exists: `cat ~/.convex/local.json`
4. If directory was deleted, data is gone (restore from backup if available)

## Backend Prompts for Login

Backend runs non-interactively. If it prompts:

1. Verify `~/.convex/local.json` exists with `{"localDeployment": true}`
2. Check that `.env.docker` is mounted in `docker-compose.yml`
3. Verify the `dev:backend:docker` script uses `--configure existing --env-file .env.docker`

## Container Restart Loops

```bash
# Check logs immediately
npm run docker:taillogs:backend -- 50

# Common causes:
# - Syntax errors in code
# - Missing dependencies
# - Invalid environment variables
# - Port conflicts
```

## Out of Memory Errors

```bash
# Check resource usage
docker stats

# Services typically use:
# - Frontend: 200-300MB RAM
# - Backend: 100-200MB RAM

# If exceeding limits, restart services
npm run docker:restart:all
```

## Network Issues Between Services

```bash
# Verify network exists
docker network ls | grep capo

# Inspect network
docker network inspect capo-network

# Services must be on same network
# Frontend reaches backend: http://backend:3210
# Backend reaches frontend: http://frontend:5173
```

## Volume Mount Issues

```bash
# Check mounts are active
docker inspect capo-frontend-1 | grep -A 20 Mounts
docker inspect capo-backend-1 | grep -A 20 Mounts

# Verify source paths exist on host
ls -la ./convex
ls -la ~/.convex
```

## Convex CLI Errors

```bash
# Verify Convex CLI is installed in container
docker exec capo-backend-1 npx convex --version

# Reinstall if needed
docker compose up --build -d backend
```
