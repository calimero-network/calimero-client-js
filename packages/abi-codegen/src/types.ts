// ABI Schema types
export interface AbiSchema {
  schema: string;
  functions: Record<string, AbiFunction>;
}

export interface AbiFunction {
  params: Record<string, string>;
  returns: AbiType | null;
  errors: string[];
}

export type AbiType = 
  | string // Primitive types: "bool", "u8", "i8", etc.
  | Record<string, unknown> // Object types
  | unknown[] // Array types (for Vec<T>)
  | null; // For Option<T> and null returns

// Transport interface for the client wrapper
export interface CalimeroTransport {
  call<T>(method: string, params: Record<string, unknown>): Promise<T>;
  subscribe<T>(method: string, params: Record<string, unknown>, callback: (data: T) => void): () => void;
}

// Error types
export interface CalimeroAbiError {
  code: string;
  data?: unknown;
}

// Type mapping from Rust to TypeScript
export const RUST_TO_TS_TYPES: Record<string, string> = {
  // Primitives
  'bool': 'boolean',
  'String': 'string',
  
  // Unsigned integers
  'u8': 'number',
  'u16': 'number', 
  'u32': 'number',
  'u64': 'number',
  'u128': 'string',
  
  // Signed integers
  'i8': 'number',
  'i16': 'number',
  'i32': 'number', 
  'i64': 'number',
  'i128': 'string',
  
  // Special types
  'Vec<u8>': 'string', // hex string with 0x prefix
};

// Type guards and utilities
export function isPrimitiveType(type: string): boolean {
  return type in RUST_TO_TS_TYPES;
}

export function isOptionType(type: string): boolean {
  return type.startsWith('Option<') && type.endsWith('>');
}

export function isVecType(type: string): boolean {
  return type.startsWith('Vec<') && type.endsWith('>');
}

export function getOptionInnerType(type: string): string {
  if (!isOptionType(type)) {
    throw new Error(`Not an Option type: ${type}`);
  }
  return type.slice(7, -1); // Remove "Option<" and ">"
}

export function getVecInnerType(type: string): string {
  if (!isVecType(type)) {
    throw new Error(`Not a Vec type: ${type}`);
  }
  return type.slice(4, -1); // Remove "Vec<" and ">"
} 