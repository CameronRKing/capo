# Data Management

## Backup Database

```bash
# Export Convex data from running backend
docker exec capo-backend-1 npx convex export --local

# Copy exported ZIP to host
docker cp capo-backend-1:/app/convex-export.zip ./backup-$(date +%Y%m%d).zip
```

## Restore Database

```bash
# Stop backend
npm run docker:stop:backend

# Clear existing data (WARNING: destructive)
rm -rf ~/.convex

# Recreate local.json
mkdir -p ~/.convex
echo '{"localDeployment": true}' > ~/.convex/local.json

# Copy backup to container
docker cp ./backup-YYYYMMDD.zip capo-backend-1:/app/convex-export.zip

# Start backend
npm run docker:start:backend

# Import data (in container)
docker exec -it capo-backend-1 npx convex import --local convex-export.zip
```

## Complete Reset (Last Resort)

**WARNING**: Deletes all Convex database data. Use only when:
- Database is corrupted
- You need a completely fresh start
- Explicitly instructed to do so

```bash
# Stop all services
npm run docker:stop:all

# Delete the Convex data directory
rm -rf ~/.convex

# Recreate local.json for non-interactive setup
mkdir -p ~/.convex
echo '{"localDeployment": true}' > ~/.convex/local.json

# Restart services
npm run docker:start:all
```

**Note**: Unlike named volumes, `docker compose down -v` does NOT delete the data because `~/.convex` is a host directory mount, not a Docker volume.

## Inspect Database

```bash
# Connect to backend container
docker exec -it capo-backend-1 sh

# List Convex data
npx convex export --local

# View schema
npx convex schema --local

# Run queries (requires Convex functions)
npx convex run --local
```

## Data Persistence Notes

- Database files stored in `~/.convex` on host
- Survives `docker compose down` and container restarts
- Only deleted if you manually remove `~/.convex` directory
- Backups recommended before major changes

## Export Specific Tables

```bash
# Export all data
docker exec capo-backend-1 npx convex export --local

# Export creates ZIP with all tables
# No built-in way to export specific tables
# Use import/export for full backups only
```

## Migration Strategy

When modifying schema:

1. Deploy schema changes
2. Convex automatically handles migrations
3. Test in local environment first
4. Backup before major schema changes
5. Monitor logs for migration errors
