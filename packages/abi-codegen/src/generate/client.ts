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
  importPath: string = '@calimero-network/calimero-client',
): string {
  const lines: string[] = [];

  // Add file banner
  lines.push(generateFileBanner().trim());
  lines.push('');

  // Add imports
  lines.push('import {');
  lines.push('  CalimeroApp,');
  lines.push('  Context,');
  lines.push(`} from '${importPath}';`);
  lines.push('');

  // Import types for use in this file
  lines.push('import * as Types from "./types.js";');
  lines.push('');

  // Re-export all types from types.ts
  lines.push('export * from "./types.js";');
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

  // Add utility functions for hex string conversion if needed
  if (hasHexBytesTypes(manifest)) {
    lines.push(...generateHexUtilityFunctions());
    lines.push('');
  }

  // Generate methods
  for (const method of manifest.methods) {
    lines.push(...generateMethod(method, manifest, true));
    lines.push('');
  }

  lines.push('}');

  return lines.join('\n');
}

/**
 * Check if the manifest has any hex-encoded bytes types
 */
function hasHexBytesTypes(manifest: AbiManifest): boolean {
  // Check method parameters and return types
  for (const method of manifest.methods) {
    for (const param of method.params) {
      if (isHexBytesType(param.type, manifest)) {
        return true;
      }
    }
    if (method.returns && isHexBytesType(method.returns, manifest)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a type reference is a hex-encoded bytes type
 */
function isHexBytesType(typeRef: AbiTypeRef, manifest: AbiManifest): boolean {
  if ('$ref' in typeRef) {
    const typeDef = manifest.types[typeRef.$ref];
    return typeDef && typeDef.kind === 'bytes';
  }

  if (typeRef.kind === 'bytes') {
    return true; // All bytes types in our ABI have encoding: "hex"
  }

  if (typeRef.kind === 'list') {
    return isHexBytesType(typeRef.items, manifest);
  }

  if (typeRef.kind === 'map') {
    return isHexBytesType(typeRef.key, manifest) || isHexBytesType(typeRef.value, manifest);
  }

  if (typeRef.kind === 'record') {
    return typeRef.fields.some(field => isHexBytesType(field.type, manifest));
  }

  return false;
}

/**
 * Generate utility functions for hex string conversion
 */
function generateHexUtilityFunctions(): string[] {
  return [
    '  /**',
    '   * Utility function to convert hex string to Uint8Array',
    '   */',
    '  private hexToBytes(hex: string): Uint8Array {',
    '    return new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);',
    '  }',
    '',
    '  /**',
    '   * Utility function to convert Uint8Array to hex string',
    '   */',
    '  private bytesToHex(bytes: Uint8Array): string {',
    '    return Array.from(bytes).map(b => b.toString(16).padStart(2, \'0\')).join(\'\');',
    '  }',
    '',

    '  /**',
    '   * Utility function to deserialize bytes from contract responses',
    '   */',
    '  private deserializeBytes(result: any): Uint8Array {',
    '    if (Array.isArray(result)) {',
    '      return new Uint8Array(result);',
    '    }',
    '    // Handle case where result might be a hex string',
    '    if (typeof result === \'string\') {',
    '      return this.hexToBytes(result);',
    '    }',
    '    throw new Error(`Unexpected bytes result format: ${typeof result}`);',
    '  }',
  ];
}

/**
 * Generate a single method
 */
function generateMethod(method: AbiMethod, manifest: AbiManifest, useTypesNamespace: boolean = false): string[] {
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
          `   * - ${error.code}: ${generateTypeRef(error.payload, manifest, useTypesNamespace)}`,
        );
      } else {
        lines.push(`   * - ${error.code}`);
      }
    }
  }

  lines.push('   */');

  // Generate method signature and body
  const returnType = method.returns
    ? generateTypeRef(method.returns, manifest, useTypesNamespace, true)
    : 'void';
  const nullableReturnType = method.returns_nullable
    ? `${returnType} | null`
    : returnType;

  if (method.params.length === 0) {
    // No parameters - expose method with no arguments and pass empty object
    lines.push(
      `  public async ${methodName}(): Promise<${nullableReturnType}> {`,
    );
    lines.push(
      `    const response = await this.app.execute(this.context, '${method.name}', {});`,
    );
  } else {
    // 1+ parameters - build object type and expose single params argument
    const paramsTypeFields = method.params.map((param) => {
      const paramType = generateTypeRef(param.type, manifest, useTypesNamespace, true);
      const nullableType = param.nullable ? `${paramType} | null` : paramType;
      return `${formatIdentifier(param.name)}: ${nullableType}`;
    });
    
    lines.push(
      `  public async ${methodName}(params: { ${paramsTypeFields.join('; ')} }): Promise<${nullableReturnType}> {`,
    );

    // Check if any parameters need hex conversion
    const hasHexParams = method.params.some(param => isHexBytesType(param.type, manifest));
    const hasHexReturn = method.returns && isHexBytesType(method.returns, manifest);

    if (hasHexParams) {
      // Add parameter conversion for hex bytes types
      const convertedParams = method.params.map((param) => {
        const paramName = formatIdentifier(param.name);
        if (isHexBytesType(param.type, manifest)) {
          if (param.nullable) {
            return `      ${paramName}: params.${paramName} ? this.hexToBytes(params.${paramName}) : null,`;
          } else {
            return `      ${paramName}: this.hexToBytes(params.${paramName}),`;
          }
        }
        return `      ${paramName}: params.${paramName},`;
      });

      lines.push('    const convertedParams = {');
      lines.push(...convertedParams);
      lines.push('    };');
      lines.push(
        `    const response = await this.app.execute(this.context, '${method.name}', convertedParams);`,
      );
    } else {
      // No hex conversion needed - pass params directly
      lines.push(
        `    const response = await this.app.execute(this.context, '${method.name}', params);`,
      );
    }
  }

  // Add response handling
  lines.push(`    if (response.success) {`);
  if (method.returns) {
    if (isHexBytesType(method.returns, manifest)) {
      if (method.returns_nullable) {
        lines.push(`      if (response.result === null) {`);
        lines.push(`        return null as ${nullableReturnType};`);
        lines.push(`      }`);
        lines.push(`      const resultBytes = this.deserializeBytes(response.result);`);
        lines.push(`      return this.bytesToHex(resultBytes) as ${nullableReturnType};`);
      } else {
        lines.push(`      const resultBytes = this.deserializeBytes(response.result);`);
        lines.push(`      return this.bytesToHex(resultBytes) as ${nullableReturnType};`);
      }
    } else {
      lines.push(`      return response.result as ${nullableReturnType};`);
    }
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
 * @param forUserApi - If true, return string for hex bytes types instead of Uint8Array
 */
function generateTypeRef(typeRef: AbiTypeRef, manifest: AbiManifest, useTypesNamespace: boolean = false, forUserApi: boolean = false): string {
  if ('$ref' in typeRef) {
    const typeName = formatIdentifier(typeRef.$ref);
    const typeDef = manifest.types[typeRef.$ref];
    
    // Check if this is a hex bytes type
    if (forUserApi && typeDef && typeDef.kind === 'bytes') {
      return 'string'; // Return string for user API
    }
    
    return useTypesNamespace ? `Types.${typeName}` : typeName;
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
      return forUserApi ? 'string' : 'Uint8Array'; // Return string for user API if hex-encoded
    case 'list':
      const itemType = generateTypeRef(typeRef.items, manifest, useTypesNamespace, forUserApi);
      return `${itemType}[]`;
    case 'map':
      const keyType = generateTypeRef(typeRef.key, manifest, useTypesNamespace, forUserApi);
      const valueType = generateTypeRef(typeRef.value, manifest, useTypesNamespace, forUserApi);
      return `Record<${keyType}, ${valueType}>`;
    case 'record':
      // Inline record type
      const fields = typeRef.fields.map((field) => {
        const fieldType = generateTypeRef(field.type, manifest, useTypesNamespace, forUserApi);
        const nullableType = field.nullable ? `${fieldType} | null` : fieldType;
        return `${formatIdentifier(field.name)}: ${nullableType}`;
      });
      return `{ ${fields.join('; ')} }`;
    default:
      throw new Error(`Unsupported type kind: ${(typeRef as any).kind}`);
  }
}
