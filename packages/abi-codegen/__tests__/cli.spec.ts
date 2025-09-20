import { describe, it, expect } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadAbiManifestFromFile } from '../src/parse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('CLI', () => {
  it('should have CLI executable and fixture files', () => {
    const cliPath = resolve(__dirname, '../dist/cli.js');
    const fixturePath = resolve(
      __dirname,
      '../__fixtures__/abi_conformance.json',
    );

    expect(existsSync(cliPath)).toBe(true);
    expect(existsSync(fixturePath)).toBe(true);
  });

  it('should validate valid ABI successfully', () => {
    const fixturePath = resolve(
      __dirname,
      '../__fixtures__/abi_conformance.json',
    );
    const manifest = loadAbiManifestFromFile(fixturePath);

    expect(manifest.schema_version).toBe('wasm-abi/1');
    expect(manifest.methods).toHaveLength(29);
    expect(manifest.events).toHaveLength(5);
    expect(Object.keys(manifest.types)).toHaveLength(8);
  });

  it('should fail with invalid ABI and show formatted errors', () => {
    // Create a temporary invalid ABI file
    const tempFile = resolve(__dirname, '../temp_invalid_abi.json');
    const invalidAbi = {
      schema_version: 'wasm-abi/1',
      types: {},
      methods: [],
      events: [
        {
          name: 'test_event',
          type: { kind: 'string' }, // Should be 'payload'
        },
      ],
    };

    try {
      writeFileSync(tempFile, JSON.stringify(invalidAbi, null, 2));

      expect(() => {
        loadAbiManifestFromFile(tempFile);
      }).toThrow('ABI schema validation failed:');
    } finally {
      try {
        unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });
});
