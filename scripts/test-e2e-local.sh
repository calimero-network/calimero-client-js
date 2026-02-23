#!/bin/bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
TEST_DIR="${TEST_DIR:-/tmp/e2e-test-calimero-client}"
FRONTEND_PORT=5173
NODE_PORT=2428
NODE_URL="http://localhost:$NODE_PORT"

# Cleanup function
cleanup() {
  echo -e "${YELLOW}Cleaning up...${NC}"
  # Stop merod if running
  if [ -n "${MEROD_PID:-}" ]; then
    kill "$MEROD_PID" 2>/dev/null || true
  fi
  # Cleanup frontend
  pkill -f "vite.*$FRONTEND_PORT" || true
  # Cleanup node data
  if [ -d "$TEST_DIR/node-data" ]; then
    rm -rf "$TEST_DIR/node-data"
  fi
  echo -e "${GREEN}Cleanup complete${NC}"
}

trap cleanup EXIT

# Check prerequisites
echo -e "${GREEN}Checking prerequisites...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}Error: node is not installed${NC}" >&2; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo -e "${RED}Error: pnpm is not installed${NC}" >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo -e "${RED}Error: curl is not installed${NC}" >&2; exit 1; }

echo -e "${GREEN}All prerequisites met${NC}"

# Step 1: Build calimero-client-js
echo -e "${GREEN}[1/8] Building calimero-client-js...${NC}"
CLIENT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$CLIENT_ROOT"
pnpm install
pnpm build

# Create tarball
mkdir -p dist
npm pack --pack-destination dist
CLIENT_TARBALL=$(ls dist/*.tgz | head -1)
CLIENT_TARBALL_PATH="$CLIENT_ROOT/dist/$(basename "$CLIENT_TARBALL")"
echo -e "${GREEN}Built: $CLIENT_TARBALL_PATH${NC}"

# Step 2: Download merod binary
echo -e "${GREEN}[2/8] Downloading merod binary...${NC}"
MEROD_DIR="$TEST_DIR/merod"
mkdir -p "$MEROD_DIR"
MEROD_BINARY="$MEROD_DIR/merod"

# Detect architecture
ARCH=$(uname -m)
OS=$(uname -s | tr '[:upper:]' '[:lower:]')

case "$ARCH" in
  arm64|aarch64)
    if [ "$OS" = "darwin" ]; then
      ASSET_NAME="merod_aarch64-apple-darwin.tar.gz"
    else
      echo -e "${RED}Unsupported OS for ARM64: $OS${NC}" >&2
      exit 1
    fi
    ;;
  x86_64|amd64)
    if [ "$OS" = "darwin" ]; then
      ASSET_NAME="merod_x86_64-apple-darwin.tar.gz"
    elif [ "$OS" = "linux" ]; then
      ASSET_NAME="merod_x86_64-unknown-linux-gnu.tar.gz"
    else
      echo -e "${RED}Unsupported OS for x86_64: $OS${NC}" >&2
      exit 1
    fi
    ;;
  *)
    echo -e "${RED}Unsupported architecture: $ARCH${NC}" >&2
    exit 1
    ;;
esac

# Use RC release version
VERSION="0.10.0-rc.36"
echo -e "${YELLOW}Using merod RC version: $VERSION${NC}"

DOWNLOAD_URL="https://github.com/calimero-network/core/releases/download/$VERSION/$ASSET_NAME"

# Download if not exists or older than 1 day
if [ ! -f "$MEROD_BINARY" ] || [ "$(find "$MEROD_BINARY" -mtime +1 2>/dev/null)" ]; then
  echo -e "${YELLOW}Downloading merod from: $DOWNLOAD_URL${NC}"
  TEMP_TAR="$MEROD_DIR/temp.tar.gz"
  curl -L -o "$TEMP_TAR" "$DOWNLOAD_URL"
  cd "$MEROD_DIR"
  tar -xzf "$TEMP_TAR" merod
  rm "$TEMP_TAR"
  chmod +x "$MEROD_BINARY"
  echo -e "${GREEN}Merod downloaded successfully${NC}"
else
  echo -e "${GREEN}Merod binary already exists and is recent${NC}"
fi

# Step 3: Initialize and run merod node
echo -e "${GREEN}[3/8] Starting merod node...${NC}"
NODE_DATA_DIR="$TEST_DIR/node-data"
mkdir -p "$NODE_DATA_DIR"

# Initialize node if not already initialized
if [ ! -d "$NODE_DATA_DIR/node1" ]; then
  echo -e "${YELLOW}Initializing merod node...${NC}"
  "$MEROD_BINARY" \
    --home "$NODE_DATA_DIR" \
    --node-name node1 \
    init \
    --server-port "$NODE_PORT" \
    --auth-mode embedded \
    --auth-storage persistent
fi

# Start merod in background
echo -e "${YELLOW}Starting merod node...${NC}"
"$MEROD_BINARY" \
  --home "$NODE_DATA_DIR" \
  --node-name node1 \
  run > "$TEST_DIR/merod.log" 2>&1 &
MEROD_PID=$!
echo -e "${GREEN}Merod started with PID: $MEROD_PID${NC}"

# Step 4: Wait for node to be ready
echo -e "${GREEN}[4/8] Waiting for node to be ready...${NC}"
HEALTH_URL="$NODE_URL/auth/health"
for i in {1..30}; do
  if curl -f "$HEALTH_URL" 2>/dev/null; then
    echo -e "${GREEN}Node is ready at $NODE_URL!${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}Node failed to start${NC}"
    echo -e "${YELLOW}Merod logs:${NC}"
    tail -50 "$TEST_DIR/merod.log" || true
    exit 1
  fi
  echo "Attempt $i/30..."
  sleep 2
done

# Step 5: Setup test workspace and create app
echo -e "${GREEN}[5/8] Creating test app...${NC}"
rm -rf "$TEST_DIR/test-kv-store"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

printf "1\n" | npx create-mero-app@latest test-kv-store || {
  echo -e "${YELLOW}Note: If prompted, select option 1 (Rust template)${NC}"
  npx create-mero-app@latest test-kv-store
}
cd test-kv-store

# Step 6: Replace client dependency
echo -e "${GREEN}[6/8] Installing client dependency...${NC}"
if [ -f "app/package.json" ]; then
  cd app
  pnpm remove @calimero-network/calimero-client 2>/dev/null || true
  
  echo -e "${YELLOW}Installing calimero-client from: $CLIENT_TARBALL_PATH${NC}"
  pnpm add "file:$CLIENT_TARBALL_PATH"
  # mero-js will be installed automatically as a dependency from npm
  cd ..
fi

# Install dependencies
pnpm install
cd app && pnpm install && cd ..

# Step 7: Build and start frontend
echo -e "${GREEN}[7/8] Building and starting frontend...${NC}"
cd app
pnpm build

# Setup Playwright
pnpm add -D @playwright/test playwright || true
pnpm exec playwright install --with-deps chromium || true

# Copy Playwright config and tests
if [ -f "$CLIENT_ROOT/tests/e2e/playwright.config.ts" ]; then
  cp "$CLIENT_ROOT/tests/e2e/playwright.config.ts" playwright.config.ts
fi
mkdir -p tests/e2e
if [ -d "$CLIENT_ROOT/tests/e2e" ]; then
  cp "$CLIENT_ROOT/tests/e2e"/*.spec.ts tests/e2e/ 2>/dev/null || true
fi

# Start frontend server
echo -e "${YELLOW}Starting frontend server on port $FRONTEND_PORT...${NC}"
pnpm preview --port "$FRONTEND_PORT" --host 0.0.0.0 > "$TEST_DIR/vite.log" 2>&1 &
VITE_PID=$!
sleep 5

# Step 8: Run tests
echo -e "${GREEN}[8/8] Running Playwright tests...${NC}"
export NODE_URL="$NODE_URL"
export AUTH_URL="$NODE_URL/auth"
export FRONTEND_URL="http://localhost:$FRONTEND_PORT"
# Timeouts can be configured via environment variables:
# E2E_TIMEOUT: Base timeout in ms (default: 5000ms, longer operations use 2x or 3x)
# E2E_WAIT: Base wait in ms (default: 500ms, longer waits use 2x or 3x)
# Example: E2E_TIMEOUT=10000 E2E_WAIT=1000 ./scripts/test-e2e-local.sh
echo -e "${YELLOW}Node URL: $NODE_URL${NC}"
echo -e "${YELLOW}Auth URL: $AUTH_URL${NC}"
echo -e "${YELLOW}Frontend URL: $FRONTEND_URL${NC}"
TEST_RESULT=0
pnpm exec playwright test || TEST_RESULT=$?

echo -e "${GREEN}E2E test complete!${NC}"

# Cleanup after tests
cleanup

# Exit with test result code
exit $TEST_RESULT
