import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { loadAbiManifestFromFile } from '../src/parse.js';
import { generateTypes } from '../src/generate/types.js';
import { generateClient } from '../src/generate/client.js';

describe('Codegen', () => {
  const conformanceAbiPath = path.join(__dirname, '../__fixtures__/abi_conformance.json');
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
      expect(typesContent).toContain('| { kind: "Update"; payload: { id: UserId32; changes: string } }');
      expect(typesContent).toContain('export type UserId32 = Uint8Array;');
      expect(typesContent).toContain('/** Fixed-size bytes array of 32 bytes */');
      expect(typesContent).toContain('export type make_personErrorCode = "INVALID_AGE" | "NAME_TOO_LONG";');
      expect(typesContent).toContain('export type AbiEvent =');
      expect(typesContent).toContain('| { name: "PersonUpdated"; payload: { person: Person; timestamp: number } }');
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
  });

  describe('client.ts generation', () => {
    it('should generate client.ts with correct structure', () => {
      const clientContent = generateClient(manifest, 'TestClient');
      
      // Snapshot the generated client
      expect(clientContent).toMatchSnapshot();
      
      // Assert key patterns
      expect(clientContent).toContain('export class TestClient {');
      expect(clientContent).toContain('export type Caller = <T>(method: string, params: unknown[]) => Promise<T>;');
      expect(clientContent).toContain('async opt_u32(value: number | null): Promise<number | null> {');
      expect(clientContent).toContain('return this.call("opt_u32", [value]);');
      expect(clientContent).toContain('async make_person(name: string, age: number, email: string | null): Promise<Person> {');
      expect(clientContent).toContain('@throws {Error} May throw the following errors:');
      expect(clientContent).toContain('- INVALID_AGE: string');
      expect(clientContent).toContain('- NAME_TOO_LONG');
    });

    it('should handle methods with errors correctly', () => {
      const clientContent = generateClient(manifest);
      
      expect(clientContent).toContain('async may_fail(should_fail: boolean): Promise<string> {');
      expect(clientContent).toContain('- INTENTIONAL_FAILURE: string');
    });

    it('should handle methods with nullable returns', () => {
      const clientContent = generateClient(manifest);
      
      expect(clientContent).toContain('async find_person(id: UserId32): Promise<Person | null> {');
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
        'export * from "./types";'
      );
      fs.writeFileSync(clientPath, updatedClientContent);
      
      // Also need to include the types directly in client.ts for the compile test
      const clientWithTypes = updatedClientContent.replace(
        '// Re-export all types from types.ts\nexport * from "./types";',
        '// Include types directly for compile test\n' + typesContent
      );
      fs.writeFileSync(clientPath, clientWithTypes);
      
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
          forceConsistentCasingInFileNames: true
        },
        include: ['*.ts']
      };
      fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
      
      // Run tsc --strict --noEmit
      try {
        execSync('tsc --strict --noEmit', { 
          cwd: tmpDir, 
          stdio: 'pipe',
          encoding: 'utf-8'
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