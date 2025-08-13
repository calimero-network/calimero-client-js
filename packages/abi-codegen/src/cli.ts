#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { loadAbiManifestFromFile } from './parse.js';
import { generateTypes } from './generate/types.js';
import { generateClient } from './generate/client.js';

const getArgs = () => {
  const args: { [key: string]: string } = {};
  const flags: string[] = [];

  process.argv.slice(2).forEach((arg, index) => {
    if (arg.startsWith('--')) {
      if (arg.includes('=')) {
        const [key, value] = arg.split('=');
        args[key.substring(2)] = value;
      } else {
        const flagName = arg.substring(2);
        // Check if next argument is a value (not a flag)
        const nextArg = process.argv[index + 3]; // +3 because we're in slice(2) and need to account for index
        if (nextArg && !nextArg.startsWith('-') && !nextArg.startsWith('--')) {
          args[flagName] = nextArg;
        } else {
          flags.push(flagName);
        }
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

function showHelp() {
  console.log('Usage: calimero-abi-codegen [options]');
  console.log('');
  console.log('Options:');
  console.log('  -i, --input <file>        Input ABI JSON file (default: abi.json)');
  console.log('  -o, --outDir <dir>        Output directory for generated files (default: src)');
  console.log('  --client-name <Name>      Custom client class name (default: Client)');
  console.log('  --validate                Validate ABI manifest only (no code generation)');
  console.log('  -h, --help                Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  calimero-abi-codegen -i abi.json -o src');
  console.log('  calimero-abi-codegen --validate -i abi.json');
  console.log('  calimero-abi-codegen -i abi.json -o src --client-name MyClient');
}

function main() {
  const { args, flags } = getArgs();

  // Show help if requested
  if (flags.includes('help') || flags.includes('h')) {
    showHelp();
    return;
  }

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
      process.exitCode = 1;
    }
  } else {
    // Code generation (default behavior)
    const inputPath = args.input || args.i || 'abi.json';
    const outputPath = args.output || args.o || 'src';
    const clientName = args['client-name'] || 'Client';

    const inputFilePath = path.resolve(process.cwd(), inputPath);
    const outputDir = path.resolve(process.cwd(), outputPath);

    if (!fs.existsSync(inputFilePath)) {
      console.error(`❌ Error: ABI file not found at ${inputFilePath}`);
      process.exitCode = 1;
      return;
    }

    try {
      // Load and validate the manifest
      const manifest = loadAbiManifestFromFile(inputFilePath);

      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate types.ts
      const typesContent = generateTypes(manifest);
      const typesPath = path.join(outputDir, 'types.ts');
      fs.writeFileSync(typesPath, typesContent);

      // Generate client.ts
      const clientContent = generateClient(manifest, clientName);
      const clientPath = path.join(outputDir, 'client.ts');
      fs.writeFileSync(clientPath, clientContent);

      // Print summary
      console.log(`✅ Code generation completed successfully!`);
      console.log(`📊 Summary:`);
      console.log(`   Methods: ${manifest.methods.length}`);
      console.log(`   Events: ${manifest.events.length}`);
      console.log(`   Types: ${Object.keys(manifest.types).length}`);
      console.log(`📁 Generated files:`);
      console.log(`   ${typesPath}`);
      console.log(`   ${clientPath}`);
    } catch (error) {
      console.error(
        `❌ Code generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exitCode = 1;
    }
  }
}

main();
