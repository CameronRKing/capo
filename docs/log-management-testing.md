# Log Management & Collection - Testing Guide

This document provides testing steps for Track C: Log Management & Collection (bd-2y8).

## Prerequisites

1. Docker and Docker Compose installed
2. Project cloned and dependencies installed
3. Dockerfiles created (from Track A: bd-3kg)

## Test Cases

### Test 1: Directory Structure Verification

**Objective**: Verify log directories are created and properly ignored by git.

```bash
# Check directories exist
ls -la logs/
ls -la logs/frontend/
ls -la logs/backend/

# Verify .gitignore includes logs directory
grep "^logs$" .gitignore
```

**Expected Result**: All directories exist and logs is in .gitignore.

### Test 2: Docker Compose Configuration

**Objective**: Verify docker-compose.yml has logging configured.

```bash
# Check logging driver is json-file
grep -A 5 "logging:" docker-compose.yml
```

**Expected Result**:
- Both services have `driver: "json-file"`
- `max-size: "10m"` configured
- `max-file: "3"` configured
- Log volumes mounted to `./logs/frontend` and `./logs/backend`

### Test 3: Taillogs Script Functionality

**Objective**: Verify taillogs script works with various arguments.

```bash
# Test help/error message (no arguments)
./scripts/taillogs.sh

# Test frontend with default line count (should show container not running)
./scripts/taillogs.sh frontend

# Test backend with custom line count (should show container not running)
./scripts/taillogs.sh backend 50

# Test invalid service name
./scripts/taillogs.sh invalid
```

**Expected Result**:
- No arguments shows usage message
- Frontend/backend show "Container not running" (expected before containers start)
- Invalid service shows error message with usage

### Test 4: npm Script Integration

**Objective**: Verify npm scripts work correctly.

```bash
# Check package.json has correct scripts
grep "docker:taillogs" package.json

# Test frontend script (containers not running)
npm run docker:taillogs:frontend
```

**Expected Result**:
- Scripts reference `./scripts/taillogs.sh`
- Script runs without errors

### Test 5: Log Collection with Running Containers

**Objective**: Verify logs are collected when containers are running.

**Note**: This test requires Dockerfiles to be built first (Track A: bd-3kg).

```bash
# Start containers (after Dockerfiles are created)
docker-compose up -d

# Wait for containers to start
sleep 5

# Check container status
docker-compose ps

# View frontend logs
./scripts/taillogs.sh frontend 20

# View backend logs
./scripts/taillogs.sh backend 20

# Check Docker logs directly
docker logs --tail 20 capo-frontend
docker logs --tail 20 capo-backend

# Stop containers
docker-compose down
```

**Expected Result**:
- Containers start successfully
- Logs are displayed by taillogs script
- Both Docker logs and taillogs show similar output
- No errors in log output

### Test 6: Log Persistence

**Objective**: Verify logs persist across container restarts.

```bash
# Start containers
docker-compose up -d
sleep 5

# Generate some activity (if applicable)
# curl http://localhost:5173  # or other endpoint

# Stop containers
docker-compose stop

# Check if logs are still accessible
docker logs --tail 10 capo-frontend
docker logs --tail 10 capo-backend

# Restart containers
docker-compose start

# Verify logs are still there
docker logs --tail 10 capo-frontend

# Cleanup
docker-compose down
```

**Expected Result**:
- Logs persist after `docker-compose stop`
- Logs are still available after restart
- No data loss between stop/start cycles

### Test 7: Log Rotation

**Objective**: Verify log rotation is configured.

```bash
# Check docker inspect for logging configuration
docker inspect capo-frontend | grep -A 10 "LogConfig"
docker inspect capo-backend | grep -A 10 "LogConfig"
```

**Expected Result**:
- LogConfig shows `Type: json-file`
- Config contains `MaxSize`: `10485760` (10MB)
- Config contains `MaxFile`: `3`

### Test 8: Application Log Files (Optional)

**Objective**: Verify application log file mounts work.

```bash
# Start containers
docker-compose up -d
sleep 5

# Check if log files are created (if apps write to /app/logs)
ls -la logs/frontend/
ls -la logs/backend/

# Create a test log file in frontend container
docker exec capo-frontend sh -c "echo 'Test log entry' > /app/logs/test.log"

# Verify file appears on host
cat logs/frontend/test.log

# Cleanup
docker-compose down
rm -f logs/*/test.log
```

**Expected Result**:
- Files written to `/app/logs` in container appear in `./logs/*` on host
- Log file content matches between container and host

## Verification Checklist

- [ ] Log directories created (`logs/frontend/`, `logs/backend/`)
- [ ] `.gitignore` includes logs directory
- [ ] `docker-compose.yml` has logging configuration
- [ ] `taillogs.sh` script works with various arguments
- [ ] npm scripts reference taillogs helper
- [ ] Containers start and collect logs
- [ ] Logs are viewable via taillogs script
- [ ] Logs persist across container restarts
- [ ] Log rotation is configured correctly

## Common Issues

### Issue: "Permission denied" running taillogs.sh

**Solution**: Make script executable:
```bash
chmod +x scripts/taillogs.sh
```

### Issue: "Container not found" error

**Solution**: Ensure containers are built and running:
```bash
docker-compose ps
docker-compose up -d
```

### Issue: No logs appearing

**Solution**: Check if application is actually outputting to stdout/stderr:
```bash
docker logs <container-name>
```

## Success Criteria

Track C is complete when:

1. ✅ Log directories exist and are gitignored
2. ✅ docker-compose.yml has logging configured with rotation
3. ✅ taillogs.sh script supports configurable line count
4. ✅ npm scripts work correctly
5. ✅ Logs are collected and viewable when containers run
6. ✅ Documentation is complete (README.md in logs/)

## Next Steps

After this track is complete:

1. Coordinate with Track A (bd-3kg) to ensure Dockerfiles are created
2. Coordinate with Track B (bd-3rc) to verify npm scripts work together
3. Test full Docker workflow: build, start, view logs, stop
4. Archive this track when all tests pass
