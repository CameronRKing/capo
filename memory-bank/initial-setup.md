# Initial Setup (One-Time)

The Convex backend requires two files to run non-interactively in Docker.

## Step 1: Create Local Deployment Configuration

```bash
# Create ~/.convex directory
mkdir -p ~/.convex

# Create local.json (tells Convex this is a local deployment)
echo '{"localDeployment": true}' > ~/.convex/local.json
```

## Step 2: Verify Docker Environment File

```bash
# Verify .env.docker exists (created by project setup)
cat .env.docker

# Should contain:
# CONVEX_DEPLOYMENT=anonymous:anonymous-nutopia
# CONVEX_LOCAL_ONLY=1
# CONVEX_ENABLE_FILE_POLLING=1
```

## Why This Is Needed

**`~/.convex/local.json`**:
- Prevents Convex CLI from prompting for login
- Enables non-interactive Docker operation
- Required for backend to start automatically

**`.env.docker`**:
- Provides deployment configuration to containerized Convex
- Mounted into backend container via `docker-compose.yml`
- Read by Convex CLI on startup

## Verification

```bash
# Verify local.json exists and has correct content
cat ~/.convex/local.json
# Output should be: {"localDeployment": true}

# Verify .env.docker is mounted in docker-compose.yml
grep -A 5 ".env.docker" docker-compose.yml
```

## If Backend Still Prompts

1. Verify `~/.convex/local.json` exists with exact content: `{"localDeployment": true}`
2. Check that `.env.docker` is mounted in `docker-compose.yml` under backend volumes
3. Verify the `dev:backend:docker` script in `package.json` uses:
   - `--configure existing` flag
   - `--env-file .env.docker` flag
4. Restart backend: `npm run docker:restart:backend`

## Common Issues

**Directory not created**: Run `mkdir -p ~/.convex` first

**Wrong JSON format**: Must be exact: `{"localDeployment": true}` (no trailing comma, no spaces except after colon)

**File not mounted**: Check `docker-compose.yml` has `.env.docker` in backend volumes

**Wrong flags**: Verify `dev:backend:docker` script includes both `--configure existing` and `--env-file .env.docker`
