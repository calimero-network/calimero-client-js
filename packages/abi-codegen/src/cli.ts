#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { loadAbiManifestFromFile } from './parse.js';

const getArgs = () => {
  const args: { [key: string]: string } = {};
  const flags: string[] = [];

  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--')) {
      if (arg.includes('=')) {
        const [key, value] = arg.split('=');
        args[key.substring(2)] = value;
      } else {
        flags.push(arg.substring(2));
      }
    } else if (arg.startsWith('-')) {
      // Handle short flags like -i, -o
      const flag = arg.substring(1);
      if (flag === 'i' || flag === 'input') {
        // Next argument is the input file
        const inputIndex = process.argv.indexOf(arg) + 1;
        if (inputIndex < process.argv.length) {
          args.input = process.argv[inputIndex];
        }
      } else if (flag === 'o' || flag === 'output') {
        // Next argument is the output file
        const outputIndex = process.argv.indexOf(arg) + 1;
        if (outputIndex < process.argv.length) {
          args.output = process.argv[outputIndex];
        }
      }
    }
  });

  return { args, flags };
};

const { args, flags } = getArgs();

// Check if --validate flag is present
if (flags.includes('validate')) {
  const inputPath = args.input || args.i || 'abi.json';
  const inputFilePath = path.resolve(process.cwd(), inputPath);

  try {
    const manifest = loadAbiManifestFromFile(inputFilePath);

    // Print summary
    console.log(`✅ ABI manifest validated successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   Methods: ${manifest.methods.length}`);
    console.log(`   Events: ${manifest.events.length}`);
    console.log(`   Types: ${Object.keys(manifest.types).length}`);

    process.exit(0);
  } catch (error) {
    console.error(
      `❌ Validation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
} else {
  // Original codegen functionality (for CS2)
  const abiPath = args.input || args.i || args.abi || 'abi.json';
  // const outputPath = args.output || args.o || args.out || 'src/generated-client.ts'; // Will be used in CS2

  const abiFilePath = path.resolve(process.cwd(), abiPath);
  // const outputFilePath = path.resolve(process.cwd(), outputPath); // Will be used in CS2

  if (!fs.existsSync(abiFilePath)) {
    console.error(`Error: ABI file not found at ${abiFilePath}`);
    process.exit(1);
  }

  try {
    // For now, just load and validate the manifest
    const manifest = loadAbiManifestFromFile(abiFilePath);
    console.log(`✅ ABI manifest loaded successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   Methods: ${manifest.methods.length}`);
    console.log(`   Events: ${manifest.events.length}`);
    console.log(`   Types: ${Object.keys(manifest.types).length}`);
    console.log(
      `\n⚠️  Code generation is not yet implemented in this version.`,
    );
    console.log(`   Use --validate to check your ABI manifest.`);

    process.exit(0);
  } catch (error) {
    console.error(
      `❌ Failed to load ABI manifest: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}
