# Troubleshooting

## Backend Issues

### Backend won't start

**Symptoms**: `npm run dev:backend` fails or exits immediately

**Diagnose**:
```bash
# Check if port 3210 is already in use
lsof -i :3210

# Check if local.json exists
cat ~/.convex/local.json
# Should contain: {"localDeployment": true}

# Try running with verbose output
CONVEX_LOCAL_ONLY=1 npx convex dev --local
```

**Solutions**:

1. **Port conflict**:
   ```bash
   # Kill existing backend
   pkill -f "convex dev"
   # Or kill specific PID
   kill -9 <PID from lsof>
   ```

2. **Missing local.json**:
   ```bash
   mkdir -p ~/.convex
   echo '{"localDeployment": true}' > ~/.convex/local.json
   ```

3. **Corrupted deployment state**:
   ```bash
   # Backup first
   cp -r ~/.convex ~/.convex.backup
   # Remove deployment state
   rm -rf ~/.convex/anonymous-convex-backend-state
   # Restart backend (will reinitialize)
   npm run dev:backend &
   ```

---

### Backend starts but frontend can't connect

**Symptoms**: Frontend shows network errors, can't reach Convex backend

**Diagnose**:
```bash
# Check if backend is responding
curl http://localhost:3210/_health

# Check frontend environment variable
docker compose exec frontend env | grep CONVEX_URL
# Should be: VITE_CONVEX_URL=http://host.docker.internal:3210
```

**Solutions**:

1. **Wrong CONVEX_URL**:
   - Edit `docker-compose.yml`
   - Set `VITE_CONVEX_URL=http://host.docker.internal:3210`
   - Restart: `npm run docker:restart:frontend`

2. **Backend not running**:
   ```bash
   # Check if backend process exists
   ps aux | grep "convex dev"
   # Start if not running (ASK PERMISSION FIRST)
   ```

3. **Firewall blocking**:
   - Check if port 3210 is accessible from container
   - Test: `docker compose exec frontend curl http://host.docker.internal:3210/_health`

---

### Backend not responding

**Symptoms**: Backend process running but not responding to requests

**Diagnose**:
```bash
# Check if process is running
ps aux | grep "convex dev"

# Check if port is listening
lsof -i :3210

# Check health endpoint
curl http://localhost:3210/_health

# Check backend logs (if running in terminal)
# Look for errors in console output
```

**Solutions**:

1. **Restart backend**:
   ```bash
   pkill -f "convex dev"
   # Wait a few seconds
   npm run dev:backend &
   ```

2. **Check for errors**:
   - Look at console output where backend is running
   - Check for schema validation errors
   - Check for function errors

3. **Database locked**:
   ```bash
   # Kill all Convex processes
   pkill -f "convex"
   # Wait for SQLite lock to release (usually immediate)
   # Restart backend
   npm run dev:backend &
   ```

---

## Frontend Issues

### Container won't start

**Symptoms**: `npm run docker:start:frontend` fails or exits immediately

**Diagnose**:
```bash
# Check container status
docker compose ps

# Check logs
npm run docker:taillogs:frontend

# Check for port conflicts
lsof -i :5173
```

**Solutions**:

1. **Port 5173 in use**:
   ```bash
   # Kill process using port
   kill -9 <PID from lsof>
   # Restart frontend
   npm run docker:restart:frontend
   ```

2. **Build error**:
   ```bash
   # Rebuild with --no-cache
   docker compose build --no-cache frontend
   docker compose up -d frontend
   ```

3. **Volume mount issue**:
   ```bash
   # Check if volumes are mounted correctly
   docker compose config | grep -A 10 volumes
   # Verify current directory is correct
   pwd
   ```

---

### Frontend starts but shows errors

**Symptoms**: Container running but browser shows errors

**Diagnose**:
```bash
# Check logs
npm run docker:taillogs:frontend

# Check if Vite is responding
curl http://localhost:5173

# Check console in browser DevTools
```

**Solutions**:

1. **Vite build error**:
   - Check logs for compilation errors
   - Fix TypeScript/lint errors
   - Container will hot-reload on fix

2. **Can't reach backend**:
   - See "Backend starts but frontend can't connect" above

3. **Module resolution error**:
   ```bash
   # Rebuild container
   docker compose up --build -d frontend
   ```

---

### Hot-reload not working

**Symptoms**: File changes not reflecting in browser

**Diagnose**:
```bash
# Check if volume mounts are working
docker compose exec frontend ls -la /app

# Check if file changes are visible in container
docker compose exec frontend cat /app/package.json
```

**Solutions**:

1. **Volume mount issue**:
   - Verify `.` is mounted to `/app`
   - Check file permissions
   - Restart container: `npm run docker:restart:frontend`

2. **Vite not watching**:
   - Check logs for "file watcher" errors
   - Restart container

3. **Browser cache**:
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

---

## Data Issues

### Data lost after restart

**Symptoms**: Database empty after stopping/starting backend

**Diagnose**:
```bash
# Check if data directory exists
ls -la ~/.convex/anonymous-convex-backend-state/

# Check database file
ls -lh ~/.convex/anonymous-convex-backend-state/anonymous-nutopia/convex_local_backend.sqlite3
```

**Solutions**:

1. **Data directory deleted**:
   - Restore from backup if available
   - See [data-management.md](/memory-bank/data-management.md)

2. **Wrong deployment**:
   - Check `~/.convex/local.json`
   - Verify deployment name matches

**Expected behavior**: Data persists across backend restarts.

---

### Database corrupted

**Symptoms**: Backend crashes with SQLite errors

**Solutions**:

1. **Backup and reset**:
   ```bash
   # Backup current state
   cp -r ~/.convex ~/.convex.backup.$(date +%Y%m%d)

   # Remove deployment
   rm -rf ~/.convex/anonymous-convex-backend-state

   # Restart (will create fresh database)
   npm run dev:backend &
   ```

2. **SQLite check** (advanced):
   ```bash
   sqlite3 ~/.convex/anonymous-convex-backend-state/anonymous-nutopia/convex_local_backend.sqlite3 "PRAGMA integrity_check;"
   ```

---

## Agent-Specific Issues

### Agent forgot to kill backend

**Symptoms**: Backend process still running after agent task completed

**Diagnose**:
```bash
# Check for Convex processes
ps aux | grep "convex dev"
```

**Solution**:
```bash
# Kill all Convex dev processes
pkill -f "convex dev"
# Verify
lsof -i :3210  # Should return nothing
```

**Prevention**: Agents should ALWAYS run `pkill -f "convex dev"` when task completes.

---

### Agent started backend without asking

**Violation of process ownership rules**.

**Solution**:
1. Kill the backend: `pkill -f "convex dev"`
2. Remind agent of rules in SERVICES.md
3. Report to user if agent violates protocol

---

## Performance Issues

### Frontend slow

**Diagnose**:
```bash
# Check container resource usage
docker stats capo-frontend

# Check system resources
free -h
top
```

**Solutions**:

1. **Low memory**:
   - Close other containers
   - Increase system RAM if possible

2. **High CPU during hot-reload**:
   - Normal behavior during file changes
   - Should settle within a few seconds

3. **Large node_modules**:
   - Already handled by not mounting node_modules
   - First build will be slow, subsequent builds fast

---

### Backend slow

**Diagnose**:
```bash
# Check process resource usage
ps aux | grep "convex dev"

# Check database size
ls -lh ~/.convex/anonymous-convex-backend-state/anonymous-nutopia/convex_local_backend.sqlite3
```

**Solutions**:

1. **Large database**:
   - Normal for production data
   - Consider archiving old data

2. **Slow queries**:
   - Check Convex dashboard for slow operations
   - Add indexes if needed

3. **High memory**:
   - Normal for Convex (~100-200MB)
   - Restart if leaking (rare)

---

## Network Issues

### host.docker.internal not working

**Symptoms**: Frontend can't reach backend, DNS resolution fails

**Diagnose**:
```bash
# Test from inside container
docker compose exec frontend nslookup host.docker.internal
docker compose exec frontend ping host.docker.internal
```

**Solutions**:

1. **Not on Docker Desktop**:
   - `host.docker.internal` only works on Docker Desktop
   - Linux: Use `172.17.0.1` (default Docker bridge gateway)
   - Update `VITE_CONVEX_URL` in docker-compose.yml

2. **Firewall blocking**:
   - Check firewall rules
   - Allow Docker network access

3. **Docker network issue**:
   ```bash
   # Recreate network
   docker compose down
   docker network prune
   docker compose up -d frontend
   ```

---

## Still Stuck?

1. **Check logs first** - 90% of issues are visible in logs
2. **Restart services** - Fixes 50% of remaining issues
3. **Check status** - Verify both services are running
4. **Read architecture docs** - [architecture.md](/memory-bank/architecture.md)

**Full system restart**:
```bash
# Stop everything
npm run docker:stop:frontend
pkill -f "convex dev"

# Start frontend
npm run docker:start:frontend

# Start backend (ASK PERMISSION FIRST)
npm run dev:backend &
```

If still broken, the logs will tell you what's wrong. Read them carefully.
