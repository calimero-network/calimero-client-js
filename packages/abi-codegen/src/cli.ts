#!/usr/bin/env node

import { Command } from 'commander';
import { AbiCodegen } from './codegen';

const program = new Command();

program
  .name('calimero-abi-codegen')
  .description('Generate TypeScript types and client from Calimero ABI schema')
  .version('0.1.0')
  .requiredOption('-i, --input <file>', 'Input ABI JSON file')
  .requiredOption('-o, --output <dir>', 'Output directory for generated files')
  .action(async (options: { input: string; output: string }) => {
    try {
      const codegen = new AbiCodegen();
      codegen.generate(options.input, options.output);
    } catch (error) {
      console.error(
        'Error:',
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  });

program.parse();
