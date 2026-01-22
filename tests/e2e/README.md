# E2E Testing Guide

This directory contains end-to-end tests for `calimero-client-js` using Playwright.

## Prerequisites

- Node.js >= 18
- pnpm >= 8
- Docker (for running merod)
- Rust toolchain with `wasm32-unknown-unknown` target

## Local Testing

### Quick Start

Run the local E2E test script which sets up everything automatically:

```bash
./scripts/test-e2e-local.sh
```

This script will:
1. Build `calimero-client-js`
2. Create a test app using `create-mero-app`
3. Replace the client dependency with the built version
4. Build the KV store logic (WASM)
5. Start a Calimero node with embedded auth
6. Install the application
7. Start the frontend
8. Run Playwright tests

### Manual Testing

If you prefer to run tests manually:

1. **Build the client:**
   ```bash
   pnpm build
   cd lib && npm pack --pack-destination ../dist && cd ..
   ```

2. **Create test app:**
   ```bash
   mkdir /tmp/e2e-test && cd /tmp/e2e-test
   npx create-mero-app@latest test-kv-store --template rust
   cd test-kv-store
   ```

3. **Replace dependency:**
   ```bash
   cd app
   pnpm remove @calimero-network/calimero-client
   pnpm add file:../../calimero-client-js/dist/*.tgz
   cd ..
   ```

4. **Build WASM:**
   ```bash
   cd logic
   cargo build --target wasm32-unknown-unknown --release --profile app-release
   mkdir -p res
   cp target/wasm32-unknown-unknown/app-release/kv_store.wasm res/kv_store.wasm
   cd ..
   ```

5. **Start node:**
   ```bash
   docker run -d --name calimero-node \
     -p 2428:2428 -p 2528:2528 \
     -v $(pwd)/node-data:/data \
     ghcr.io/calimero-network/merod:edge \
     merod --home /data --node-name test-node run
   ```

6. **Build and start frontend:**
   ```bash
   cd app
   pnpm install
   pnpm build
   pnpm preview --port 5173
   ```

7. **Run tests:**
   ```bash
   export NODE_URL=http://localhost:2428
   export AUTH_URL=http://localhost:2428/auth
   pnpm exec playwright test
   ```

## CI Testing

The CI workflow (`.github/workflows/e2e-test.yml`) runs automatically on:
- Pull requests
- Pushes to `master` or `refactor/**` branches
- Manual workflow dispatch

## Writing Tests

Tests are located in `tests/e2e/*.spec.ts`. Use Playwright's API to interact with the UI:

```typescript
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});
```

## Debugging

### View test results:
```bash
pnpm exec playwright show-report
```

### Run tests in headed mode:
```bash
pnpm exec playwright test --headed
```

### Debug a specific test:
```bash
pnpm exec playwright test --debug
```

### Check node logs:
```bash
docker logs calimero-node
```

## Troubleshooting

### Node fails to start
- Check Docker is running: `docker info`
- Check ports are available: `lsof -i :2428`
- View node logs: `docker logs calimero-node`

### Frontend fails to build
- Ensure dependencies are installed: `pnpm install`
- Check Node.js version: `node --version` (should be >= 18)

### WASM build fails
- Install Rust target: `rustup target add wasm32-unknown-unknown`
- Check Cargo.toml has correct dependencies

### Tests timeout
- Increase timeout in `playwright.config.ts`
- Check frontend is accessible: `curl http://localhost:5173`
- Check node is accessible: `curl http://localhost:2428/health`
