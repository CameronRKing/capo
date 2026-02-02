# Log Management Quick Reference

**Track**: bd-2y8 (Log Management & Collection)
**Status**: ✅ Complete

## Quick Start

### View Logs

```bash
# Frontend logs (default 100 lines)
npm run docker:taillogs:frontend

# Backend logs (default 100 lines)
npm run docker:taillogs:backend

# Custom line count (via script directly)
./scripts/taillogs.sh frontend 50
./scripts/taillogs.sh backend 1000
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# Stop all services
docker-compose down

# View logs directly
docker logs -f capo-frontend
docker logs -f capo-backend
```

## Log Locations

- **Docker Container Logs**: Managed by Docker (json-file driver)
- **Application Logs**: `./logs/frontend/` and `./logs/backend/`
- **Max Size**: 10MB per file
- **Max Files**: 3 rotated files
- **Total Storage**: ~60MB per service

## Script Usage

```bash
./scripts/taillogs.sh <service> [linecount]

# Examples:
./scripts/taillogs.sh frontend       # Last 100 lines
./scripts/taillogs.sh backend 50     # Last 50 lines
./scripts/taillogs.sh frontend 1000  # Last 1000 lines
```

## Troubleshooting

### Containers not running?
```bash
docker-compose ps
docker-compose up -d
```

### No logs appearing?
```bash
docker logs capo-frontend
docker logs capo-backend
```

### Script permission denied?
```bash
chmod +x scripts/taillogs.sh
```

## Documentation

- **Usage Guide**: `logs/README.md`
- **Testing Guide**: `docs/log-management-testing.md`
- **Full Details**: `docs/log-management-implementation-summary.md`
