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
      expect(typesContent).toContain('export type Action =');
      expect(typesContent).toContain('| { kind: "Create"; payload: Person }');
      expect(typesContent).toContain(
        '| { kind: "Update"; payload: { id: UserId32; changes: string } }',
      );
      expect(typesContent).toContain('export type UserId32 = Uint8Array;');
      expect(typesContent).toContain(
        '/** Fixed-length bytes (size: 32). Represented as Uint8Array at runtime. */',
      );
      expect(typesContent).toContain(
        'export type make_personErrorCode = "INVALID_AGE" | "NAME_TOO_LONG";',
      );
      expect(typesContent).toContain('export type AbiEvent =');
      expect(typesContent).toContain(
        '| { name: "PersonUpdated"; payload: { person: Person; timestamp: number } }',
      );
      // Unit events should not have payload property
      expect(typesContent).toContain('| { name: "Ping" }');
      expect(typesContent).not.toContain('| { name: "Ping"; payload:');
    });

    it('should handle nullable fields correctly', () => {
      const typesContent = generateTypes(manifest);

      expect(typesContent).toContain('email: string | null;');
      expect(typesContent).toContain('bio: string | null;');
    });

    it('should handle maps correctly', () => {
      const typesContent = generateTypes(manifest);

      expect(typesContent).toContain('preferences: Record<string, string>;');
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

      // The 'act' method returns unit, which should map to void
      expect(clientContent).toContain(
        'async act(action: Action): Promise<void> {',
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
        '/** Fixed-length bytes (size: 32). Represented as Uint8Array at runtime. */',
      );
      expect(typesContent).toContain(
        '/** Fixed-length bytes (size: 64). Represented as Uint8Array at runtime. */',
      );
    });

    it('should handle variant inline struct payloads correctly', () => {
      const typesContent = generateTypes(manifest);

      // The Action variant "Update" has an inline struct payload
      expect(typesContent).toContain(
        '| { kind: "Update"; payload: { id: UserId32; changes: string } }',
      );
    });

    it('should handle variant $ref payloads correctly', () => {
      const typesContent = generateTypes(manifest);

      // The Action variant "Create" references Person type
      expect(typesContent).toContain('| { kind: "Create"; payload: Person }');
      // The Action variant "Delete" references UserId32 type
      expect(typesContent).toContain('| { kind: "Delete"; payload: UserId32 }');
    });
  });

  describe('client.ts generation', () => {
    it('should generate client.ts with correct structure', () => {
      const clientContent = generateClient(manifest, 'TestClient');

      // Snapshot the generated client
      expect(clientContent).toMatchSnapshot();

      // Assert key patterns
      expect(clientContent).toContain('export class TestClient {');
      expect(clientContent).toContain(
        'import {',
      );
      expect(clientContent).toContain(
        '  CalimeroApp,',
      );
      expect(clientContent).toContain(
        '  Context,',
      );
      expect(clientContent).toContain(
        '  ExecutionResponse,',
      );
      expect(clientContent).toContain(
        "} from '@calimero-network/calimero-client';",
      );
      expect(clientContent).toContain(
        'constructor(app: CalimeroApp, context: Context) {',
      );
      expect(clientContent).toContain(
        'async optU32(value: number | null): Promise<number | null> {',
      );
      expect(clientContent).toContain(
        'const response = await this.app.execute(this.context, \'opt_u32\', value);',
      );
      expect(clientContent).toContain(
        'async makePerson(name: string, age: number, email: string | null): Promise<Person> {',
      );
      expect(clientContent).toContain(
        'const response = await this.app.execute(this.context, \'make_person\', { name, age, email });',
      );
      expect(clientContent).toContain(
        '@throws {Error} May throw the following errors:',
      );
      expect(clientContent).toContain('- INVALID_AGE: string');
      expect(clientContent).toContain('- NAME_TOO_LONG');
    });

    it('should handle methods with errors correctly', () => {
      const clientContent = generateClient(manifest);

      expect(clientContent).toContain(
        'async mayFail(should_fail: boolean): Promise<string> {',
      );
      expect(clientContent).toContain('- INTENTIONAL_FAILURE: string');
    });

    it('should handle methods with nullable returns', () => {
      const clientContent = generateClient(manifest);

      expect(clientContent).toContain(
        'async findPerson(id: UserId32): Promise<Person | null> {',
      );
    });

    it('should preserve parameter order in method calls', () => {
      const clientContent = generateClient(manifest);

      // The makePerson method has parameters in order: name, age, email
      expect(clientContent).toContain(
        'async makePerson(name: string, age: number, email: string | null): Promise<Person> {',
      );
      expect(clientContent).toContain(
        'const response = await this.app.execute(this.context, \'make_person\', { name, age, email });',
      );
    });

    it('should include barrel export from types', () => {
      const clientContent = generateClient(manifest);

      // Should re-export all types from types.ts
      expect(clientContent).toContain('export * from "./types";');
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
      expect(deriveClientNameFromPath('abi-conformance.wasm')).toBe('AbiConformanceClient');
    });

    it('should derive client name from json filename correctly', () => {
      expect(deriveClientNameFromPath('abi-conformance.json')).toBe('AbiConformanceClient');
      expect(deriveClientNameFromPath('kv_store.json')).toBe('KVStoreClient');
    });

    it('should handle paths with directories', () => {
      expect(deriveClientNameFromPath('/tmp/kv_store.wasm')).toBe('KVStoreClient');
      expect(deriveClientNameFromPath('apps/kv_store/target/wasm32-unknown-unknown/debug/kv_store.wasm')).toBe('KVStoreClient');
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
      expect(clientContent).toContain('constructor(app: CalimeroApp, context: Context) {');
      expect(clientContent).toContain('import {');
      expect(clientContent).toContain('  CalimeroApp,');
      expect(clientContent).toContain('  Context,');
      expect(clientContent).toContain('  ExecutionResponse,');
      expect(clientContent).toContain("} from '@calimero-network/calimero-client';");
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
  ExecutionResponse,
} from '@calimero-network/calimero-client';`,
        `// Mock types for compile test
type CalimeroApp = any;
type Context = any;
type ExecutionResponse = any;`,
      );
      fs.writeFileSync(clientPath, clientWithMockedImport);

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
