# Systemd User Services for Development

**Problem**: A mysterious process killer terminates long-running dev servers and test runners every ~60 seconds.  
**Solution**: Run them as systemd user services, which are immune to the killer.

## Available Services

| Service | Description | Command |
|---------|-------------|---------|
| `vite-dev.service` | Vite dev server only | `npm run dev:frontend` |
| `vitest-dev.service` | Vitest watch mode | `npm test` |
| `npm-run-dev.service` | Full stack (frontend + backend) | `npm run dev` |

## Quick Reference

```bash
# Start services
systemctl --user start vite-dev        # Start Vite dev server
systemctl --user start vitest-dev      # Start test watcher
systemctl --user start npm-run-dev     # Start full dev stack

# Stop services
systemctl --user stop vite-dev

# Check status
systemctl --user status vite-dev

# View logs
journalctl --user -u vite-dev -f       # Live tail logs
journalctl --user -u vite-dev --since "5 min ago"  # Recent logs

# Auto-start on login
systemctl --user enable vite-dev
systemctl --user disable vite-dev       # Don't auto-start
```

## Common Workflows

### Start Vite Dev Server
```bash
systemctl --user start vite-dev
journalctl --user -u vite-dev -f  # Watch logs in another terminal
```

### Run Tests in Background
```bash
systemctl --user start vitest-dev
# Check test results via logs or browser
```

### Full Development Stack
```bash
systemctl --user start npm-run-dev
# Starts both frontend and backend with auto-restart
```

## Why Systemd Works

The mysterious killer targets:
- ❌ Terminal processes
- ❌ Tmux sessions
- ❌ Background jobs
- ❌ Node.js spawned processes

But **systemd services are protected**:
- ✅ Run in their own cgroup
- ✅ Managed by systemd (PID 1)
- ✅ Auto-restart on failure
- ✅ Immune to session-based process killers

## Troubleshooting

**Service fails to start:**
```bash
journalctl --user -u vite-dev -n 50  # Check error logs
```

**Need to restart after code changes:**
```bash
systemctl --user restart vite-dev
```

**Service not found:**
```bash
systemctl --user daemon-reload  # Reload systemd
```

## Service Files Location

Service definitions are in: `~/.config/systemd/user/*.service`

Edit them if you need to change:
- `ExecStart`: The command to run
- `WorkingDirectory`: Where to run from
- `Environment`: Environment variables
- `RestartSec`: Delay before restart (default: 3-5s)

## Persistence Across Logouts

To keep services running even when you log out:

```bash
loginctl enable-linger $(whoami)
```

Verify:
```bash
loginctl show-user $(whoami) | grep Linger
# Should show: Linger=yes
```

