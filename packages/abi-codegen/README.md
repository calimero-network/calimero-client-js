# @calimero/abi-codegen

TypeScript code generator for Calimero ABI schemas. This package generates strict TypeScript types and a typed client wrapper from ABI JSON files.

## Installation

```bash
npm install @calimero/abi-codegen
```

## CLI Usage

```bash
calimero-abi-codegen -i <abi.json> -o <outDir>
```

### Options

- `-i, --input <file>`: Input ABI JSON file (required)
- `-o, --output <dir>`: Output directory for generated files (required)

### Example

```bash
calimero-abi-codegen -i ./my-contract.abi.json -o ./generated
```

This will generate:

- `./generated/types.ts` - TypeScript interfaces and types
- `./generated/client.ts` - Typed client wrapper

## Supported Types

The codegen supports the following Rust to TypeScript type mappings:

| Rust Type      | TypeScript Type | Notes                           |
| -------------- | --------------- | ------------------------------- |
| `bool`         | `boolean`       |                                 |
| `String`       | `string`        |                                 |
| `u8` - `u64`   | `number`        | Unsigned integers up to 64 bits |
| `i8` - `i64`   | `number`        | Signed integers up to 64 bits   |
| `u128`, `i128` | `string`        | Large integers as strings       |
| `Vec<u8>`      | `string`        | Hex string with 0x prefix       |
| `Option<T>`    | `T \| null`     | Optional values                 |
| `Vec<T>`       | `T[]`           | Arrays (where T is a primitive) |

## ABI Schema Format

The ABI JSON file should follow this schema:

```json
{
  "schema": "0.1.1",
  "functions": {
    "function_name": {
      "params": {
        "param_name": "param_type"
      },
      "returns": "return_type" | { "field": "type" } | null,
      "errors": ["ERROR_CODE_1", "ERROR_CODE_2"]
    }
  }
}
```

### Example ABI

```json
{
  "schema": "0.1.1",
  "functions": {
    "get_user_info": {
      "params": {
        "user_id": "u64",
        "include_private": "bool"
      },
      "returns": {
        "name": "String",
        "email": "String",
        "age": "u8",
        "balance": "u128"
      },
      "errors": ["USER_NOT_FOUND", "ACCESS_DENIED"]
    },
    "create_user": {
      "params": {
        "name": "String",
        "email": "String"
      },
      "returns": {
        "user_id": "u64"
      },
      "errors": ["EMAIL_ALREADY_EXISTS"]
    }
  }
}
```

## Generated Output

### types.ts

```typescript
// Generated from ABI schema 0.1.1
// This file contains TypeScript types for the ABI functions

export type GetUserInfoErrorCode = 'USER_NOT_FOUND' | 'ACCESS_DENIED';

export type CreateUserErrorCode = 'EMAIL_ALREADY_EXISTS';

export type GetUserInfoParams = {
  userId: number;
  includePrivate: boolean;
};

export type CreateUserParams = {
  name: string;
  email: string;
};

export type GetUserInfoReturn = {
  name: string;
  email: string;
  age: number;
  balance: string;
};

export type CreateUserReturn = {
  userId: number;
};

export interface CalimeroAbiError {
  code: string;
  data?: unknown;
}
```

### client.ts

```typescript
// Generated from ABI schema 0.1.1
// This file contains a typed client wrapper for the ABI functions

import type { CalimeroTransport, CalimeroAbiError } from './types.js';

export class CalimeroAbiClient {
  constructor(private transport: CalimeroTransport) {}

  async getUserInfo(params: GetUserInfoParams): Promise<GetUserInfoReturn> {
    try {
      const result = await this.transport.call<GetUserInfoReturn>(
        'get_user_info',
        params,
      );
      return result;
    } catch (error) {
      if (
        this.isCalimeroError(error) &&
        this.isKnownError(error.code, 'get_user_info')
      ) {
        throw {
          code: error.code as GetUserInfoErrorCode,
          data: error.data,
        } as CalimeroAbiError;
      }
      throw error;
    }
  }

  async createUser(params: CreateUserParams): Promise<CreateUserReturn> {
    try {
      const result = await this.transport.call<CreateUserReturn>(
        'create_user',
        params,
      );
      return result;
    } catch (error) {
      if (
        this.isCalimeroError(error) &&
        this.isKnownError(error.code, 'create_user')
      ) {
        throw {
          code: error.code as CreateUserErrorCode,
          data: error.data,
        } as CalimeroAbiError;
      }
      throw error;
    }
  }

  private isCalimeroError(error: unknown): error is CalimeroAbiError {
    return typeof error === 'object' && error !== null && 'code' in error;
  }

  private isKnownError(code: string, functionName: string): boolean {
    const knownErrors = {
      get_user_info: ['USER_NOT_FOUND', 'ACCESS_DENIED'],
      create_user: ['EMAIL_ALREADY_EXISTS'],
    };
    return knownErrors[functionName]?.includes(code) ?? false;
  }
}
```

## Usage with Calimero Client

```typescript
import { CalimeroAbiClient } from './generated/client.js';
import type { CalimeroTransport } from './generated/types.js';

// Implement your transport
class MyTransport implements CalimeroTransport {
  async call<T>(method: string, params: Record<string, unknown>): Promise<T> {
    // Your implementation here
    return {} as T;
  }

  subscribe<T>(
    method: string,
    params: Record<string, unknown>,
    callback: (data: T) => void,
  ): () => void {
    // Your implementation here
    return () => {}; // unsubscribe function
  }
}

// Use the generated client
const transport = new MyTransport();
const client = new CalimeroAbiClient(transport);

// Type-safe function calls
const userInfo = await client.getUserInfo({
  userId: 123,
  includePrivate: false,
});

// Error handling with typed error codes
try {
  await client.createUser({
    name: 'John Doe',
    email: 'john@example.com',
  });
} catch (error) {
  if (error.code === 'EMAIL_ALREADY_EXISTS') {
    console.log('User already exists');
  }
}
```

## Error Handling

The generated client automatically handles known error codes from the ABI. When a known error occurs, it throws a `CalimeroAbiError` with the specific error code and optional data.

```typescript
try {
  const result = await client.someFunction(params);
} catch (error) {
  if (error.code === 'KNOWN_ERROR_CODE') {
    // Handle specific error
  } else {
    // Handle unknown error
  }
}
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Formatting

```bash
npm run prettier
npm run prettier:check
```

## License

MIT
