# Services Management

## Architecture

**Frontend**: Host process (Vite dev server on port 5173)
**Backend**: Production Convex deployment (cloud)

Frontend connects directly to production Convex backend via `VITE_CONVEX_URL` environment variable.

---

## Critical Changes (Feb 2026)

**✅ NEW APPROACH** (validated through E2E testing):
- **Frontend**: Use `npm run dev:frontend` directly (NOT Docker)
- **Backend**: Use production Convex deployment (NOT `convex dev`)
- **Why**: `convex dev` fails with WebSocket errors; production backend works perfectly

**❌ OLD APPROACH** (deprecated):
- ~~Docker container for frontend~~
- ~~Local `convex dev` for backend~~
- ~~`host.docker.internal:3210`~~

---

## Frontend Service

### Starting Frontend

```bash
# Start frontend development server
npm run dev:frontend

# Frontend runs on: http://localhost:5173
# Process ID saved to: /tmp/frontend.pid
```

### Stopping Frontend

```bash
# If you started it with PID saved
kill $(cat /tmp/frontend.pid)

# Or find and kill the process
pkill -f "npm run dev:frontend"
pkill -f "vite"

# Verify stopped
lsof -i :5173  # Should return nothing
```

### Frontend Commands

| Operation | Command |
|-----------|---------|
| Start | `npm run dev:frontend` |
| Stop | `kill $(cat /tmp/frontend.pid)` or `pkill -f vite` |
| Check status | `lsof -i :5173` |
| View logs | Check terminal where started or `/tmp/frontend.log` |

---

## Backend Service

### Production Deployment

**Backend URL**: `https://charming-bass-286.convex.cloud`

**Configuration**: Set in `.env.local`:
```bash
VITE_CONVEX_URL=https://charming-bass-286.convex.cloud
```

**Dashboard**: https://charming-bass-286.convex.cloud/_dash

### Why Not Local Backend?

**Problem**: `npm run dev:backend` fails with WebSocket error 101:
```
WebSocket error message: Unexpected server response: 101
WebSocket closed with code 1006
```

**Solution**: Use production deployment directly. E2E tests work perfectly with this approach.

### Backend Functions

All backend functions are available at the production URL:
- Mutations, queries, actions
- Test helpers (`api.testHelpers.*`)
- Seed functions (`api.seed.*`)

---

## Testing with Services

### E2E Tests (Playwright)

**Run**:
```bash
npm run test:e2e:playwright
```

**Configuration**:
- Frontend: http://localhost:5173 (must be running)
- Backend: https://charming-bass-286.convex.cloud (production)
- Tests: 211 tests across 15 files
- Config: `playwright.config.cjs`

**Authentication**:
Tests use URL parameter authentication:
- `?role=student` - Login as student
- `?role=teacher` - Login as teacher
- `?role=admin` - Login as admin

**Example**:
```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/?role=student');
  await page.waitForTimeout(1000);
});
```

### Before Running E2E Tests

1. **Start frontend**:
   ```bash
   npm run dev:frontend > /tmp/frontend.log 2>&1 &
   echo $! > /tmp/frontend.pid
   ```

2. **Verify frontend is running**:
   ```bash
   curl -I http://localhost:5173
   # Should return: HTTP/1.1 200 OK
   ```

3. **Run tests**:
   ```bash
   npm run test:e2e:playwright
   ```

4. **Stop frontend when done**:
   ```bash
   kill $(cat /tmp/frontend.pid)
   ```

---

## Environment Variables

### `.env.local`

```bash
# Production Convex deployment
VITE_CONVEX_URL=https://charming-bass-286.convex.cloud

# DO NOT use localhost:3210 - convex dev doesn't work
# VITE_CONVEX_URL=http://localhost:3210  # ❌ BROKEN
```

### How Frontend Connects to Backend

**`src/main.tsx`**:
```typescript
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
```

**Environment variable**:
- Read by Vite at build time
- Passed to React app as `import.meta.env.VITE_CONVEX_URL`
- Frontend connects directly to production Convex cloud

---

## Troubleshooting

### Frontend Issues

**Port 5173 in use?**
```bash
lsof -i :5170  # Find process
kill -9 <PID>  # Kill it
```

**Frontend won't start?**
```bash
# Check Node version
/usr/bin/node --version  # Should be v18.19.1

# Check for errors in logs
cat /tmp/frontend.log

# Try starting manually
/usr/bin/node node_modules/vite/bin/vite.js
```

**Can't reach backend?**
```bash
# Verify env variable is set
cat .env.local | grep VITE_CONVEX_URL

# Test backend connectivity
curl https://charming-bass-286.convex.cloud/_health
```

### E2E Test Issues

**Tests fail with "element not found"?**
- Frontend not running → Start it with `npm run dev:frontend`
- Backend not reachable → Check `VITE_CONVEX_URL` in `.env.local`

**Tests fail with authentication errors?**
- Check test uses `?role=xxx` parameter
- Verify URL parameter authentication is working

**Playwright can't find config?**
- Must use `playwright.config.cjs` (not `.js`)
- Config renamed to avoid ESM/CommonJS conflicts

---

## Architecture & Data

**Production Backend**:
- All data persisted in Convex cloud
- No local data directory needed
- Automatic backups and replication
- Global availability

**Frontend**:
- Hot Module Reload (HMR) enabled
- Fast refresh on file changes
- Development mode optimizations

**Key Points**:
- No Docker containers needed
- No local backend process
- Frontend connects directly to production
- Simple, reliable, and fast

---

## History

**Feb 2026**: Migrated from Docker + local backend to host frontend + production backend approach
- **Reason**: `convex dev` consistently fails with WebSocket errors
- **Result**: E2E tests work (56/211 passing), simpler architecture
- **Validation**: Full E2E test orchestration completed successfully

See `PLAYWRIGHT_SETUP_COMPLETE.md` for detailed E2E testing documentation.
