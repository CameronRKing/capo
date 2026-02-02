# Services Management

## Critical Rule

**NEVER run services directly.**

**Forbidden**:
- `npm run dev`
- `npx vite`
- `npx convex dev`

**Required**:
- Use Docker containers ONLY
- All operations through `npm run docker:*` scripts

## Commands

| Operation | Command |
|-----------|---------|
| Status | `npm run docker:ps` |
| Start all | `npm run docker:start:all` |
| Start frontend | `npm run docker:start:frontend` |
| Start backend | `npm run docker:start:backend` |
| Stop all | `npm run docker:stop:all` |
| Stop frontend | `npm run docker:stop:frontend` |
| Stop backend | `npm run docker:stop:backend` |
| Restart all | `npm run docker:restart:all` |
| Restart frontend | `npm run docker:restart:frontend` |
| Restart backend | `npm run docker:restart:backend` |
| Frontend logs | `npm run docker:taillogs:frontend` |
| Backend logs | `npm run docker:taillogs:backend` |
| Custom line count | `npm run docker:taillogs:frontend -- 50` |

## Endpoints

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3210
- **Dashboard**: http://localhost:3210/_dash

## Basic Workflow

```bash
# Check status
npm run docker:ps

# Start services
npm run docker:start:all

# View logs if needed
npm run docker:taillogs:backend

# Stop when done
npm run docker:stop:all
```

## Troubleshooting

[Full troubleshooting guide](/memory-bank/troubleshooting.md)

**Quick checks**:
1. Check logs: `npm run docker:taillogs:frontend` or `:backend`
2. Check status: `npm run docker:ps`
3. Restart affected service: `npm run docker:restart:*`
4. If broken: `npm run docker:stop:all && npm run docker:start:all`

## Initial Setup

[One-time setup instructions](/memory-bank/initial-setup.md)

Required files:
- `~/.convex/local.json` with `{"localDeployment": true}`
- `.env.docker` in project root

## Architecture & Data

[Architecture details](/memory-bank/architecture.md) | [Data management](/memory-bank/data-management.md)

**Key points**:
- Database persists in `~/.convex` (host directory)
- Hot-reload enabled for code changes
- Restart only for dependency changes or environment variables

## Safety Rules

**Always**:
- Check status before starting
- Use npm scripts for all operations
- View logs when troubleshooting
- Stop services when done

**Never**:
- Run `npm run dev` or `npx` commands directly
- Use `docker` commands directly (use npm scripts)
- Run `docker compose down -v` unless explicitly instructed
