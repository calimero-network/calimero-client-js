import {
  AbiManifest,
  AbiMethod,
  AbiTypeRef,
  AbiTypeDef,
  AbiEvent,
} from '../model.js';
import { formatIdentifier, generateFileBanner, toCamelCase } from './emit.js';

/**
 * Utility class for handling byte conversions in Calimero
 */
class CalimeroBytes {
  private data: Uint8Array;

  constructor(input: string | number[] | Uint8Array) {
    if (typeof input === 'string') {
      // Hex string
      this.data = new Uint8Array(
        input.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
      );
    } else if (Array.isArray(input)) {
      // Number array
      this.data = new Uint8Array(input);
    } else {
      // Uint8Array
      this.data = input;
    }
  }

  toArray(): number[] {
    return Array.from(this.data);
  }

  toUint8Array(): Uint8Array {
    return this.data;
  }

  static fromHex(hex: string): CalimeroBytes {
    return new CalimeroBytes(hex);
  }

  static fromArray(arr: number[]): CalimeroBytes {
    return new CalimeroBytes(arr);
  }

  static fromUint8Array(bytes: Uint8Array): CalimeroBytes {
    return new CalimeroBytes(bytes);
  }
}

/**
 * Convert CalimeroBytes instances to arrays for WASM compatibility
 */
function convertCalimeroBytesForWasm(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof CalimeroBytes) {
    return obj.toArray();
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertCalimeroBytesForWasm(item));
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertCalimeroBytesForWasm(value);
    }
    return result;
  }

  return obj;
}

/**
 * Convert arrays back to CalimeroBytes instances from WASM responses
 */
function convertWasmResultToCalimeroBytes(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj) && obj.every((item) => typeof item === 'number')) {
    return new CalimeroBytes(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertWasmResultToCalimeroBytes(item));
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertWasmResultToCalimeroBytes(value);
    }
    return result;
  }

  return obj;
}

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

  // Generate types inline
  lines.push('// Generated types');
  lines.push('');

  // Generate type definitions
  for (const [typeName, typeDef] of Object.entries(manifest.types)) {
    lines.push(
      ...generateTypeDefinition(typeName, typeDef as AbiTypeDef, manifest),
    );
    lines.push('');
  }

  // Generate method error types
  for (const method of manifest.methods) {
    if (method.errors && method.errors.length > 0) {
      lines.push(...generateMethodErrorTypes(method, manifest));
      lines.push('');
    }
  }

  // Generate event payload types
  for (const event of manifest.events) {
    lines.push(...generateEventPayloadType(event, manifest));
    lines.push('');
  }

  // Generate union type for all events
  if (manifest.events.length > 0) {
    lines.push(...generateAbiEventUnion(manifest.events, manifest));
    lines.push('');
  }

  lines.push('');

  // Add CalimeroBytes utility class
  lines.push('/**');
  lines.push(' * Utility class for handling byte conversions in Calimero');
  lines.push(' */');
  lines.push('export class CalimeroBytes {');
  lines.push('  private data: Uint8Array;');
  lines.push('');
  lines.push('  constructor(input: string | number[] | Uint8Array) {');
  lines.push('    if (typeof input === "string") {');
  lines.push('      // Hex string');
  lines.push('      this.data = new Uint8Array(');
  lines.push(
    '        input.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []',
  );
  lines.push('      );');
  lines.push('    } else if (Array.isArray(input)) {');
  lines.push('      // Number array');
  lines.push('      this.data = new Uint8Array(input);');
  lines.push('    } else {');
  lines.push('      // Uint8Array');
  lines.push('      this.data = input;');
  lines.push('    }');
  lines.push('  }');
  lines.push('');
  lines.push('  toArray(): number[] {');
  lines.push('    return Array.from(this.data);');
  lines.push('  }');
  lines.push('');
  lines.push('  toUint8Array(): Uint8Array {');
  lines.push('    return this.data;');
  lines.push('  }');
  lines.push('');
  lines.push('  static fromHex(hex: string): CalimeroBytes {');
  lines.push('    return new CalimeroBytes(hex);');
  lines.push('  }');
  lines.push('');
  lines.push('  static fromArray(arr: number[]): CalimeroBytes {');
  lines.push('    return new CalimeroBytes(arr);');
  lines.push('  }');
  lines.push('');
  lines.push('  static fromUint8Array(bytes: Uint8Array): CalimeroBytes {');
  lines.push('    return new CalimeroBytes(bytes);');
  lines.push('  }');
  lines.push('}');
  lines.push('');

  // Add utility function for CalimeroBytes conversion
  lines.push('/**');
  lines.push(
    ' * Convert CalimeroBytes instances to arrays for WASM compatibility',
  );
  lines.push(' */');
  lines.push('function convertCalimeroBytesForWasm(obj: any): any {');
  lines.push('  if (obj === null || obj === undefined) {');
  lines.push('    return obj;');
  lines.push('  }');
  lines.push('');
  lines.push('  if (obj instanceof CalimeroBytes) {');
  lines.push('    return obj.toArray();');
  lines.push('  }');
  lines.push('');
  lines.push('  if (Array.isArray(obj)) {');
  lines.push('    return obj.map(item => convertCalimeroBytesForWasm(item));');
  lines.push('  }');
  lines.push('');
  lines.push('  if (typeof obj === "object") {');
  lines.push('    const result: any = {};');
  lines.push('    for (const [key, value] of Object.entries(obj)) {');
  lines.push('      result[key] = convertCalimeroBytesForWasm(value);');
  lines.push('    }');
  lines.push('    return result;');
  lines.push('  }');
  lines.push('');
  lines.push('  return obj;');
  lines.push('}');
  lines.push('');

  // Add utility function for converting WASM results back to CalimeroBytes
  lines.push('/**');
  lines.push(
    ' * Convert arrays back to CalimeroBytes instances from WASM responses',
  );
  lines.push(' */');
  lines.push('function convertWasmResultToCalimeroBytes(obj: any): any {');
  lines.push('  if (obj === null || obj === undefined) {');
  lines.push('    return obj;');
  lines.push('  }');
  lines.push('');
  lines.push(
    '  if (Array.isArray(obj) && obj.every(item => typeof item === "number")) {',
  );
  lines.push('    return new CalimeroBytes(obj);');
  lines.push('  }');
  lines.push('');
  lines.push('  if (Array.isArray(obj)) {');
  lines.push(
    '    return obj.map(item => convertWasmResultToCalimeroBytes(item));',
  );
  lines.push('  }');
  lines.push('');
  lines.push('  if (typeof obj === "object") {');
  lines.push('    const result: any = {};');
  lines.push('    for (const [key, value] of Object.entries(obj)) {');
  lines.push('      result[key] = convertWasmResultToCalimeroBytes(value);');
  lines.push('    }');
  lines.push('    return result;');
  lines.push('  }');
  lines.push('');
  lines.push('  return obj;');
  lines.push('}');
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
    lines.push(...generateMethod(method, manifest, false));
    lines.push('');
  }

  lines.push('}');

  return lines.join('\n');
}

/**
 * Check if the manifest has any hex-encoded bytes types
 * Since we removed encoding fields, this is no longer needed
 */
function hasHexBytesTypes(manifest: AbiManifest): boolean {
  return false;
}

/**
 * Check if a type is a bytes type (direct bytes or alias to bytes)
 */
function isBytesType(typeRef: AbiTypeRef, manifest: AbiManifest): boolean {
  if ('$ref' in typeRef) {
    const typeDef = manifest.types[typeRef.$ref];
    if (typeDef) {
      if (typeDef.kind === 'bytes') {
        return true;
      }
      if (
        typeDef.kind === 'alias' &&
        'kind' in typeDef.target &&
        typeDef.target.kind === 'bytes'
      ) {
        return true;
      }
      if (typeDef.kind === 'record' && 'fields' in typeDef) {
        // Check if any field in the record is a bytes type
        return typeDef.fields.some((field) =>
          isBytesType(field.type, manifest),
        );
      }
    }
  }
  if ('kind' in typeRef) {
    if (typeRef.kind === 'bytes') {
      return true;
    }
    if (typeRef.kind === 'list' && 'items' in typeRef) {
      return isBytesType(typeRef.items, manifest);
    }
    if (typeRef.kind === 'map' && 'value' in typeRef) {
      return isBytesType(typeRef.value, manifest);
    }
  }
  return false;
}

/**
 * Check if a method has any CalimeroBytes parameters
 */
function hasCalimeroBytesParams(
  method: AbiMethod,
  manifest: AbiManifest,
): boolean {
  return method.params.some((param) => isBytesType(param.type, manifest));
}

/**
 * Generate utility functions for hex string conversion
 * Since we removed encoding fields, this is no longer needed
 */
function generateHexUtilityFunctions(): string[] {
  return [];
}

/**
 * Generate a single type definition
 */
function generateTypeDefinition(
  typeName: string,
  typeDef: AbiTypeDef,
  manifest: AbiManifest,
): string[] {
  const lines: string[] = [];
  const safeName = formatIdentifier(typeName);

  if (typeDef.kind === 'record') {
    lines.push(`export interface ${safeName} {`);
    for (const field of typeDef.fields) {
      const fieldType = generateTypeRef(field.type, manifest, false);
      const nullableType = field.nullable ? `${fieldType} | null` : fieldType;
      lines.push(`  ${formatIdentifier(field.name)}: ${nullableType};`);
    }
    lines.push('}');
  } else if (typeDef.kind === 'variant') {
    // Generate discriminated union type for variants
    lines.push(`export type ${safeName}Payload =`);
    const variantLines = typeDef.variants.map((variant) => {
      const variantName = formatIdentifier(variant.name);
      if (variant.payload) {
        const payloadType = generateTypeRef(variant.payload, manifest, false);
        return `  | { name: '${variant.name}'; payload: ${payloadType} }`;
      } else {
        return `  | { name: '${variant.name}' }`;
      }
    });
    lines.push(...variantLines);

    // Generate factory object for variants
    lines.push('');
    lines.push(`export const ${safeName} = {`);
    typeDef.variants.forEach((variant) => {
      const variantName = formatIdentifier(variant.name);
      if (variant.payload) {
        const payloadType = generateTypeRef(variant.payload, manifest, false);
        lines.push(
          `  ${variantName}: (${formatIdentifier(variant.name.toLowerCase())}: ${payloadType}): ${safeName}Payload => ({ name: '${variant.name}', payload: ${formatIdentifier(variant.name.toLowerCase())} }),`,
        );
      } else {
        lines.push(
          `  ${variantName}: (): ${safeName}Payload => ({ name: '${variant.name}' }),`,
        );
      }
    });
    lines.push('} as const;');
  } else if (typeDef.kind === 'alias') {
    const targetType = generateTypeRef(typeDef.target, manifest, false);
    lines.push(`export type ${safeName} = ${targetType};`);
  }

  return lines;
}

/**
 * Generate error types for a method
 */
function generateMethodErrorTypes(
  method: AbiMethod,
  manifest: AbiManifest,
): string[] {
  const lines: string[] = [];
  const methodName = formatIdentifier(method.name);

  // Generate error code type
  const errorCodes = method
    .errors!.map((error) => `"${error.code}"`)
    .join(' | ');
  lines.push(`export type ${methodName}ErrorCode = ${errorCodes};`);

  // Generate error union type
  lines.push(
    `export type ${methodName}Error = { code: ${methodName}ErrorCode } & (`,
  );

  const errorVariants = method.errors!.map((error) => {
    if (error.payload) {
      const payloadType = generateTypeRef(error.payload, manifest);
      return `  | { code: "${error.code}"; payload: ${payloadType} }`;
    } else {
      return `  | { code: "${error.code}" }`;
    }
  });

  lines.push(...errorVariants);
  lines.push(');');

  return lines;
}

/**
 * Generate event payload type
 */
function generateEventPayloadType(
  event: AbiEvent,
  manifest: AbiManifest,
): string[] {
  const lines: string[] = [];
  const eventName = formatIdentifier(event.name);

  // Only generate payload type if event has a payload and it's not unit
  if (
    event.payload &&
    !('$ref' in event.payload) &&
    event.payload.kind !== 'unit'
  ) {
    const payloadType = generateTypeRef(event.payload, manifest);
    lines.push(`export type ${eventName}Payload = ${payloadType};`);
  }

  return lines;
}

/**
 * Generate union type for all events
 */
function generateAbiEventUnion(
  events: AbiEvent[],
  manifest: AbiManifest,
): string[] {
  const lines: string[] = [];

  lines.push('export type AbiEvent =');
  const eventLines = events.map((event) => {
    const eventName = formatIdentifier(event.name);
    if (event.payload) {
      const payloadType = generateTypeRef(event.payload, manifest);
      // Handle Action type specially to avoid circular reference
      const finalPayloadType =
        payloadType === 'Action' ? 'ActionPayload' : payloadType;
      return `  | { name: "${event.name}"; payload: ${finalPayloadType} }`;
    } else {
      return `  | { name: "${event.name}" }`;
    }
  });
  lines.push(...eventLines);
  lines.push(';');

  return lines;
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
    // Generate specific error type name
    const errorTypeName = `${method.name}Error`;
    const errorTypeRef = useTypesNamespace
      ? `Types.${errorTypeName}`
      : errorTypeName;
    lines.push(
      `   * @throws {${errorTypeRef}} May throw the following errors:`,
    );
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

    // Pass parameters to the WASM module based on count
    if (method.params.length === 0) {
      lines.push(
        `    const response = await this.app.execute(this.context, '${method.name}', {});`,
      );
    } else if (method.params.length === 1) {
      // For single parameter methods, handle special cases
      const paramName = formatIdentifier(method.params[0].name);

      if (
        '$ref' in method.params[0].type &&
        method.params[0].type.$ref === 'Action'
      ) {
        // Special handling for Action parameters - convert the Action variant
        lines.push(`    // Convert Action variant to WASM format`);
        lines.push(`    const convertedParams = { ...params } as any;`);
        lines.push(
          `    if (convertedParams.${paramName} && typeof convertedParams.${paramName} === 'object' && 'name' in convertedParams.${paramName}) {`,
        );
        lines.push(`      if ('payload' in convertedParams.${paramName}) {`);
        lines.push(
          `        convertedParams.${paramName} = { [convertedParams.${paramName}.name]: convertedParams.${paramName}.payload };`,
        );
        lines.push(`      } else {`);
        lines.push(
          `        convertedParams.${paramName} = convertedParams.${paramName}.name;`,
        );
        lines.push(`      }`);
        lines.push(`    }`);

        // Only apply CalimeroBytes conversion if needed
        if (hasCalimeroBytesParams(method, manifest)) {
          lines.push(
            `    const response = await this.app.execute(this.context, '${method.name}', convertCalimeroBytesForWasm(convertedParams));`,
          );
        } else {
          lines.push(
            `    const response = await this.app.execute(this.context, '${method.name}', convertedParams);`,
          );
        }
      } else {
        // Only apply CalimeroBytes conversion if needed
        if (hasCalimeroBytesParams(method, manifest)) {
          lines.push(
            `    const response = await this.app.execute(this.context, '${method.name}', convertCalimeroBytesForWasm(params));`,
          );
        } else {
          lines.push(
            `    const response = await this.app.execute(this.context, '${method.name}', params);`,
          );
        }
      }
    } else {
      // For multiple parameters, only apply CalimeroBytes conversion if needed
      if (hasCalimeroBytesParams(method, manifest)) {
        lines.push(
          `    const response = await this.app.execute(this.context, '${method.name}', convertCalimeroBytesForWasm(params));`,
        );
      } else {
        lines.push(
          `    const response = await this.app.execute(this.context, '${method.name}', params);`,
        );
      }
    }
  }

  // Add response handling
  lines.push(`    if (response.success) {`);
  if (method.returns) {
    // Check if return type is a bytes type that needs conversion
    if (isBytesType(method.returns, manifest)) {
      lines.push(
        `      return convertWasmResultToCalimeroBytes(response.result) as ${nullableReturnType};`,
      );
    } else {
      lines.push(`      return response.result as ${nullableReturnType};`);
    }
  } else {
    lines.push(`      return;`);
  }
  lines.push(`    } else {`);
  if (method.errors && method.errors.length > 0) {
    // Generate specific error type name
    const errorTypeName = `${method.name}Error`;
    const errorTypeRef = useTypesNamespace
      ? `Types.${errorTypeName}`
      : errorTypeName;
    lines.push(
      `      // Parse the error response to match the expected error type`,
    );
    lines.push(
      `      if (response.error && typeof response.error === 'object') {`,
    );
    lines.push(`        throw response.error as ${errorTypeRef};`);
    lines.push(`      } else {`);
    lines.push(
      `        throw new Error(response.error || 'Execution failed');`,
    );
    lines.push(`      }`);
  } else {
    lines.push(`      throw new Error(response.error || 'Execution failed');`);
  }
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

    // Check if this is a bytes type
    if (typeDef && typeDef.kind === 'bytes') {
      return 'CalimeroBytes'; // Return CalimeroBytes for bytes types
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
      return 'CalimeroBytes'; // Return CalimeroBytes for bytes types
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
