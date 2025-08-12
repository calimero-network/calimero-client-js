import { 
  AbiType, 
  RUST_TO_TS_TYPES, 
  isPrimitiveType, 
  isOptionType, 
  isVecType, 
  getOptionInnerType, 
  getVecInnerType 
} from './types';

export class TypeGenerator {
  /**
   * Converts a Rust type to TypeScript type
   */
  convertType(rustType: string): string {
    // Handle primitive types
    if (isPrimitiveType(rustType)) {
      const tsType = RUST_TO_TS_TYPES[rustType];
      if (!tsType) {
        throw new Error(`Unsupported primitive type: ${rustType}`);
      }
      return tsType;
    }

    // Handle Option<T>
    if (isOptionType(rustType)) {
      const innerType = getOptionInnerType(rustType);
      const convertedInnerType = this.convertType(innerType);
      return `${convertedInnerType} | null`;
    }

    // Handle Vec<T>
    if (isVecType(rustType)) {
      const innerType = getVecInnerType(rustType);
      const convertedInnerType = this.convertType(innerType);
      return `${convertedInnerType}[]`;
    }

    // For now, unsupported types return unknown
    return 'unknown';
  }

  /**
   * Generates TypeScript interface for function parameters
   */
  generateParamsInterface(_functionName: string, params: Record<string, string>): string {
    if (Object.keys(params).length === 0) {
      return 'Record<string, never>';
    }

    const paramEntries = Object.entries(params).map(([name, type]) => {
      const tsType = this.convertType(type);
      return `  ${name}: ${tsType};`;
    });

    return `{\n${paramEntries.join('\n')}\n}`;
  }

  /**
   * Generates TypeScript type for function return value
   */
  generateReturnType(returns: AbiType | null): string {
    if (returns === null) {
      return 'void';
    }

    if (typeof returns === 'string') {
      return this.convertType(returns);
    }

    if (Array.isArray(returns)) {
      // Handle Vec<T> case
      if (returns.length === 1) {
        return `${this.convertType(returns[0] as string)}[]`;
      }
      return 'unknown[]';
    }

    if (typeof returns === 'object') {
      // Handle object return type
      const entries = Object.entries(returns).map(([key, value]) => {
        let tsType: string;
        if (typeof value === 'string') {
          tsType = this.convertType(value);
        } else if (Array.isArray(value)) {
          tsType = `${this.convertType(value[0] as string)}[]`;
        } else {
          tsType = 'unknown';
        }
        return `  ${key}: ${tsType};`;
      });

      return `{\n${entries.join('\n')}\n}`;
    }

    return 'unknown';
  }

  /**
   * Generates error code union type
   */
  generateErrorCodeType(_functionName: string, errors: string[]): string {
    if (errors.length === 0) {
      return 'never';
    }

    const errorCodes = errors.map(error => `'${error}'`).join(' | ');
    return errorCodes;
  }

  /**
   * Generates the complete types.ts content
   */
  generateTypesFile(abi: { schema: string; functions: Record<string, { params: Record<string, string>; returns: AbiType | null; errors: string[] }> }): string {
    const imports = `// Generated from ABI schema ${abi.schema}
// This file contains TypeScript types for the ABI functions

`;

    const errorTypes = Object.entries(abi.functions).map(([functionName, func]) => {
      const errorCodeType = this.generateErrorCodeType(functionName, func.errors);
      return `export type ${this.toPascalCase(functionName)}ErrorCode = ${errorCodeType};`;
    });

    const paramTypes = Object.entries(abi.functions).map(([functionName, func]) => {
      const paramsInterface = this.generateParamsInterface(functionName, func.params);
      return `export type ${this.toPascalCase(functionName)}Params = ${paramsInterface};`;
    });

    const returnTypes = Object.entries(abi.functions).map(([functionName, func]) => {
      const returnType = this.generateReturnType(func.returns);
      return `export type ${this.toPascalCase(functionName)}Return = ${returnType};`;
    });

    const errorInterface = `
export interface CalimeroAbiError {
  code: string;
  data?: unknown;
}
`;

    return imports + 
           errorTypes.join('\n') + '\n\n' +
           paramTypes.join('\n') + '\n\n' +
           returnTypes.join('\n') + '\n' +
           errorInterface;
  }

  /**
   * Converts snake_case to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
} 