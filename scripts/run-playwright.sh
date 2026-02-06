#!/bin/bash
# Run Playwright tests with real Node.js, avoiding Bun's shim
# This script ensures /usr/bin/node is used instead of Bun's node wrapper

set -e

# Clean PATH to prioritize real Node.js
export PATH="/usr/bin:/bin:/usr/local/bin"

# Verify we're using real Node.js
NODE_VERSION=$(/usr/bin/node --version)
echo "Using Node.js: $NODE_VERSION (from $(/usr/bin/node -e 'console.log(process.execPath)'))"

# Check Playwright version
PLAYWRIGHT_VERSION=$(/usr/bin/node ./node_modules/.bin/playwright --version)
echo "Using Playwright: $PLAYWRIGHT_VERSION"

# Run Playwright with all arguments passed to this script
exec /usr/bin/node ./node_modules/.bin/playwright "$@"
