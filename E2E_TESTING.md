# E2E Testing Setup

This document describes the comprehensive E2E testing infrastructure for `calimero-client-js`.

## Overview

The E2E test suite validates the entire integration flow:
1. Builds `calimero-client-js` from source
2. Creates a test application using `create-mero-app`
3. Replaces the client dependency with the built version
4. Builds KV store logic (Rust → WASM)
5. Installs and runs `merod` (Calimero node) with embedded auth
6. Installs the WASM application on the node
7. Builds and runs the frontend
8. Runs Playwright tests to verify UI functionality

## Quick Start

### Local Testing

Run the automated script:

```bash
./scripts/test-e2e-local.sh
```

This script handles all setup automatically. It will:
- Build the client library
- Create a test app
- Start a node with Docker
- Run Playwright tests
- Clean up on exit

### CI Testing

The CI workflow (`.github/workflows/e2e-test.yml`) runs automatically on:
- Pull requests (when `src/**`, `package.json`, or workflow files change)
- Pushes to `master` or `refactor/**` branches
- Manual workflow dispatch

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CI Workflow                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Build calimero-client-js                           │
│     └─> Creates npm tarball                            │
│                                                          │
│  2. Create test app (create-mero-app)                   │
│     └─> Scaffolds KV store app                          │
│                                                          │
│  3. Replace dependency                                  │
│     └─> Uses built tarball instead of npm version       │
│                                                          │
│  4. Build WASM logic                                    │
│     └─> cargo build --target wasm32-unknown-unknown    │
│                                                          │
│  5. Start merod node                                    │
│     └─> Docker container with embedded auth             │
│                                                          │
│  6. Install application                                 │
│     └─> Deploy WASM to node                             │
│                                                          │
│  7. Build & start frontend                              │
│     └─> Vite preview server                             │
│                                                          │
│  8. Run Playwright tests                                │
│     └─> UI validation                                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
calimero-client-js/
├── .github/workflows/
│   └── e2e-test.yml              # CI workflow
├── scripts/
│   └── test-e2e-local.sh        # Local testing script
├── tests/e2e/
│   ├── playwright.config.ts      # Playwright configuration
│   ├── kv-store.spec.ts          # Test specifications
│   └── README.md                 # Test documentation
└── E2E_TESTING.md                # This file
```

## Prerequisites

### For Local Testing

- **Node.js** >= 18
- **pnpm** >= 8
- **Docker** (for running merod)
- **Rust** toolchain with `wasm32-unknown-unknown` target
- **curl** (for health checks)

### For CI

All prerequisites are handled by GitHub Actions:
- Node.js 20.x
- pnpm 8
- Rust stable with wasm32-unknown-unknown
- Docker (via GitHub Actions)

## Configuration

### Environment Variables

- `NODE_URL`: Calimero node API URL (default: `http://localhost:2428`)
- `AUTH_URL`: Authentication endpoint URL (default: `http://localhost:2428/auth`)
- `FRONTEND_URL`: Frontend application URL (default: `http://localhost:5173`)
- `TEST_DIR`: Test workspace directory (default: `/tmp/e2e-test-calimero-client`)

### Ports

- **2428**: Node RPC server
- **2528**: Node P2P swarm
- **5173**: Frontend preview server

## Writing Tests

Tests are written in TypeScript using Playwright. See `tests/e2e/kv-store.spec.ts` for examples.

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page }) => {
    // Your test code
  });
});
```

### Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Wait for network idle** before assertions
3. **Use timeouts appropriately** (default: 30s)
4. **Clean up state** between tests if needed
5. **Handle async operations** with proper awaits

## Debugging

### Local Debugging

1. **Run tests in headed mode:**
   ```bash
   pnpm exec playwright test --headed
   ```

2. **Debug specific test:**
   ```bash
   pnpm exec playwright test --debug
   ```

3. **View test report:**
   ```bash
   pnpm exec playwright show-report
   ```

4. **Check node logs:**
   ```bash
   docker logs calimero-node
   ```

5. **Check frontend logs:**
   ```bash
   # Logs are in /tmp/vite.log when using test script
   tail -f /tmp/vite.log
   ```

### CI Debugging

1. **View workflow logs** in GitHub Actions
2. **Download artifacts** (playwright-report)
3. **Check step outputs** for error messages
4. **Re-run failed jobs** to isolate issues

## Troubleshooting

### Common Issues

#### Node fails to start
- **Check Docker:** `docker info`
- **Check ports:** `lsof -i :2428`
- **View logs:** `docker logs calimero-node`
- **Try different ports:** Modify script variables

#### Frontend build fails
- **Check dependencies:** `pnpm install`
- **Check Node version:** `node --version` (>= 18)
- **Clear cache:** `rm -rf node_modules .pnpm-store`

#### WASM build fails
- **Install target:** `rustup target add wasm32-unknown-unknown`
- **Check Cargo.toml:** Ensure dependencies are correct
- **Try release profile:** `cargo build --release`

#### Tests timeout
- **Increase timeout** in `playwright.config.ts`
- **Check services:** Verify node and frontend are running
- **Check network:** Ensure no firewall blocking

#### Dependency replacement fails
- **Check tarball exists:** `ls dist/*.tgz`
- **Check package.json:** Verify dependency name matches
- **Try manual install:** `pnpm add file:../../dist/*.tgz`

## Performance

### Typical Runtime

- **Local:** ~5-10 minutes (includes builds)
- **CI:** ~15-20 minutes (includes caching)

### Optimization Tips

1. **Use caching** for dependencies (pnpm, cargo)
2. **Parallel builds** where possible
3. **Skip unnecessary steps** in local testing
4. **Use Docker layer caching** for node setup

## Future Improvements

- [ ] Add more comprehensive test coverage
- [ ] Support multiple browser testing
- [ ] Add visual regression testing
- [ ] Support testing against different node versions
- [ ] Add performance benchmarking
- [ ] Support testing with external auth (not just embedded)

## Contributing

When adding new tests:

1. Follow existing test patterns
2. Add appropriate data-testid attributes to UI
3. Document any new requirements
4. Update this README if workflow changes
5. Test locally before pushing

## Support

For issues or questions:
- Check `tests/e2e/README.md` for detailed test docs
- Review CI workflow logs
- Check Playwright documentation: https://playwright.dev
