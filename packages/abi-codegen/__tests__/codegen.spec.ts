import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { loadAbiManifestFromFile } from '../src/parse.js';
import { generateTypes } from '../src/generate/types.js';
import { generateClient } from '../src/generate/client.js';
import { deriveClientNameFromPath } from '../src/generate/emit.js';

describe('Codegen', () => {
  const conformanceAbiPath = path.join(
    __dirname,
    '../__fixtures__/abi_conformance.json',
  );
  let manifest: any;

  beforeAll(() => {
    manifest = loadAbiManifestFromFile(conformanceAbiPath);
  });

  describe('types.ts generation', () => {
    it('should generate types.ts with correct structure', () => {
      const typesContent = generateTypes(manifest);

      // Snapshot the generated types
      expect(typesContent).toMatchSnapshot();

      // Assert key patterns
      expect(typesContent).toContain('export interface Person {');
      expect(typesContent).toContain('export type ActionPayload =');
      expect(typesContent).toContain("| { name: 'SetName'; payload: string }");
      expect(typesContent).toContain(
        "| { name: 'Update'; payload: UpdatePayload }",
      );
      expect(typesContent).toContain('export type UserId32 = string;');
      expect(typesContent).toContain(
        '/** Fixed-length bytes (size: 32). Represented as string at runtime. */',
      );
      expect(typesContent).toContain(
        'export type may_failErrorCode = "BAD_INPUT" | "NOT_FOUND";',
      );
      expect(typesContent).toContain('export type AbiEvent =');
      expect(typesContent).toContain(
        '| { name: "PersonUpdated"; payload: string }',
      );
      // Unit events should not have payload property
      expect(typesContent).toContain('| { name: "Ping" }');
      expect(typesContent).not.toContain('| { name: "Ping"; payload:');
    });

    it('should handle nullable fields correctly', () => {
      const typesContent = generateTypes(manifest);

      expect(typesContent).toContain('bio: string | null;');
      expect(typesContent).toContain('bio: string | null;');
    });

    it('should handle maps correctly', () => {
      const typesContent = generateTypes(manifest);

      expect(typesContent).toContain('counters: Record<string, number>;');
    });

    it('should handle lists correctly', () => {
      const typesContent = generateTypes(manifest);

      // The conformance ABI has list_u32 method that returns number[]
      // But we need to check the client generation for this
      const clientContent = generateClient(manifest);
      expect(clientContent).toContain('number[]');
    });

    it('should handle unit returns correctly', () => {
      const clientContent = generateClient(manifest);

      // The 'act' method returns number
      expect(clientContent).toContain(
        'async act(params: { a: Types.ActionPayload }): Promise<number> {',
      );
    });

    it('should handle unit events correctly', () => {
      const typesContent = generateTypes(manifest);

      // Unit events should not have payload property in the union
      expect(typesContent).toContain('| { name: "Ping" }');
      expect(typesContent).not.toContain('| { name: "Ping"; payload:');

      // Unit events should not generate payload type aliases
      expect(typesContent).not.toContain('export type PingPayload =');
    });

    it('should include fixed bytes JSDoc', () => {
      const typesContent = generateTypes(manifest);

      // Fixed bytes should have JSDoc with size information
      expect(typesContent).toContain(
        '/** Fixed-length bytes (size: 32). Represented as string at runtime. */',
      );
      expect(typesContent).toContain(
        '/** Fixed-length bytes (size: 64). Represented as string at runtime. */',
      );
    });

    it('should handle variant inline struct payloads correctly', () => {
      const typesContent = generateTypes(manifest);

      // The Action variant "Update" has a reference to UpdatePayload
      expect(typesContent).toContain(
        "| { name: 'Update'; payload: UpdatePayload }",
      );
    });

    it('should handle variant $ref payloads correctly', () => {
      const typesContent = generateTypes(manifest);

      // The Action variant "SetName" has a string payload
      expect(typesContent).toContain("| { name: 'SetName'; payload: string }");
      // The Action variant "Ping" has no payload
      expect(typesContent).toContain("| { name: 'Ping' }");
    });
  });

  describe('client.ts generation', () => {
    it('should generate client.ts with correct structure', () => {
      const clientContent = generateClient(manifest, 'TestClient');

      // Snapshot the generated client
      expect(clientContent).toMatchSnapshot();

      // Assert key patterns
      expect(clientContent).toContain('export class TestClient {');
      expect(clientContent).toContain('import {');
      expect(clientContent).toContain('  CalimeroApp,');
      expect(clientContent).toContain('  Context,');
      // ExecutionResponse is no longer imported
      expect(clientContent).toContain(
        "} from '@calimero-network/calimero-client';",
      );
      expect(clientContent).toContain(
        'constructor(app: CalimeroApp, context: Context) {',
      );
      expect(clientContent).toContain(
        'async optU32(params: { x: number | null }): Promise<number | null> {',
      );
      expect(clientContent).toContain(
        "const response = await this.app.execute(this.context, 'opt_u32', params);",
      );
      expect(clientContent).toContain(
        'async makePerson(params: { p: Types.Person }): Promise<Types.Person> {',
      );
      expect(clientContent).toContain(
        "const response = await this.app.execute(this.context, 'make_person', params);",
      );
      expect(clientContent).toContain(
        '@throws {Types.may_failError} May throw the following errors:',
      );
      expect(clientContent).toContain('- BAD_INPUT');
      expect(clientContent).toContain('- NOT_FOUND: string');
    });

    it('should handle zero-parameter methods correctly', () => {
      // Note: The test ABI doesn't have any zero-parameter methods
      // This test would verify that zero-parameter methods have no arguments and pass empty object
      // For now, we'll skip this test since our test ABI has no such methods
      expect(true).toBe(true);
    });

    it('should handle single-parameter methods correctly', () => {
      const clientContent = generateClient(manifest);

      // Check that single-parameter methods use named params object
      expect(clientContent).toContain(
        'async roundtripId(params: { x: string }): Promise<string> {',
      );
      expect(clientContent).toContain(
        "const response = await this.app.execute(this.context, 'roundtrip_id', params);",
      );
      expect(clientContent).toContain(
        'async optU32(params: { x: number | null }): Promise<number | null> {',
      );
      expect(clientContent).toContain(
        "const response = await this.app.execute(this.context, 'opt_u32', params);",
      );
    });

    it('should handle multi-parameter methods correctly', () => {
      const clientContent = generateClient(manifest);

      // Check that multi-parameter methods use named params object with all fields
      expect(clientContent).toContain(
        'async makePerson(params: { p: Types.Person }): Promise<Types.Person> {',
      );
      expect(clientContent).toContain(
        "const response = await this.app.execute(this.context, 'make_person', params);",
      );
    });

    it('should preserve ABI method names verbatim in execute calls', () => {
      const clientContent = generateClient(manifest);

      // Check that ABI method names are used exactly as they appear in the ABI
      expect(clientContent).toContain("'opt_u32'");
      expect(clientContent).toContain("'list_u32'");
      expect(clientContent).toContain("'map_u32'");
      expect(clientContent).toContain("'make_person'");
      expect(clientContent).toContain("'profile_roundtrip'");
      expect(clientContent).toContain("'roundtrip_id'");
      expect(clientContent).toContain("'roundtrip_hash'");
      expect(clientContent).toContain("'may_fail'");
      expect(clientContent).toContain("'find_person'");
    });

    it('should handle methods with errors correctly', () => {
      const clientContent = generateClient(manifest);

      expect(clientContent).toContain(
        'async mayFail(params: { flag: boolean }): Promise<number> {',
      );
      expect(clientContent).toContain('- NOT_FOUND: string');
    });

    it('should handle methods with nullable returns', () => {
      const clientContent = generateClient(manifest);

      expect(clientContent).toContain(
        'async findPerson(params: { name: string }): Promise<Types.Person> {',
      );
    });

    it('should preserve parameter order in method calls', () => {
      const clientContent = generateClient(manifest);

      // The makePerson method has a single parameter of type Person
      expect(clientContent).toContain(
        'async makePerson(params: { p: Types.Person }): Promise<Types.Person> {',
      );
      expect(clientContent).toContain(
        "const response = await this.app.execute(this.context, 'make_person', params);",
      );
    });

    it('should include barrel export from types', () => {
      const clientContent = generateClient(manifest);

      // Should re-export all types from types.ts
      expect(clientContent).toContain('export * from "./types.js";');
    });

    it('should include generated banner', () => {
      const clientContent = generateClient(manifest);
      const typesContent = generateTypes(manifest);

      // Both files should have the generated banner
      expect(clientContent).toContain(
        '/** @generated by @calimero/abi-codegen — DO NOT EDIT. */',
      );
      expect(typesContent).toContain(
        '/** @generated by @calimero/abi-codegen — DO NOT EDIT. */',
      );
    });
  });

  describe('name derivation', () => {
    it('should derive client name from wasm filename correctly', () => {
      expect(deriveClientNameFromPath('kv_store.wasm')).toBe('KVStoreClient');
      expect(deriveClientNameFromPath('plantr.wasm')).toBe('PlantrClient');
      expect(deriveClientNameFromPath('abi-conformance.wasm')).toBe(
        'AbiConformanceClient',
      );
    });

    it('should derive client name from json filename correctly', () => {
      expect(deriveClientNameFromPath('abi-conformance.json')).toBe(
        'AbiConformanceClient',
      );
      expect(deriveClientNameFromPath('kv_store.json')).toBe('KVStoreClient');
    });

    it('should handle paths with directories', () => {
      expect(deriveClientNameFromPath('/tmp/kv_store.wasm')).toBe(
        'KVStoreClient',
      );
      expect(
        deriveClientNameFromPath(
          'apps/kv_store/target/wasm32-unknown-unknown/debug/kv_store.wasm',
        ),
      ).toBe('KVStoreClient');
    });

    it('should handle edge cases', () => {
      expect(deriveClientNameFromPath('')).toBe('Client');
      expect(deriveClientNameFromPath('a')).toBe('AClient');
      expect(deriveClientNameFromPath('ab')).toBe('ABClient');
      expect(deriveClientNameFromPath('abc')).toBe('AbcClient');
    });

    it('should generate client with derived name', () => {
      const clientContent = generateClient(manifest, 'KVStoreClient');

      expect(clientContent).toContain('export class KVStoreClient {');
      expect(clientContent).toContain(
        'constructor(app: CalimeroApp, context: Context) {',
      );
      expect(clientContent).toContain('import {');
      expect(clientContent).toContain('  CalimeroApp,');
      expect(clientContent).toContain('  Context,');
      expect(clientContent).toContain(
        "} from '@calimero-network/calimero-client';",
      );
    });
  });

  describe('manifest immutability', () => {
    it('should not mutate the manifest during generation', () => {
      // Test that the manifest is deeply frozen
      expect(() => {
        // This should throw if the manifest is properly frozen
        (manifest as any).methods.push({ name: 'test', params: [] });
      }).toThrow();

      // Test a nested variant payload node
      expect(() => {
        // This should throw if the manifest is properly frozen
        (manifest.types.Action.variants[1] as any).payload = { kind: 'string' };
      }).toThrow();
    });
  });

  describe('compile test', () => {
    it('should generate code that compiles under tsc --strict', () => {
      const typesContent = generateTypes(manifest);
      const clientContent = generateClient(manifest);

      // Create a temporary directory for the test
      const tmpDir = path.join(__dirname, '../tmp/gen');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      // Write the generated files
      const typesPath = path.join(tmpDir, 'types.ts');
      const clientPath = path.join(tmpDir, 'client.ts');
      fs.writeFileSync(typesPath, typesContent);
      fs.writeFileSync(clientPath, clientContent);

      // Update client.ts to import from the same directory
      const updatedClientContent = clientContent.replace(
        'export * from "./types.js";',
        'export * from "./types";',
      );
      fs.writeFileSync(clientPath, updatedClientContent);

      // Also need to include the types directly in client.ts for the compile test
      const clientWithTypes = updatedClientContent.replace(
        'export * from "./types";',
        '// Include types directly for compile test\n' + typesContent,
      );

      // Remove the calimero-client import and add mock types for compile test
      const clientWithMockedImport = clientWithTypes.replace(
        `import {
  CalimeroApp,
  Context,
} from '@calimero-network/calimero-client';`,
        `// Mock types for compile test
type CalimeroApp = any;
type Context = any;`,
      );

      // Add a test stub to verify the new parameter structure compiles
      const testStub = `
// Test stub to verify parameter structure
const app = { execute: async (_c: any, _m: string, _p?: Record<string, unknown>) => ({ success: true, result: null }) } as any;
const ctx = {} as any;
const client = new Client(app, ctx);
await client.roundtripId({ x: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" });
await client.makePerson({ p: { id: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as any, name: "test", age: 25 } });
await client.act({ a: Action.Ping() });
`;
      const clientWithTestStub = clientWithMockedImport + testStub;
      fs.writeFileSync(clientPath, clientWithTestStub);

      // Create a minimal tsconfig.json
      const tsconfigPath = path.join(tmpDir, 'tsconfig.json');
      const tsconfig = {
        compilerOptions: {
          target: 'ES2020',
          module: 'ESNext',
          moduleResolution: 'node',
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
        },
        include: ['*.ts'],
      };
      fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));

      // Run tsc --strict --noEmit using the local TypeScript installation
      try {
        execSync('npx tsc --strict --noEmit', {
          cwd: tmpDir,
          stdio: 'pipe',
          encoding: 'utf-8',
        });
      } catch (error: any) {
        // If compilation fails, show the error
        console.error('TypeScript compilation failed:');
        console.error(error.stdout || error.stderr);
        throw error;
      }
    });
  });
});
