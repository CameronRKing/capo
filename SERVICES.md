# Services Management

## Architecture

**Frontend**: Docker container (Vite dev server on port 5173)
**Backend**: Host process (Convex local backend on port 3210)

Frontend container connects to backend via `host.docker.internal:3210`.

---

## Critical Rule: Backend Process Ownership

**THE BACKEND IS OWNED BY THE USER.**

Agents **MUST** follow this workflow:

1. **ASK PERMISSION** before starting backend: "May I start the backend server?"
2. **START IT YOURSELF** if permission granted: `npm run dev:backend &`
3. **KILL IT AUTOMATICALLY** when task completes: `pkill -f "convex dev"`

**NEVER** leave backend processes running after your task. Control reverts to the user when you finish.

---

## Docker Commands (Frontend Only)

| Operation | Command |
|-----------|---------|
| Status | `npm run docker:ps` |
| Start frontend | `npm run docker:start:frontend` |
| Stop frontend | `npm run docker:stop:frontend` |
| Restart frontend | `npm run docker:restart:frontend` |
| Frontend logs | `npm run docker:taillogs:frontend` |

---

## Endpoints

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3210
- **Dashboard**: http://localhost:3210/_dash

---

## Basic Workflow

```bash
# Start frontend (Docker)
npm run docker:start:frontend

# Start backend (host) - AGENTS MUST ASK FIRST
npm run dev:backend &

# Check status
npm run docker:ps
lsof -i :3210  # Verify backend running

# Stop when done
npm run docker:stop:frontend
pkill -f "convex dev"  # Agents MUST do this automatically
```

---

## Troubleshooting

[Full troubleshooting guide](/memory-bank/troubleshooting.md)

**Backend issues**:
- Port 3210 in use? `lsof -i :3210` then `kill -9 <PID>`
- Backend won't start? Check `~/.convex/local.json` exists
- Backend not responding? `curl http://localhost:3210/_health`

**Frontend issues**:
- Container won't start? `npm run docker:taillogs:frontend`
- Can't reach backend? Check `VITE_CONVEX_URL=http://host.docker.internal:3210`

---

## Agent Safety Rules

**Before starting backend**:
- ✅ ASK: "May I start the backend server?"
- ✅ WAIT for user permission
- ❌ DON'T start without asking

**When task completes**:
- ✅ KILL: `pkill -f "convex dev"`
- ✅ VERIFY: `lsof -i :3210` returns nothing
- ✅ REPORT: "Backend stopped, control reverted to you"
- ❌ DON'T leave processes running

**Never**:
- Run `npm run dev` (starts both services)
- Leave background processes after task completion
- Assume backend is available without checking

---

## Architecture & Data

[Architecture details](/memory-bank/architecture.md) | [Data management](/memory-bank/data-management.md)

**Key points**:
- Backend data persists in `~/.convex` (host directory)
- Frontend hot-reload enabled
- Frontend connects to backend via `host.docker.internal:3210`
- Backend runs on host, not in container
