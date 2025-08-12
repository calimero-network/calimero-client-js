import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { AbiCodegen } from '../src/codegen';

describe('AbiCodegen', () => {
  const testOutputDir = join(__dirname, 'test-output');
  
  beforeEach(() => {
    // Clean up test output directory
    try {
      rmSync(testOutputDir, { recursive: true, force: true });
    } catch {
      // Directory doesn't exist, that's fine
    }
    mkdirSync(testOutputDir, { recursive: true });
  });

  afterAll(() => {
    // Clean up test output directory
    try {
      rmSync(testOutputDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should generate types and client from demo ABI', () => {
    const codegen = new AbiCodegen();
    const inputFile = join(__dirname, '../fixtures/demo.abi.json');
    
    codegen.generate(inputFile, testOutputDir);
    
    // Verify files were generated
    const typesPath = join(testOutputDir, 'types.ts');
    const clientPath = join(testOutputDir, 'client.ts');
    
    expect(readFileSync(typesPath, 'utf-8')).toMatchSnapshot('types.ts');
    expect(readFileSync(clientPath, 'utf-8')).toMatchSnapshot('client.ts');
  });

  it('should handle empty functions object', () => {
    const codegen = new AbiCodegen();
    const emptyAbi = {
      schema: '0.1.1',
      functions: {}
    };
    
    const tempFile = join(testOutputDir, 'empty.abi.json');
    writeFileSync(tempFile, JSON.stringify(emptyAbi));
    
    codegen.generate(tempFile, testOutputDir);
    
    const typesPath = join(testOutputDir, 'types.ts');
    const clientPath = join(testOutputDir, 'client.ts');
    
    expect(readFileSync(typesPath, 'utf-8')).toMatchSnapshot('empty-types.ts');
    expect(readFileSync(clientPath, 'utf-8')).toMatchSnapshot('empty-client.ts');
  });

  it('should throw error for invalid JSON', () => {
    const codegen = new AbiCodegen();
    const invalidFile = join(testOutputDir, 'invalid.json');
    writeFileSync(invalidFile, '{ invalid json');
    
    expect(() => {
      codegen.generate(invalidFile, testOutputDir);
    }).toThrow('Invalid JSON in ABI file');
  });

  it('should throw error for missing schema field', () => {
    const codegen = new AbiCodegen();
    const invalidAbi = {
      functions: {}
    };
    
    const tempFile = join(testOutputDir, 'no-schema.abi.json');
    writeFileSync(tempFile, JSON.stringify(invalidAbi));
    
    expect(() => {
      codegen.generate(tempFile, testOutputDir);
    }).toThrow('ABI schema must have a "schema" field');
  });

  it('should throw error for missing functions field', () => {
    const codegen = new AbiCodegen();
    const invalidAbi = {
      schema: '0.1.1'
    };
    
    const tempFile = join(testOutputDir, 'no-functions.abi.json');
    writeFileSync(tempFile, JSON.stringify(invalidAbi));
    
    expect(() => {
      codegen.generate(tempFile, testOutputDir);
    }).toThrow('ABI schema must have a "functions" field');
  });
}); 