import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { AbiManifest, AbiTypeRef } from './model.js';
import { deepFreeze } from './utils/deepFreeze.js';
import { formatAjvErrors } from './utils/ajvFormat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const schemaPath = join(__dirname, 'schema', 'wasm-abi-v1.schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

// Initialize AJV with formats support
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Compile the schema once
const validateSchema = ajv.compile(schema);

/**
 * Parse and validate a WASM-ABI v1 manifest
 * @param json - The JSON object to parse
 * @returns A frozen AbiManifest object
 * @throws Error if validation fails
 */
export function parseAbiManifest(json: unknown): AbiManifest {
  // Step 1: Validate against the schema
  const valid = validateSchema(json);
  if (!valid) {
    throw new Error(
      'ABI schema validation failed:\n' +
        formatAjvErrors(validateSchema.errors || []),
    );
  }

  const manifest = json as unknown as AbiManifest;

  // Step 2: Verify schema version
  if (manifest.schema_version !== 'wasm-abi/1') {
    throw new Error(
      `Invalid schema version: expected "wasm-abi/1", got "${manifest.schema_version}"`,
    );
  }

  // Step 3: Enforce invariants
  validateInvariants(manifest);

  // Step 4: Check for duplicate names
  assertUniqueNames(manifest);

  // Step 5: Return deeply frozen manifest to prevent mutation
  return deepFreeze(manifest);
}

/**
 * Load and parse a WASM-ABI v1 manifest from a file
 * @param path - Path to the JSON file
 * @returns A frozen AbiManifest object
 * @throws Error if file cannot be read or validation fails
 */
export function loadAbiManifestFromFile(path: string): AbiManifest {
  try {
    const content = readFileSync(path, 'utf-8');
    const json = JSON.parse(content);
    return parseAbiManifest(json);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in file ${path}: ${error.message}`);
    }
    if (error instanceof Error && error.message.includes('ENOENT')) {
      throw new Error(`File not found: ${path}`);
    }
    throw error;
  }
}

/**
 * Type guard to check if a TypeRef is a reference
 */
function isTypeRef(obj: AbiTypeRef): obj is { $ref: string } {
  return '$ref' in obj;
}

/**
 * Type guard to check if a TypeRef has a kind property
 */
function hasKind(
  obj: AbiTypeRef,
): obj is Exclude<AbiTypeRef, { $ref: string }> {
  return !isTypeRef(obj) && 'kind' in obj;
}

/**
 * Assert that names are unique within their respective collections
 */
function assertUniqueNames(manifest: AbiManifest): void {
  function assertUnique(kind: string, names: string[]) {
    const seen = new Set<string>();
    const dups: string[] = [];
    for (const n of names) {
      const k = n;
      if (seen.has(k)) dups.push(k);
      else seen.add(k);
    }
    if (dups.length) {
      throw new Error(
        `Duplicate ${kind} names: ${Array.from(new Set(dups)).join(', ')}`,
      );
    }
  }

  assertUnique(
    'method',
    manifest.methods.map((m) => m.name),
  );
  assertUnique(
    'event',
    manifest.events.map((e) => e.name),
  );
  assertUnique('type', Object.keys(manifest.types));
}

/**
 * Validate invariants that go beyond JSON schema validation
 */
function validateInvariants(manifest: AbiManifest): void {
  // Check for dangling $ref
  const definedTypes = new Set(Object.keys(manifest.types));

  // Helper function to check all TypeRefs in the manifest
  const checkTypeRefs = (typeRef: AbiTypeRef, context: string): void => {
    if (isTypeRef(typeRef)) {
      if (!definedTypes.has(typeRef.$ref)) {
        throw new Error(`Dangling $ref "${typeRef.$ref}" in ${context}`);
      }
    } else if (hasKind(typeRef)) {
      if (typeRef.kind === 'list') {
        checkTypeRefs(typeRef.items, `${context}.items`);
      } else if (typeRef.kind === 'map') {
        checkTypeRefs(typeRef.key, `${context}.key`);
        checkTypeRefs(typeRef.value, `${context}.value`);
      } else if (typeRef.kind === 'record') {
        for (const field of typeRef.fields) {
          checkTypeRefs(field.type, `${context}.field.${field.name}`);
        }
      }
      // Scalar types and bytes types don't have nested TypeRefs
    }
  };

  // Check all methods
  for (const method of manifest.methods) {
    for (const param of method.params) {
      checkTypeRefs(param.type, `method.${method.name}.param.${param.name}`);
    }
    if (method.returns) {
      checkTypeRefs(method.returns, `method.${method.name}.returns`);
    }
    if (method.errors) {
      for (const error of method.errors) {
        if (error.payload) {
          checkTypeRefs(
            error.payload,
            `method.${method.name}.error.${error.code}`,
          );
        }
      }
    }
  }

  // Check all events
  for (const event of manifest.events) {
    if (event.payload) {
      checkTypeRefs(event.payload, `event.${event.name}`);
    }
  }

  // Check all type definitions
  for (const [typeName, typeDef] of Object.entries(manifest.types)) {
    if (typeDef.kind === 'record') {
      for (const field of typeDef.fields) {
        checkTypeRefs(field.type, `type.${typeName}.field.${field.name}`);
      }
    } else if (typeDef.kind === 'variant') {
      for (const variant of typeDef.variants) {
        if (variant.payload) {
          checkTypeRefs(
            variant.payload,
            `type.${typeName}.variant.${variant.name}`,
          );
        }
      }
    }
  }

  // Check that map keys are strings (schema should enforce this, but double-check)
  const validateMapKeys = (typeRef: AbiTypeRef, context: string): void => {
    if (isTypeRef(typeRef)) {
      // References are checked elsewhere
      return;
    }

    if (hasKind(typeRef)) {
      if (typeRef.kind === 'map') {
        if (hasKind(typeRef.key) && typeRef.key.kind !== 'string') {
          throw new Error(`Map key must be string type in ${context}`);
        }
        validateMapKeys(typeRef.value, `${context}.value`);
      } else if (typeRef.kind === 'list') {
        validateMapKeys(typeRef.items, `${context}.items`);
      } else if (typeRef.kind === 'record') {
        for (const field of typeRef.fields) {
          validateMapKeys(field.type, `${context}.field.${field.name}`);
        }
      }
      // Scalar types and bytes types don't have nested TypeRefs
    }
  };

  // Validate map keys throughout the manifest
  for (const method of manifest.methods) {
    for (const param of method.params) {
      validateMapKeys(param.type, `method.${method.name}.param.${param.name}`);
    }
    if (method.returns) {
      validateMapKeys(method.returns, `method.${method.name}.returns`);
    }
  }

  for (const event of manifest.events) {
    if (event.payload) {
      validateMapKeys(event.payload, `event.${event.name}`);
    }
  }

  for (const [typeName, typeDef] of Object.entries(manifest.types)) {
    if (typeDef.kind === 'record') {
      for (const field of typeDef.fields) {
        validateMapKeys(field.type, `type.${typeName}.field.${field.name}`);
      }
    }
  }
}
