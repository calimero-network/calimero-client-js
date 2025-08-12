import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AbiSchema } from './types';
import { TypeGenerator } from './type-generator';
import { ClientGenerator } from './client-generator';

export class AbiCodegen {
  private typeGenerator: TypeGenerator;
  private clientGenerator: ClientGenerator;

  constructor() {
    this.typeGenerator = new TypeGenerator();
    this.clientGenerator = new ClientGenerator();
  }

  /**
   * Loads and validates an ABI schema from a JSON file
   */
  loadAbiSchema(filePath: string): AbiSchema {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const abi = JSON.parse(content) as AbiSchema;
      
      // Validate schema
      if (!abi.schema) {
        throw new Error('ABI schema must have a "schema" field');
      }
      
      if (!abi.functions || typeof abi.functions !== 'object') {
        throw new Error('ABI schema must have a "functions" field');
      }

      // Validate each function
      for (const [functionName, func] of Object.entries(abi.functions)) {
        if (!func.params || typeof func.params !== 'object') {
          throw new Error(`Function "${functionName}" must have a "params" field`);
        }
        
        if (!Array.isArray(func.errors)) {
          throw new Error(`Function "${functionName}" must have an "errors" array`);
        }
        
        // Note: returns can be null, so we don't validate it
      }

      return abi;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in ABI file: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Generates TypeScript files from an ABI schema
   */
  generateFiles(abi: AbiSchema, outputDir: string): void {
    // Ensure output directory exists
    mkdirSync(outputDir, { recursive: true });

    // Generate types.ts
    const typesContent = this.typeGenerator.generateTypesFile(abi);
    const typesPath = join(outputDir, 'types.ts');
    writeFileSync(typesPath, typesContent, 'utf-8');

    // Generate client.ts
    const clientContent = this.clientGenerator.generateClientFile(abi);
    const clientPath = join(outputDir, 'client.ts');
    writeFileSync(clientPath, clientContent, 'utf-8');

    console.log(`Generated files in ${outputDir}:`);
    console.log(`  - types.ts`);
    console.log(`  - client.ts`);
  }

  /**
   * Main entry point for code generation
   */
  generate(inputFile: string, outputDir: string): void {
    console.log(`Loading ABI schema from: ${inputFile}`);
    const abi = this.loadAbiSchema(inputFile);
    
    console.log(`Schema version: ${abi.schema}`);
    console.log(`Functions found: ${Object.keys(abi.functions).length}`);
    
    console.log(`Generating TypeScript files to: ${outputDir}`);
    this.generateFiles(abi, outputDir);
    
    console.log('Code generation completed successfully!');
  }
} 