import { AbiManifest, AbiMethod, AbiTypeRef } from '../model.js';
import { formatIdentifier, generateFileBanner, toCamelCase } from './emit.js';

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
  lines.push('import {');
  lines.push('  CalimeroApp,');
  lines.push('  Context,');
  lines.push('  ExecutionResponse,');
  lines.push("} from '@calimero-network/calimero-client';");
  lines.push('');

  // Re-export all types from types.ts
  lines.push('export * from "./types";');
  lines.push('');

  // Add Client class
  lines.push(`export class ${clientName} {`);
  lines.push(`  private app: CalimeroApp;`);
  lines.push(`  private context: Context;`);
  lines.push('');
  lines.push(`  constructor(app: CalimeroApp, context: Context) {`);
  lines.push(`    this.app = app;`);
  lines.push(`    this.context = context;`);
  lines.push(`  }`);
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
  const methodName = toCamelCase(method.name);

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

  // Generate method body using CalimeroApp transport
  if (method.params.length === 0) {
    // No parameters - use empty object
    lines.push(
      `  public async ${methodName}(): Promise<${nullableReturnType}> {`,
    );
    lines.push(`    const response = await this.app.execute(this.context, '${method.name}', {});`);
  } else if (method.params.length === 1) {
    // Single parameter - pass directly
    const param = method.params[0];
    const paramName = formatIdentifier(param.name);
    lines.push(
      `  public async ${methodName}(${params.join(', ')}): Promise<${nullableReturnType}> {`,
    );
    lines.push(`    const response = await this.app.execute(this.context, '${method.name}', ${paramName});`);
  } else {
    // Multiple parameters - create params object
    lines.push(
      `  public async ${methodName}(${params.join(', ')}): Promise<${nullableReturnType}> {`,
    );
    const paramsObj = method.params.map(p => `${formatIdentifier(p.name)}`).join(', ');
    lines.push(`    const response = await this.app.execute(this.context, '${method.name}', { ${paramsObj} });`);
  }

  // Add response handling
  lines.push(`    if (response.success) {`);
  if (method.returns) {
    lines.push(`      return response.result as ${nullableReturnType};`);
  } else {
    lines.push(`      return;`);
  }
  lines.push(`    } else {`);
  lines.push(`      throw new Error(response.error || 'Execution failed');`);
  lines.push(`    }`);
  lines.push(`  }`);

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
