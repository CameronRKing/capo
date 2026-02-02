# @nutopia/vitest-server

A test watcher service that wraps `vitest --watch` and provides a CLI for agents to query test results.

## Problem

Agents interact with tests inefficiently:

* Test output floods context
* Agents run entire test suites instead of changed tests
* Watch mode results stay inaccessible to agents
* Memory limits differ between user and agent environments

## Solution

Run `vitest --watch` once per worktree with a custom reporter that stores results. Agents query results through `vq` instead of running tests directly.

## Installation

```bash
npm install @nutopia/vitest-server
```

## Usage

Start the server in your project:

```bash
vq start
```

### CLI Commands

| Command | Purpose | Key Options |
|---------|---------|-------------|
| `status` | Latest test run summary | `--server`, `--verbose`, `--minimal` |
| `query [pattern]` | Filter tests | `--status`, `--pattern`, `--tag`, `--test-suite` |
| `wait` | Wait for next run (or specific file) | `--file`, `--expect-run`, `--stream-results`, `--timeout` |
| `watch` | Stream real-time results | `--fail-only`, `--compact` |
| `history` | Test run history | `--limit`, `--offset`, `--status` |
| `start` | Start the server | `--port`, `--host`, `--no-watcher`, `--reporter` |
| `stop` | Stop the server | `--force`, `--timeout` |
| `restart` | Restart the server | Same as `start` |

### Common Examples

```bash
# Summary of latest run
vq status

# Server status (is it running?)
vq status --server

# Failed tests only
vq query --status failed

# Filter by pattern (matches feature/scenario names)
vq query ResumeRefiner

# Filter by tag
vq query --tag authentication

# Wait for next run to complete
vq wait

# Wait for tests triggered by a specific file (avoids race conditions!)
vq wait --file src/components/Button.tsx

# Wait with timeout and error if no tests run
vq wait --file src/app.ts --expect-run --timeout 60

# Stream test results as they arrive
vq wait --file src/utils/helpers.ts --stream-results

# Debug with verbose timestamp comparisons
vq wait --file src/components/Button.tsx --verbose

# Watch results in real-time
vq watch

# Show last 10 test runs
vq history

# Show only failed runs from history
vq history --status failed

# Stop the server
vq stop
```

## Output

Default: YAML (structured, human-readable)

```yaml
status: failed
totalTests: 5
passedTests: 3
failedTests: 1
skippedTests: 1
results:
  - id: abc123
    featureName: ResumeRefiner
    scenarioName: validates input
    status: failed
    error:
      name: AssertionError
      message: Expected true to be false
```

JSON output with `--json` flag.

## File-Triggered Test Runs

When working with agents/LLMs, you often need to wait for tests triggered by a specific file change. The `--file` option enables this with **timestamp-based filtering** to avoid race conditions.

### How It Works

```bash
# 1. LLM modifies a file
#    File mtime: 2024-01-15T10:00:00.000Z

# 2. Vitest detects change and starts tests
#    Trigger timestamp: 2024-01-15T10:00:00.500Z

# 3. LLM waits for tests from that specific file
vq wait --file src/components/Button.tsx --expect-run
```

The CLI:
1. Gets the file's modification time (mtime)
2. Waits for test runs where `triggerTimestamp >= file.mtime`
3. Confirms the file triggered the run
4. Returns results when complete

### Why This Matters

**Without file filtering (race condition):**
```
LLM modifies file → Tests start → LLM calls wait → Which run is ours?
```

**With file filtering (safe):**
```
LLM modifies file → Tests start → LLM calls wait with file.mtime → Matches!
```

Even if tests start before the CLI is called, timestamp comparison ensures we get the correct run.

### Options

| Option | Description |
|--------|-------------|
| `--file <path>` | Wait for test run triggered by specific file |
| `--expect-run` | Fail with error if no test runs within timeout |
| `--stream-results` | Stream test results as they arrive |
| `--timeout <sec>` | Timeout in seconds (default: 300) |
| `--verbose` | Show timestamp comparisons for debugging |
| `--quiet` | Minimal output |
| `--json` | Output as JSON |

### Examples

```bash
# Basic file wait
vq wait --file src/components/Button.tsx

# With expectation and timeout
vq wait --file src/app.ts --expect-run --timeout 60

# Stream results live
vq wait --file src/utils/formatters.ts --stream-results

# Debug mode
vq wait --file src/components/Button.tsx --verbose
```

### Output Example

```bash
$ vq wait --file src/components/Button.tsx --expect-run

Waiting for test run triggered by: src/components/Button.tsx
  File modified at: 2024-01-15T10:00:00.000Z
✓ Matching run found: run-abc123
  Triggered by: src/components/Button.tsx
  Trigger time: 2024-01-15T10:00:00.500Z
  ✓ renders correctly (45ms)
  ✓ handles click (12ms)
  ✗ validates props (failed: expected "aria-label")
✓ Test run complete
  Passed: 2, Failed: 1, Skipped: 0
  Duration: 1.23s
  Triggered by: src/components/Button.tsx
```

### Error Handling

```bash
# No tests run for the file
$ vq wait --file src/dead-code.ts --expect-run --timeout 10

Error: Expected test run for file "src/dead-code.ts" but none started within timeout

Possible causes:
- File not in test watch list
- No tests import/depend on this file
- Vitest watcher not running
```

## Reporter Configuration

### Vitest Integration

To stream test results to the server, configure vitest to use the `VitestServerReporter`:

#### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import { createVitestServerReporter } from '@nutopia/vitest-server/reporter';

export default defineConfig({
  test: {
    reporters: [
      'default', // Keep console output
      createVitestServerReporter(), // Stream to server
    ],
  },
});
```

#### Environment Variables

```bash
# Set server URL (default: http://localhost:3001)
export VITEST_SERVER_URL=http://localhost:3001

# Run tests
npm test
```

#### With Change Detection

```bash
# Only run tests for changed files
export VITEST_CHANGED_ONLY=true
npm test
```

#### Custom Base Branch

```bash
# Compare against custom branch (default: main)
export VITEST_BASE_BRANCH=develop
npm test
```

### API Endpoints

The reporter posts test results to these endpoints:

- **POST /api/test-runs** - Create a new test run
- **POST /api/test-results** - Submit a test result
- **PUT /api/test-runs/{id}** - Update test run with final stats

### Multiple Reporters

Combine with other vitest reporters:

```typescript
export default defineConfig({
  test: {
    reporters: [
      'default',
      'json',
      createVitestServerReporter(),
    ],
  },
});
```

### CI/CD Example

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test
        env:
          VITEST_SERVER_URL: ${{ secrets.VITEST_SERVER_URL }}
```
