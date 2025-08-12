import { AbiType } from './types';

export class ClientGenerator {
  /**
   * Generates the complete client.ts content
   */
  generateClientFile(abi: {
    schema: string;
    functions: Record<
      string,
      {
        params: Record<string, string>;
        returns: AbiType | null;
        errors: string[];
      }
    >;
  }): string {
    const imports = `// Generated from ABI schema ${abi.schema}
// This file contains a typed client wrapper for the ABI functions

import type { CalimeroAbiError } from './types';
import type { ${Object.entries(abi.functions)
      .map(([functionName, _func]) => {
        const pascalName = this.toPascalCase(functionName);
        return `${pascalName}Params, ${pascalName}Return, ${pascalName}ErrorCode`;
      })
      .join(', ')} } from './types';

// Transport interface for the client wrapper
export interface CalimeroTransport {
  call<T>(method: string, params: Record<string, unknown>): Promise<T>;
  subscribe<T>(method: string, params: Record<string, unknown>, callback: (data: T) => void): () => void;
}
`;

    const clientClass = `
export class CalimeroAbiClient {
  constructor(private transport: CalimeroTransport) {}

${Object.entries(abi.functions)
  .map(([functionName, func]) => {
    const methodName = this.toCamelCase(functionName);
    const paramsType = this.toPascalCase(functionName) + 'Params';
    const returnType = this.toPascalCase(functionName) + 'Return';
    const errorCodeType = this.toPascalCase(functionName) + 'ErrorCode';

    const returnPromiseType =
      func.returns === null ? 'Promise<void>' : `Promise<${returnType}>`;

    return `  async ${methodName}(params: ${paramsType}): ${returnPromiseType} {
    try {
      const result = await this.transport.call<${returnType}>('${functionName}', params);
      return result;
    } catch (error) {
      if (this.isCalimeroError(error) && this.isKnownError(error.code, '${functionName}')) {
        throw {
          code: error.code as ${errorCodeType},
          data: error.data
        } as CalimeroAbiError;
      }
      throw error;
    }
  }`;
  })
  .join('\n\n')}

  private isCalimeroError(error: unknown): error is CalimeroAbiError {
    return typeof error === 'object' && error !== null && 'code' in error;
  }

  private isKnownError(code: string, functionName: string): boolean {
    const knownErrors: Record<string, string[]> = ${JSON.stringify(
      Object.fromEntries(
        Object.entries(abi.functions).map(([name, func]) => [
          name,
          func.errors,
        ]),
      ),
    )};
    return knownErrors[functionName]?.includes(code) ?? false;
  }
}
`;

    return imports + clientClass;
  }

  /**
   * Converts snake_case to camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .split('_')
      .map((word, index) => {
        if (index === 0) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join('');
  }

  /**
   * Converts snake_case to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
}
