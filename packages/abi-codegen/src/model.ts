// TypeScript model for WASM-ABI v1 manifest
// Corresponds 1:1 to the JSON schema

export interface AbiManifest {
  schema_version: 'wasm-abi/1';
  types: Record<string, AbiTypeDef>;
  methods: AbiMethod[];
  events: AbiEvent[];
}

// Type references can be either inline types or references to named types
export type AbiTypeRef =
  | { $ref: string }
  | AbiScalar
  | AbiBytesVar
  | AbiBytesFixed
  | AbiList
  | AbiMap
  | AbiRecord;

// Scalar types
export interface AbiScalar {
  kind:
    | 'bool'
    | 'i32'
    | 'i64'
    | 'u32'
    | 'u64'
    | 'f32'
    | 'f64'
    | 'string'
    | 'unit';
}

// Bytes types - discriminated union for fixed vs variable
export interface AbiBytesVar {
  kind: 'bytes';
  encoding: 'hex';
  // No size property for variable bytes
}

export interface AbiBytesFixed {
  kind: 'bytes';
  size: number; // minimum: 1
  encoding: 'hex';
}

// Collection types
export interface AbiList {
  kind: 'list';
  items: AbiTypeRef;
}

export interface AbiMap {
  kind: 'map';
  key: AbiTypeRef;
  value: AbiTypeRef;
}

export interface AbiRecord {
  kind: 'record';
  fields: AbiField[];
}

// Field definition
export interface AbiField {
  name: string;
  type: AbiTypeRef;
  nullable?: boolean;
}

// Variant definition
export interface AbiVariant {
  name: string;
  code?: string;
  payload?: AbiTypeRef;
}

// Alias type definition
export interface AbiAlias {
  kind: 'alias';
  target: AbiTypeRef;
}

// Type definitions (what goes in the types object)
export type AbiTypeDef =
  | AbiRecord
  | AbiVariantDef
  | AbiBytesVar
  | AbiBytesFixed
  | AbiAlias;

export interface AbiVariantDef {
  kind: 'variant';
  variants: AbiVariant[];
}

// Method definition
export interface AbiMethod {
  name: string;
  params: AbiParameter[];
  returns?: AbiTypeRef;
  returns_nullable?: boolean;
  errors?: AbiError[];
}

// Parameter definition
export interface AbiParameter {
  name: string;
  type: AbiTypeRef;
  nullable?: boolean;
}

// Error definition
export interface AbiError {
  code: string;
  payload?: AbiTypeRef;
}

// Event definition
export interface AbiEvent {
  name: string;
  payload?: AbiTypeRef;
}
