import { describe, it, expect } from 'vitest';
import { parseAbiManifest, loadAbiManifestFromFile } from '../src/parse.js';

describe('WASM-ABI v1 Parser', () => {
  describe('valid manifest', () => {
    it('should parse conformance fixture successfully', () => {
      const manifest = loadAbiManifestFromFile(
        '__fixtures__/abi_conformance.json',
      );

      expect(manifest.schema_version).toBe('wasm-abi/1');
      expect(manifest.methods).toHaveLength(4);
      expect(manifest.events).toHaveLength(3);
      expect(Object.keys(manifest.types)).toHaveLength(4);

      // Check specific types
      expect(manifest.types.User).toBeDefined();
      expect(manifest.types.User.kind).toBe('record');
      expect(manifest.types.FixedBytes.kind).toBe('bytes');
      expect((manifest.types.FixedBytes as any).size).toBe(32);
      expect(manifest.types.Status.kind).toBe('variant');
      expect((manifest.types.Status as any).variants).toHaveLength(3);

      // Check methods
      const createUserMethod = manifest.methods.find(
        (m) => m.name === 'create_user',
      );
      expect(createUserMethod).toBeDefined();
      expect(createUserMethod!.params).toHaveLength(2);
      expect(createUserMethod!.params[1].nullable).toBe(true);
      expect(createUserMethod!.errors).toHaveLength(2);

      // Check events
      const userCreatedEvent = manifest.events.find(
        (e) => e.name === 'user_created',
      );
      expect(userCreatedEvent).toBeDefined();
      expect(userCreatedEvent!.payload).toBeDefined();

      const userDeletedEvent = manifest.events.find(
        (e) => e.name === 'user_deleted',
      );
      expect(userDeletedEvent).toBeDefined();
      expect(userDeletedEvent!.payload).toBeUndefined();
    });

    it('should return frozen manifest', () => {
      const manifest = loadAbiManifestFromFile(
        '__fixtures__/abi_conformance.json',
      );

      expect(() => {
        (manifest as any).methods = [];
      }).toThrow();
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
        'Schema validation failed',
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
        'Schema validation failed',
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
        'Schema validation failed',
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
      }).toThrow('Schema validation failed');
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
});
