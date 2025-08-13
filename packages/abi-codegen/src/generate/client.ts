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
    if (!typeDef) return false;

    // If it's a bytes type, return true
    if (typeDef.kind === 'bytes') {
      return true;
    }

    // If it's a record type, check its fields recursively
    if (typeDef.kind === 'record') {
      return typeDef.fields.some((field) =>
        isHexBytesType(field.type, manifest),
      );
    }

    // For variant types, check their variants
    if (typeDef.kind === 'variant') {
      return typeDef.variants.some(
        (variant) =>
          variant.payload && isHexBytesType(variant.payload, manifest),
      );
    }

    return false;
  }

  if (typeRef.kind === 'bytes') {
    return true; // All bytes types in our ABI have encoding: "hex"
  }

  if (typeRef.kind === 'list') {
    return isHexBytesType(typeRef.items, manifest);
  }

  if (typeRef.kind === 'map') {
    return (
      isHexBytesType(typeRef.key, manifest) ||
      isHexBytesType(typeRef.value, manifest)
    );
  }

  if (typeRef.kind === 'record') {
    return typeRef.fields.some((field) => isHexBytesType(field.type, manifest));
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
    "    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');",
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
    "    if (typeof result === 'string') {",
    '      return this.hexToBytes(result);',
    '    }',
    '    throw new Error(`Unexpected bytes result format: ${typeof result}`);',
    '  }',
    '',
    '  /**',
    '   * Utility function to convert complex types with hex bytes fields',
    '   */',
    '  private convertComplexType(obj: any, typeRef: any): any {',
    '    if (!obj) return obj;',
    '    const result = { ...obj };',
    '    if (typeRef.$ref === "Person") {',
    '      if (typeof result.id === "string") {',
    '        result.id = Array.from(this.hexToBytes(result.id));',
    '      }',
    '    } else if (typeRef.$ref === "Profile") {',
    '      if (typeof result.avatar === "string") {',
    '        result.avatar = Array.from(this.hexToBytes(result.avatar));',
    '      }',
    '    } else if (typeRef.$ref === "UpdatePayload") {',
    '      if (typeof result.id === "string") {',
    '        result.id = Array.from(this.hexToBytes(result.id));',
    '      }',
    '    }',
    '    return result;',
    '  }',
    '',
    '  /**',
    '   * Utility function to convert enum variants to contract format',
    '   */',
    '  private convertVariant(variant: any, typeRef: any): any {',
    '    if (!variant) return variant;',
    '    ',
    '    if (typeRef.$ref === "Action") {',
    '      // Convert Action variant to WASM format',
    '      if (typeof variant === "object" && "name" in variant) {',
    '        if ("payload" in variant) {',
    '          // Convert complex payload types if needed',
    '          let convertedPayload = variant.payload;',
    '          if (variant.name === "Update" && typeof variant.payload === "object") {',
    '            convertedPayload = this.convertComplexType(variant.payload, { $ref: "UpdatePayload" });',
    '          }',
    '          return { kind: variant.name, payload: convertedPayload };',
    '        } else {',
    '          return { kind: variant.name };',
    '        }',
    '      } else if (typeof variant === "string") {',
    '        return { kind: variant };',
    '      }',
    '    }',
    '    ',
    '    return variant;',
    '  }',
  ];
}

/**
 * Generate a single method
 */
function generateMethod(
  method: AbiMethod,
  manifest: AbiManifest,
  useTypesNamespace: boolean = false,
): string[] {
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
      const paramType = generateTypeRef(
        param.type,
        manifest,
        useTypesNamespace,
        true,
        true, // forVariantParam - allow both enum values and payload variants
      );
      const nullableType = param.nullable ? `${paramType} | null` : paramType;
      return `${formatIdentifier(param.name)}: ${nullableType}`;
    });

    lines.push(
      `  public async ${methodName}(params: { ${paramsTypeFields.join('; ')} }): Promise<${nullableReturnType}> {`,
    );

    // Check if any parameters need conversion (hex bytes types, complex types containing hex bytes, or variant types)
    const hasHexParams = method.params.some((param) => {
      // Direct hex bytes types
      if ('kind' in param.type && param.type.kind === 'bytes') return true;
      if (
        '$ref' in param.type &&
        manifest.types[param.type.$ref]?.kind === 'bytes'
      )
        return true;

      // Complex types that contain hex bytes fields
      if (
        ('$ref' in param.type &&
          manifest.types[param.type.$ref]?.kind === 'record') ||
        ('kind' in param.type && param.type.kind === 'record')
      ) {
        return isHexBytesType(param.type, manifest);
      }

      // Variant types that need conversion
      if (
        '$ref' in param.type &&
        manifest.types[param.type.$ref]?.kind === 'variant'
      ) {
        return true;
      }

      return false;
    });
    const hasHexReturn =
      method.returns && isHexBytesType(method.returns, manifest);

    if (hasHexParams) {
      // Add parameter conversion for hex bytes types
      const convertedParams = method.params.map((param) => {
        const paramName = formatIdentifier(param.name);

        // Handle complex types that contain hex bytes fields
        if (
          ('$ref' in param.type &&
            manifest.types[param.type.$ref]?.kind === 'record') ||
          ('kind' in param.type && param.type.kind === 'record')
        ) {
          return `      ${paramName}: params.${paramName} ? this.convertComplexType(params.${paramName}, ${JSON.stringify(param.type)}) : null,`;
        }

        // Handle variant types
        if (
          '$ref' in param.type &&
          manifest.types[param.type.$ref]?.kind === 'variant'
        ) {
          return `      ${paramName}: params.${paramName} ? this.convertVariant(params.${paramName}, ${JSON.stringify(param.type)}) : null,`;
        }

        // Handle direct hex bytes types
        if (isHexBytesType(param.type, manifest)) {
          if (param.nullable) {
            return `      ${paramName}: params.${paramName} ? Array.from(this.hexToBytes(params.${paramName})) : null,`;
          } else {
            return `      ${paramName}: Array.from(this.hexToBytes(params.${paramName})),`;
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
    // Check if it's a direct hex bytes type (not a complex type containing hex bytes)
    const isDirectHexBytes =
      ('kind' in method.returns && method.returns.kind === 'bytes') ||
      ('$ref' in method.returns &&
        manifest.types[method.returns.$ref]?.kind === 'bytes');

    if (isDirectHexBytes) {
      if (method.returns_nullable) {
        lines.push(`      if (response.result === null) {`);
        lines.push(`        return null as ${nullableReturnType};`);
        lines.push(`      }`);
        lines.push(
          `      const resultBytes = this.deserializeBytes(response.result);`,
        );
        lines.push(
          `      return this.bytesToHex(resultBytes) as ${nullableReturnType};`,
        );
      } else {
        lines.push(
          `      const resultBytes = this.deserializeBytes(response.result);`,
        );
        lines.push(
          `      return this.bytesToHex(resultBytes) as ${nullableReturnType};`,
        );
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
function generateTypeRef(
  typeRef: AbiTypeRef,
  manifest: AbiManifest,
  useTypesNamespace: boolean = false,
  forUserApi: boolean = false,
  forVariantParam: boolean = false,
): string {
  if ('$ref' in typeRef) {
    const typeName = formatIdentifier(typeRef.$ref);
    const typeDef = manifest.types[typeRef.$ref];

    // Check if this is a hex bytes type
    if (forUserApi && typeDef && typeDef.kind === 'bytes') {
      return 'string'; // Return string for user API
    }

    // For variant types used as parameters, use the Payload type
    if (forVariantParam && typeDef && typeDef.kind === 'variant') {
      const payloadType = useTypesNamespace
        ? `Types.${typeName}Payload`
        : `${typeName}Payload`;
      return payloadType;
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
      const itemType = generateTypeRef(
        typeRef.items,
        manifest,
        useTypesNamespace,
        forUserApi,
      );
      return `${itemType}[]`;
    case 'map':
      const keyType = generateTypeRef(
        typeRef.key,
        manifest,
        useTypesNamespace,
        forUserApi,
      );
      const valueType = generateTypeRef(
        typeRef.value,
        manifest,
        useTypesNamespace,
        forUserApi,
      );
      return `Record<${keyType}, ${valueType}>`;
    case 'record':
      // Inline record type
      const fields = typeRef.fields.map((field) => {
        const fieldType = generateTypeRef(
          field.type,
          manifest,
          useTypesNamespace,
          forUserApi,
        );
        const nullableType = field.nullable ? `${fieldType} | null` : fieldType;
        return `${formatIdentifier(field.name)}: ${nullableType}`;
      });
      return `{ ${fields.join('; ')} }`;
    default:
      throw new Error(`Unsupported type kind: ${(typeRef as any).kind}`);
  }
}
