# Calimero Client Libraries Workspace

This repository contains the Calimero client libraries organized as a monorepo workspace using pnpm.

## Current Status: Stage 1 - Workspace Setup ✅

The workspace has been successfully set up with the following structure:

```
calimero-client-js/
├── packages/
│   ├── calimero-client-react/    # Current React-integrated package
│   └── mero-js/                  # Future pure JS package (placeholder)
├── example/                      # Example application
├── pnpm-workspace.yaml          # Workspace configuration
└── package.json                 # Workspace root
```

## Packages

### `@calimero-network/calimero-client` (React Package)
**Status**: ✅ Active and working
- Contains the current React-integrated library
- All existing functionality preserved
- Builds and works correctly in workspace

### `@calimero-network/mero-js` (Mero.js Package)
**Status**: 🚧 Placeholder created
- Empty package structure ready for pure JS extraction
- Will contain framework-agnostic functionality
- Not yet implemented

## Getting Started

### Installation
```bash
pnpm install
```

### Building
```bash
# Build all packages
pnpm build

# Build specific package
cd packages/calimero-client-react
pnpm build
```

### Development
```bash
# Start development mode for all packages
pnpm dev

# Start development mode for specific package
cd packages/calimero-client-react
pnpm dev
```

## Next Steps

The following stages are planned for the extraction process:

1. **Stage 1**: ✅ Workspace Setup (Current)
2. **Stage 2**: Extract core modules (api, rpc, subscriptions, storage, types)
3. **Stage 3**: Create pure JS CalimeroApplication class
4. **Stage 4**: Update React package to depend on core package
5. **Stage 5**: Test both packages work correctly
6. **Stage 6**: Prepare for eventual separation into different repos

## Migration Path

- **Current users**: No changes needed, continue using `@calimero-network/calimero-client`
- **Future pure JS users**: Will use `@calimero-network/mero-js`
- **Future React users**: Will use `@calimero-network/calimero-client-react`

## Workspace Commands

- `pnpm build` - Build all packages
- `pnpm test` - Run tests for all packages  
- `pnpm lint` - Lint all packages
- `pnpm clean` - Clean build artifacts
- `pnpm dev` - Start development mode

## Package-specific Commands

Navigate to a specific package directory and run:

```bash
cd packages/calimero-client-react
pnpm build
pnpm test
pnpm lint
```