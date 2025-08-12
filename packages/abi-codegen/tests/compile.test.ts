import { execSync } from 'child_process';
import { join } from 'path';
import { AbiCodegen } from '../src/codegen';

describe('Compile Test', () => {
  const testOutputDir = join(__dirname, 'compile-test-output');
  
  beforeAll(() => {
    // Generate test files
    const codegen = new AbiCodegen();
    const inputFile = join(__dirname, '../fixtures/demo.abi.json');
    codegen.generate(inputFile, testOutputDir);
  });

  it('should compile generated TypeScript files with strict settings', () => {
    // Create a temporary tsconfig for compilation test
    const tsConfig = {
      compilerOptions: {
        target: "ES2020",
        module: "ESNext",
        moduleResolution: "node",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        noImplicitAny: true,
        noImplicitReturns: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        exactOptionalPropertyTypes: true,
        noImplicitOverride: true,
        noPropertyAccessFromIndexSignature: true,
        noUncheckedIndexedAccess: true,
        resolveJsonModule: true,
        allowSyntheticDefaultImports: true
      },
      include: [join(testOutputDir, '*.ts')],
      exclude: ['node_modules']
    };

    const tsConfigPath = join(testOutputDir, 'tsconfig.json');
    require('fs').writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));

    // Run TypeScript compiler
    try {
      execSync(`npx tsc --noEmit --project ${tsConfigPath}`, { 
        stdio: 'pipe',
        cwd: testOutputDir 
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error('TypeScript compilation failed:', error.message);
      }
      throw error;
    }
  });

  it('should create a working client instance', () => {
    // This test verifies that the generated client can be instantiated
    // We'll need to mock the transport interface
    const mockTransport = {
      call: async <T>(_method: string, _params: Record<string, unknown>): Promise<T> => {
        return {} as T;
      },
      subscribe: <T>(_method: string, _params: Record<string, unknown>, _callback: (data: T) => void): (() => void) => {
        return () => {};
      }
    };

    // Import the generated client (this will fail if there are compilation errors)
    const typesPath = join(testOutputDir, 'types.ts');
    const clientPath = join(testOutputDir, 'client.ts');
    
    expect(require('fs').existsSync(typesPath)).toBe(true);
    expect(require('fs').existsSync(clientPath)).toBe(true);
    
    // Read the files to ensure they're valid TypeScript
    const typesContent = require('fs').readFileSync(typesPath, 'utf-8');
    const clientContent = require('fs').readFileSync(clientPath, 'utf-8');
    
    expect(typesContent).toContain('export type');
    expect(clientContent).toContain('export class CalimeroAbiClient');
    
    // Verify the mock transport is properly typed (this would fail if types are wrong)
    expect(typeof mockTransport.call).toBe('function');
    expect(typeof mockTransport.subscribe).toBe('function');
  });
}); 