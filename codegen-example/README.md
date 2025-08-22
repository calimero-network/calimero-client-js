# ABI Conformance Example

This example demonstrates the Calimero SDK's generated client with React hooks for ABI conformance testing.

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure environment variables**:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and fill in your actual values:

   ```env
   VITE_CALIMERO_CLIENT_APP_ID=your_client_application_id_here
   VITE_CALIMERO_APP_PATH=your_application_path_here
   ```

3. **Generate the client code**:

   ```bash
   npm run regenerate:abi-conformance
   ```

   This will generate the TypeScript client from the ABI manifest in `packages/abi-codegen/__fixtures__/abi_conformance.json`.

## Development

Start the development server:

```bash
npm run dev
```

The `predev` script will automatically regenerate the client code before starting the dev server.

## Generated Code

The generated code is located in `src/generated/abi-conformance/` and includes:

- `AbiConformanceClient.ts` - The main client class with all ABI methods
- `types.ts` - TypeScript type definitions for the ABI
- `index.ts` - Barrel exports

**Note**: The `generated/` folder is gitignored and should be regenerated automatically by the build process.

## ABI Conformance Tests

The example runs comprehensive tests against the WASM ABI to verify:

- Basic data types (bool, i32, u32, string, etc.)
- Complex types (records, lists, maps)
- Byte arrays (CalimeroBytes)
- Optional values
- Error handling
- Event handling

## Manual Regeneration

If you need to manually regenerate the client code (e.g., after changing the ABI manifest):

```bash
npm run regenerate:abi-conformance
```

This will:

1. Build the abi-codegen package
2. Generate the client from the ABI manifest
3. Create the necessary export files

## Environment Variables

- `VITE_CALIMERO_CLIENT_APP_ID`: Your Calimero client application ID
- `VITE_CALIMERO_APP_PATH`: Path to your Calimero application WASM file

**Note**: Never commit your actual `.env` file to version control. The `.env.example` file is provided as a template.
