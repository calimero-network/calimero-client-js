import { AbiManifest, AbiMethod, AbiTypeRef } from '../model.js';
import { formatIdentifier, generateFileBanner } from './emit.js';

/**
 * Generate a typed client from a WASM-ABI v1 manifest
 * @param manifest - The parsed ABI manifest
 * @param clientName - The name of the generated client class
 * @returns Generated TypeScript client as a string
 */
export function generateClient(
  manifest: AbiManifest,
  clientName: string = 'Client',
): string {
  const lines: string[] = [];

  // Add file banner
  lines.push(generateFileBanner().trim());
  lines.push('');

  // Add imports
  lines.push('// Re-export all types from types.ts');
  lines.push('export * from "./types";');
  lines.push('');

  // Add Caller type
  lines.push('/**');
  lines.push(' * Transport-agnostic caller interface');
  lines.push(' */');
  lines.push(
    'export type Caller = <T>(method: string, params: unknown[]) => Promise<T>;',
  );
  lines.push('');

  // Add Client class
  lines.push(`export class ${clientName} {`);
  lines.push(`  constructor(private readonly call: Caller) {}`);
  lines.push('');

  // Generate methods
  for (const method of manifest.methods) {
    lines.push(...generateMethod(method, manifest));
    lines.push('');
  }

  lines.push('}');

  return lines.join('\n');
}

/**
 * Generate a single method
 */
function generateMethod(method: AbiMethod, manifest: AbiManifest): string[] {
  const lines: string[] = [];
  const methodName = formatIdentifier(method.name);

  // Generate JSDoc comment
  lines.push('  /**');
  lines.push(`   * ${method.name}`);

  // Add error documentation if method has errors
  if (method.errors && method.errors.length > 0) {
    lines.push('   *');
    lines.push('   * @throws {Error} May throw the following errors:');
    for (const error of method.errors) {
      if (error.payload) {
        lines.push(
          `   * - ${error.code}: ${generateTypeRef(error.payload, manifest)}`,
        );
      } else {
        lines.push(`   * - ${error.code}`);
      }
    }
  }

  lines.push('   */');

  // Generate method signature
  const params = method.params.map((param) => {
    const paramType = generateTypeRef(param.type, manifest);
    const nullableType = param.nullable ? `${paramType} | null` : paramType;
    return `${formatIdentifier(param.name)}: ${nullableType}`;
  });

  const returnType = method.returns
    ? generateTypeRef(method.returns, manifest)
    : 'void';
  const nullableReturnType = method.returns_nullable
    ? `${returnType} | null`
    : returnType;

  lines.push(
    `  async ${methodName}(${params.join(', ')}): Promise<${nullableReturnType}> {`,
  );
  // ABI parameter order is authoritative - preserve the order from the manifest
  lines.push(
    `    return this.call("${method.name}", [${method.params.map((p) => formatIdentifier(p.name)).join(', ')}]);`,
  );
  lines.push('  }');

  return lines;
}

/**
 * Generate TypeScript type from an ABI type reference
 * (Simplified version for client generation - we can reuse the logic from types.ts)
 */
function generateTypeRef(typeRef: AbiTypeRef, manifest: AbiManifest): string {
  if ('$ref' in typeRef) {
    return formatIdentifier(typeRef.$ref);
  }

  switch (typeRef.kind) {
    case 'bool':
      return 'boolean';
    case 'i32':
    case 'i64':
    case 'u32':
    case 'u64':
    case 'f32':
    case 'f64':
      return 'number';
    case 'string':
      return 'string';
    case 'unit':
      return 'void';
    case 'bytes':
      return 'Uint8Array';
    case 'list':
      const itemType = generateTypeRef(typeRef.items, manifest);
      return `${itemType}[]`;
    case 'map':
      const keyType = generateTypeRef(typeRef.key, manifest);
      const valueType = generateTypeRef(typeRef.value, manifest);
      return `Record<${keyType}, ${valueType}>`;
    case 'record':
      // Inline record type
      const fields = typeRef.fields.map((field) => {
        const fieldType = generateTypeRef(field.type, manifest);
        const nullableType = field.nullable ? `${fieldType} | null` : fieldType;
        return `${formatIdentifier(field.name)}: ${nullableType}`;
      });
      return `{ ${fields.join('; ')} }`;
    default:
      throw new Error(`Unsupported type kind: ${(typeRef as any).kind}`);
  }
}
