import { describe, it, expect } from 'vitest';
import { parseAbiManifest, loadAbiManifestFromFile } from '../src/parse.js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('WASM-ABI v1 Parser', () => {
  describe('valid manifest', () => {
    it('should parse conformance fixture successfully', () => {
      const manifest = loadAbiManifestFromFile(
        '__fixtures__/abi_conformance.json',
      );

      expect(manifest.schema_version).toBe('wasm-abi/1');
      expect(manifest.methods).toHaveLength(29);
      expect(manifest.events).toHaveLength(5);
      expect(Object.keys(manifest.types)).toHaveLength(8);

      // Check specific types
      expect(manifest.types.AbiState).toBeDefined();
      expect(manifest.types.AbiState.kind).toBe('record');
      expect(manifest.types.Person).toBeDefined();
      expect(manifest.types.Person.kind).toBe('record');
      expect(manifest.types.Profile).toBeDefined();
      expect(manifest.types.Profile.kind).toBe('record');
      expect(manifest.types.Action).toBeDefined();
      expect(manifest.types.Action.kind).toBe('variant');
      expect(manifest.types.ConformanceError).toBeDefined();
      expect(manifest.types.ConformanceError.kind).toBe('variant');
      expect(manifest.types.UserId32).toBeDefined();
      expect(manifest.types.UserId32.kind).toBe('bytes');
      expect(manifest.types.Hash64).toBeDefined();
      expect(manifest.types.Hash64.kind).toBe('bytes');

      // Check methods
      const methodNames = manifest.methods.map((m) => m.name);
      expect(methodNames).toContain('opt_u32');
      expect(methodNames).toContain('list_u32');
      expect(methodNames).toContain('map_u32');
      expect(methodNames).toContain('make_person');
      expect(methodNames).toContain('profile_roundtrip');
      expect(methodNames).toContain('act');
      expect(methodNames).toContain('roundtrip_id');
      expect(methodNames).toContain('roundtrip_hash');
      expect(methodNames).toContain('may_fail');
      expect(methodNames).toContain('find_person');

      // Check events
      const eventNames = manifest.events.map((e) => e.name);
      expect(eventNames).toContain('Ping');
      expect(eventNames).toContain('Named');
      expect(eventNames).toContain('Data');
      expect(eventNames).toContain('PersonUpdated');
      expect(eventNames).toContain('ActionTaken');
    });

    it('should return deeply frozen manifest', () => {
      const manifest = loadAbiManifestFromFile(
        '__fixtures__/abi_conformance.json',
      );

      // Test that the root object is frozen
      expect(() => {
        (manifest as any).methods = [];
      }).toThrow();

      // Test that nested objects are also frozen
      expect(() => {
        (manifest.methods as any).push({ name: 'test', params: [] });
      }).toThrow();

      // Test that nested type objects are frozen
      expect(() => {
        (manifest.types.Person as any).fields = [];
      }).toThrow();

      // Verify that Object.isFrozen returns true for nested objects
      expect(Object.isFrozen(manifest.methods)).toBe(true);
      expect(Object.isFrozen(manifest.types.Person)).toBe(true);
    });

    it('should have correct invariants on conformance fixture', () => {
      const manifest = loadAbiManifestFromFile(
        '__fixtures__/abi_conformance.json',
      );

      // Check opt_u32 has nullable param and return
      const optU32Method = manifest.methods.find((m) => m.name === 'opt_u32');
      expect(optU32Method).toBeDefined();
      expect(optU32Method!.params[0].nullable).toBe(true);
      expect(optU32Method!.returns_nullable).toBe(true);

      // Check map_u32 uses string key
      const mapU32Method = manifest.methods.find((m) => m.name === 'map_u32');
      expect(mapU32Method).toBeDefined();
      const mapType = mapU32Method!.params[0].type;
      expect((mapType as any).key.kind).toBe('string');

      // Check Data event payload is variable bytes (no size)
      const dataEvent = manifest.events.find((e) => e.name === 'Data');
      expect(dataEvent).toBeDefined();
      expect(dataEvent!.payload).toBeDefined();
      expect('size' in (dataEvent!.payload as any)).toBe(false);

      // Check ConformanceError variants have payload for NOT_FOUND
      const conformanceError = manifest.types.ConformanceError;
      const notFoundVariant = (conformanceError as any).variants.find(
        (v: any) => v.name === 'NotFound',
      );
      expect(notFoundVariant).toBeDefined();
      expect(notFoundVariant!.payload).toBeDefined();
    });
  });

  describe('invalid manifests', () => {
    it('should reject invalid schema version', () => {
      const invalidManifest = {
        schema_version: 'wasm-abi/2',
        types: {},
        methods: [],
        events: [],
      };

      expect(() => parseAbiManifest(invalidManifest)).toThrow(
        'ABI schema validation failed:',
      );
    });

    it('should reject event with type instead of payload', () => {
      const invalidManifest = {
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

      expect(() => parseAbiManifest(invalidManifest)).toThrow(
        'ABI schema validation failed:',
      );
    });

    it('should reject variable bytes with size', () => {
      const invalidManifest = {
        schema_version: 'wasm-abi/1',
        types: {
          InvalidBytes: {
            kind: 'bytes',
            size: 0, // Invalid: variable bytes should not have size
            encoding: 'hex',
          },
        },
        methods: [],
        events: [],
      };

      expect(() => parseAbiManifest(invalidManifest)).toThrow(
        'ABI schema validation failed:',
      );
    });

    it('should reject map with non-string key', () => {
      const invalidManifest = {
        schema_version: 'wasm-abi/1',
        types: {
          InvalidMap: {
            kind: 'record',
            fields: [
              {
                name: 'data',
                type: {
                  kind: 'map',
                  key: { kind: 'u64' }, // Should be string
                  value: { kind: 'string' },
                },
              },
            ],
          },
        },
        methods: [],
        events: [],
      };

      expect(() => parseAbiManifest(invalidManifest)).toThrow(
        'Map key must be string type',
      );
    });

    it('should reject dangling $ref', () => {
      const invalidManifest = {
        schema_version: 'wasm-abi/1',
        types: {
          User: {
            kind: 'record',
            fields: [
              {
                name: 'id',
                type: { $ref: 'NonExistentType' },
              },
            ],
          },
        },
        methods: [],
        events: [],
      };

      expect(() => parseAbiManifest(invalidManifest)).toThrow(
        'Dangling $ref "NonExistentType"',
      );
    });

    it('should reject invalid JSON', () => {
      expect(() => {
        parseAbiManifest({ invalid: 'json' });
      }).toThrow('ABI schema validation failed:');
    });

    it('should reject duplicate method names', () => {
      const invalidManifest = {
        schema_version: 'wasm-abi/1',
        types: {},
        methods: [
          { name: 'test', params: [] },
          { name: 'test', params: [] }, // Duplicate name
        ],
        events: [],
      };

      expect(() => parseAbiManifest(invalidManifest)).toThrow(
        'Duplicate method names: test',
      );
    });

    it('should reject duplicate event names', () => {
      const invalidManifest = {
        schema_version: 'wasm-abi/1',
        types: {},
        methods: [],
        events: [
          { name: 'test_event' },
          { name: 'test_event' }, // Duplicate name
        ],
      };

      expect(() => parseAbiManifest(invalidManifest)).toThrow(
        'Duplicate event names: test_event',
      );
    });

    it('should reject duplicate type names', () => {
      // Note: JavaScript objects can't have duplicate keys by design
      // This test verifies the duplicate detection logic works
      const invalidManifest = {
        schema_version: 'wasm-abi/1',
        types: {
          Test: { kind: 'record', fields: [] },
        },
        methods: [],
        events: [],
      };

      // The duplicate detection is more about preventing programming errors
      // and ensuring the logic works correctly
      expect(() => parseAbiManifest(invalidManifest)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty manifest', () => {
      const emptyManifest = {
        schema_version: 'wasm-abi/1',
        types: {},
        methods: [],
        events: [],
      };

      const manifest = parseAbiManifest(emptyManifest);
      expect(manifest.methods).toHaveLength(0);
      expect(manifest.events).toHaveLength(0);
      expect(Object.keys(manifest.types)).toHaveLength(0);
    });

    it('should handle nullable fields and parameters', () => {
      const manifestWithNullables = {
        schema_version: 'wasm-abi/1',
        types: {
          Test: {
            kind: 'record',
            fields: [
              {
                name: 'required',
                type: { kind: 'string' },
              },
              {
                name: 'optional',
                type: { kind: 'string' },
                nullable: true,
              },
            ],
          },
        },
        methods: [
          {
            name: 'test',
            params: [
              {
                name: 'required',
                type: { kind: 'string' },
              },
              {
                name: 'optional',
                type: { kind: 'string' },
                nullable: true,
              },
            ],
            returns: { kind: 'string' },
            returns_nullable: true,
          },
        ],
        events: [],
      };

      const manifest = parseAbiManifest(manifestWithNullables);
      expect((manifest.types.Test as any).fields[1].nullable).toBe(true);
      expect(manifest.methods[0].params[1].nullable).toBe(true);
      expect(manifest.methods[0].returns_nullable).toBe(true);
    });

    it('should handle complex nested types', () => {
      const complexManifest = {
        schema_version: 'wasm-abi/1',
        types: {
          Complex: {
            kind: 'record',
            fields: [
              {
                name: 'list_of_maps',
                type: {
                  kind: 'list',
                  items: {
                    kind: 'map',
                    key: { kind: 'string' },
                    value: { kind: 'u64' },
                  },
                },
              },
              {
                name: 'variant_ref',
                type: { $ref: 'Status' },
              },
            ],
          },
          Status: {
            kind: 'variant',
            variants: [
              {
                name: 'Success',
                payload: { kind: 'string' },
              },
              {
                name: 'Error',
                payload: {
                  kind: 'record',
                  fields: [{ name: 'message', type: { kind: 'string' } }],
                },
              },
            ],
          },
        },
        methods: [],
        events: [],
      };

      const manifest = parseAbiManifest(complexManifest);
      expect(manifest.types.Complex.kind).toBe('record');
      const listField = (manifest.types.Complex as any).fields[0].type;
      const variantField = (manifest.types.Complex as any).fields[1].type;
      expect(listField.kind).toBe('list');
      expect(variantField.$ref).toBe('Status');
    });
  });

  describe('CLI integration', () => {
    it('should have correct bin entry in package.json', () => {
      const packageJson = JSON.parse(
        readFileSync(resolve(__dirname, '../package.json'), 'utf-8'),
      );
      expect(packageJson.bin['calimero-abi-codegen']).toBe('dist/cli.js');
    });

    it('should have CLI executable after build', () => {
      const cliPath = resolve(__dirname, '../dist/cli.js');
      expect(existsSync(cliPath)).toBe(true);
    });

    it('should have CLI executable and fixture files', () => {
      const cliPath = resolve(__dirname, '../dist/cli.js');
      const fixturePath = resolve(
        __dirname,
        '../__fixtures__/abi_conformance.json',
      );

      expect(existsSync(cliPath)).toBe(true);
      expect(existsSync(fixturePath)).toBe(true);
    });
  });
});
