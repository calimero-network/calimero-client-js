import {
  AbiManifest,
  AbiTypeRef,
  AbiTypeDef,
  AbiMethod,
  AbiEvent,
} from '../model.js';
import { formatIdentifier, generateFileBanner } from './emit.js';

/**
 * Generate TypeScript types from a WASM-ABI v1 manifest
 * @param manifest - The parsed ABI manifest
 * @returns Generated TypeScript types as a string
 */
export function generateTypes(manifest: AbiManifest): string {
  const lines: string[] = [];

  // Add file banner
  lines.push(generateFileBanner().trim());
  lines.push('');

  // Import CalimeroBytes from the client file
  lines.push('import { CalimeroBytes } from "./AbiConformanceClient.js";');
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
      lines.push(...generateMethodErrorTypes(method));
      lines.push('');
    }
  }

  // Generate event payload types
  for (const event of manifest.events) {
    lines.push(...generateEventPayloadType(event));
    lines.push('');
  }

  // Generate union type for all events
  if (manifest.events.length > 0) {
    lines.push(...generateAbiEventUnion(manifest.events));
    lines.push('');
  }

  return lines.join('\n');
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
      const fieldType = generateTypeRef(field.type, manifest, true);
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
        const payloadType = generateTypeRef(variant.payload, manifest, true);
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
        const payloadType = generateTypeRef(variant.payload, manifest, true);
        lines.push(
          `  ${variantName}: (${formatIdentifier(variant.name.toLowerCase())}: ${payloadType}): ${safeName}Payload => ({ name: '${variant.name}', payload: ${formatIdentifier(variant.name.toLowerCase())} }),`,
        );
      } else {
        lines.push(
          `  ${variantName}: (): ${safeName}Payload => ({ name: '${variant.name}' }),`,
        );
      }
    });
    lines.push(`} as const;`);
  } else if (typeDef.kind === 'bytes') {
    if ('size' in typeDef) {
      lines.push(
        `/** Fixed-length bytes (size: ${typeDef.size}). Represented as Uint8Array at runtime. */`,
      );
      lines.push(`export type ${safeName} = Uint8Array;`);
    } else {
      lines.push(`export type ${safeName} = Uint8Array;`);
    }
  } else if (typeDef.kind === 'alias') {
    const targetType = generateTypeRef(typeDef.target, manifest, true);
    lines.push(`export type ${safeName} = ${targetType};`);
  }

  return lines;
}

/**
 * Generate TypeScript type from an ABI type reference
 */
function generateTypeRef(
  typeRef: AbiTypeRef,
  manifest: AbiManifest,
  forUserApi: boolean = false,
  forVariantParam: boolean = false,
): string {
  if ('$ref' in typeRef) {
    const typeName = formatIdentifier(typeRef.$ref);
    // For variant types, return the Payload type when used as parameters
    if (forVariantParam && manifest.types[typeRef.$ref]?.kind === 'variant') {
      return `${typeName}Payload`;
    }
    return typeName;
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
      return 'CalimeroBytes';
    case 'list':
      const itemType = generateTypeRef(typeRef.items, manifest, forUserApi);
      return `${itemType}[]`;
    case 'map':
      const keyType = generateTypeRef(typeRef.key, manifest, forUserApi);
      const valueType = generateTypeRef(typeRef.value, manifest, forUserApi);
      return `Record<${keyType}, ${valueType}>`;
    case 'record':
      // Inline record type
      const fields = typeRef.fields.map((field) => {
        const fieldType = generateTypeRef(field.type, manifest, forUserApi);
        const nullableType = field.nullable ? `${fieldType} | null` : fieldType;
        return `${formatIdentifier(field.name)}: ${nullableType}`;
      });
      return `{ ${fields.join('; ')} }`;
    default:
      throw new Error(`Unsupported type kind: ${(typeRef as any).kind}`);
  }
}

/**
 * Generate error types for a method
 */
function generateMethodErrorTypes(method: AbiMethod): string[] {
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
      const payloadType = generateTypeRef(error.payload, method as any);
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
function generateEventPayloadType(event: AbiEvent): string[] {
  const lines: string[] = [];
  const eventName = formatIdentifier(event.name);

  // Only generate payload type if event has a payload and it's not unit
  if (
    event.payload &&
    !('$ref' in event.payload) &&
    event.payload.kind !== 'unit'
  ) {
    const payloadType = generateTypeRef(event.payload, event as any);
    lines.push(`export type ${eventName}Payload = ${payloadType};`);
  }
  // For unit events or events without payload, omit the payload type alias

  return lines;
}

/**
 * Generate union type for all events
 * Note: Events with unit payload or no payload omit the payload property entirely
 */
function generateAbiEventUnion(events: readonly AbiEvent[]): string[] {
  const lines: string[] = [];

  lines.push('export type AbiEvent =');

  const eventVariants = events.map((event) => {
    const eventName = formatIdentifier(event.name);

    // Check if event has a payload and it's not unit
    const hasPayload =
      event.payload &&
      !('$ref' in event.payload) &&
      event.payload.kind !== 'unit';

    if (hasPayload) {
      const payloadType = generateTypeRef(event.payload!, event as any);
      return `  | { name: "${event.name}"; payload: ${payloadType} }`;
    } else {
      // For unit events or events without payload, omit payload property
      return `  | { name: "${event.name}" }`;
    }
  });

  lines.push(...eventVariants);
  lines.push(';');

  return lines;
}
