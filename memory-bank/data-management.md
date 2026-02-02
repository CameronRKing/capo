# Data Management

## Overview

Convex backend data is stored in `~/.convex` (host home directory). This directory survives:
- Backend restarts
- Container stops/starts
- System reboots

**Critical**: Frontend has NO data persistence. Vite serves static files only.

---

## Backup Procedures

### Quick Backup (Recommended)

```bash
# Export Convex data to ZIP
npx convex export --local > /tmp/convex-backup-$(date +%Y%m%d).zip

# This creates a ZIP file containing:
# - All database tables
# - Schema definitions
# - File storage (if any)
```

**Where backups are stored**: `/tmp/convex-backup-YYYYMMDD.zip`

**Automate daily backups** (optional):
```bash
# Add to crontab: crontab -e
# Runs daily at 2 AM
0 2 * * * npx convex export --local > /tmp/convex-backup-$(date +\%Y\%m\%d).zip
```

---

### Complete Backup (Including Configuration)

```bash
# Backup entire ~/.convex directory
cp -r ~/.convex ~/.convex.backup.$(date +%Y%m%d_%H%M%S)

# This backs up:
# - local.json configuration
# - Deployment state
# - SQLite database
# - File storage
# - UDF modules
```

**Use this when**:
- Major schema changes
- Before experiments
- Before deployment

---

## Restore Procedures

### From ZIP Export

```bash
# Stop backend first
pkill -f "convex dev"

# Import from backup
npx convex import /tmp/convex-backup-20250202.zip --local

# Restart backend
npm run dev:backend &
```

**Warning**: Import OVERWRITES all existing data.

---

### From Directory Backup

```bash
# Stop backend
pkill -f "convex dev"

# Remove current deployment
rm -rf ~/.convex/anonymous-convex-backend-state

# Restore from backup
cp -r ~/.convex.backup.20250202_143022/anonymous-convex-backend-state ~/.convex/

# Restart backend
npm run dev:backend &
```

**Use this when**:
- Database corrupted
- Deployment broken
- Need to revert changes

---

## Complete Reset (Last Resort)

**⚠️ WARNING**: This deletes ALL data. Use only when:
- Database is corrupted beyond repair
- Need completely fresh start
- Explicitly instructed by user

```bash
# Step 1: Stop backend
pkill -f "convex dev"

# Step 2: Backup current state (just in case)
cp -r ~/.convex ~/.convex.emergency.backup.$(date +%Y%m%d)

# Step 3: Remove deployment state
rm -rf ~/.convex/anonymous-convex-backend-state

# Step 4: Verify local.json still exists
cat ~/.convex/local.json
# Should contain: {"localDeployment": true}

# Step 5: Restart backend (will create fresh database)
npm run dev:backend &
```

---

## Database Inspection

### View Database Contents

```bash
# Using SQLite command line
sqlite3 ~/.convex/anonymous-convex-backend-state/anonymous-nutopia/convex_local_backend.sqlite3

# Inside SQLite:
.tables                    # List all tables
.schema _table             # Show table schema
SELECT * FROM _table;      # View all rows
.quit                      # Exit
```

---

### Check Database Integrity

```bash
# Run integrity check
sqlite3 ~/.convex/anonymous-convex-backend-state/anonymous-nutopia/convex_local_backend.sqlite3 "PRAGMA integrity_check;"

# Expected output: "ok"
# Any other output = corruption
```

---

### Query Database from Backend

Use Convex dashboard or write a temporary query:

```typescript
// convex/temp.ts
import { query } from "./_generated/server";

export const dumpDatabase = query({
  handler: async (ctx) => {
    const tables = ["users", "games", "sessions"]; // Your table names
    const dump: Record<string, any> = {};

    for (const table of tables) {
      dump[table] = await ctx.db.query(table).collect();
    }

    return dump;
  },
});
```

Run with: `npx convex run dumpDatabase --local`

---

## Data Migration Strategy

### Schema Changes

Convex handles schema migrations automatically:
- Add fields: Automatic (use default values or optional)
- Remove fields: Automatic (data orphaned but not deleted)
- Change field types: Manual migration required

**For type changes**:
1. Write migration function in `convex/`
2. Run via `npx convex run migrationName --local`
3. Verify data integrity
4. Delete migration function

---

### Deployment Migration

**Moving to a different deployment**:

```bash
# Export from current
npx convex export --local > backup.zip

# Import to new deployment
npx convex import backup.zip --deployment NEW_DEPLOYMENT_URL
```

---

## Storage Locations

### Files Created by Convex

```
~/.convex/
├── local.json                                    # Deployment config
└── anonymous-convex-backend-state/
    ├── config.json                               # Backend config
    └── anonymous-nutopia/                        # Your deployment
        ├── config.json                           # Deployment config
        ├── convex_local_backend.sqlite3          # Database (main data)
        ├── convex_local_storage/                 # File storage
        │   └── uploaded/                         # User uploaded files
        └── exports/                              # Exported data (if any)
```

---

### Database File

**Location**: `~/.convex/anonymous-convex-backend-state/anonymous-nutopia/convex_local_backend.sqlite3`

**Size**: Starts small (~100KB), grows with data

**Monitor size**:
```bash
ls -lh ~/.convex/anonymous-convex-backend-state/anonymous-nutopia/convex_local_backend.sqlite3
```

**Large databases** (>100MB):
- Consider archiving old data
- Export and store externally
- Clean up file storage

---

## Cleanup and Maintenance

### Clear File Storage

```bash
# Remove uploaded files (careful!)
rm -rf ~/.convex/anonymous-convex-backend-state/anonymous-nutopia/convex_local_storage/uploaded/*

# Restart backend
pkill -f "convex dev"
npm run dev:backend &
```

**Warning**: This permanently deletes all user-uploaded files.

---

### Remove Old Exports

```bash
# Clean up old export files
rm -f ~/.convex/anonymous-convex-backend-state/anonymous-nutopia/exports/*.zip
```

---

### Vacuum Database (Reclaim Space)

```bash
# Stop backend
pkill -f "convex dev"

# Vacuum database (reclaims space from deleted rows)
sqlite3 ~/.convex/anonymous-convex-backend-state/anonymous-nutopia/convex_local_backend.sqlite3 "VACUUM;"

# Restart backend
npm run dev:backend &
```

**When to vacuum**:
- After deleting large amounts of data
- Database file seems bloated
- Periodic maintenance (monthly)

---

## Troubleshooting Data Issues

### "Database is locked" Error

**Cause**: Another process is using the database

**Solution**:
```bash
# Kill all Convex processes
pkill -f "convex"

# Wait a few seconds
sleep 3

# Verify no processes
ps aux | grep convex

# Restart backend
npm run dev:backend &
```

---

### Data Not Persisting

**Diagnose**:
```bash
# Check if ~/.convex exists
ls -la ~/.convex/

# Check database file
ls -lh ~/.convex/anonymous-convex-backend-state/anonymous-nutopia/convex_local_backend.sqlite3

# Check permissions
stat ~/.convex
```

**Solutions**:
1. **Directory doesn't exist**: Backend will create it on first run
2. **Permission denied**: Fix permissions: `chmod 755 ~/.convex`
3. **Wrong deployment**: Check `~/.convex/local.json`

---

### Corrupted Database

**Symptoms**:
- Backend crashes with SQLite errors
- Queries return garbage
- `PRAGMA integrity_check` fails

**Solution**: See [Complete Reset](#complete-reset-last-resort) above

---

## Best Practices

1. **Backup before major changes**: Schema changes, data imports, experiments
2. **定期备份** (Regular backups): Daily for production, weekly for development
3. **Monitor database size**: Check monthly, archive if needed
4. **Test restores**: Verify backups work before relying on them
5. **Document migrations**: Keep track of schema changes and data migrations
6. **Never delete ~/.convex without backup**: Data loss is permanent

---

## Emergency Recovery

**Backend won't start and data seems lost**:

```bash
# 1. Check if backup exists
ls -la ~/.convex.backup*

# 2. If backup exists, restore it
cp -r ~/.convex.backup.YYYYMMDD ~/.convex

# 3. If no backup, try emergency export
# (might work if backend process still running)
pkill -9 -f "convex"
npx convex export --local > emergency-save.zip

# 4. Start fresh if all else fails
rm -rf ~/.convex/anonymous-convex-backend-state
npm run dev:backend &
```

---

Still stuck? See [troubleshooting.md](/memory-bank/troubleshooting.md) or [architecture.md](/memory-bank/architecture.md).
