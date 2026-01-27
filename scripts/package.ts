/**
 * Package Script - Creates distributable zip file
 * 
 * This script creates a jira-structure.zip file containing:
 * - dist/ (built React app)
 * - dist-server/ (built server)
 * - data/ (sample data)
 * - START-HERE scripts
 * - README.md
 * - package.json and package-lock.json
 * 
 * Usage: npm run package
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// Configuration
const OUTPUT_FILE = 'jira-structure.zip';
const OUTPUT_PATH = path.join(PROJECT_ROOT, OUTPUT_FILE);

// Files and folders to include
const INCLUDE_FILES = [
  'dist',
  'dist-server',
  'data',
  'START-HERE.command',
  'START-HERE.bat',
  'README.md',
  'package.json',
  'package-lock.json',
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(message: string): void {
  console.log(`${colors.cyan}→${colors.reset} ${message}`);
}

function logSuccess(message: string): void {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function logError(message: string): void {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

async function createPackage(): Promise<void> {
  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║        Jira Structure Learning Tool - Packager             ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝\n', 'blue');

  // Verify all required files exist
  logStep('Verifying required files...');
  const missingFiles: string[] = [];

  for (const file of INCLUDE_FILES) {
    const filePath = path.join(PROJECT_ROOT, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    logError('Missing required files:');
    missingFiles.forEach(f => console.log(`   - ${f}`));
    console.log('\nMake sure to run "npm run build" and "npm run build:server" first.');
    process.exit(1);
  }
  
  logSuccess('All required files found');

  // Remove existing zip if it exists
  if (fs.existsSync(OUTPUT_PATH)) {
    logStep('Removing existing package...');
    fs.unlinkSync(OUTPUT_PATH);
    logSuccess('Removed existing package');
  }

  // Create zip file
  logStep('Creating package...');
  
  const output = fs.createWriteStream(OUTPUT_PATH);
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Maximum compression
  });

  // Track archive stats
  let totalFiles = 0;

  // Listen for events
  output.on('close', () => {
    const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
    console.log('');
    logSuccess(`Package created successfully!`);
    console.log('');
    log(`   File: ${OUTPUT_FILE}`, 'cyan');
    log(`   Size: ${sizeMB} MB`, 'cyan');
    log(`   Files: ${totalFiles}`, 'cyan');
    console.log('');
    log('Distribution instructions:', 'yellow');
    console.log('   1. Send the zip file to your recipient');
    console.log('   2. They unzip it to any folder');
    console.log('   3. They double-click START-HERE.command (Mac) or START-HERE.bat (Windows)');
    console.log('   4. The app opens in their browser automatically!');
    console.log('');
    log('Note: Recipients need Node.js 18+ installed.', 'yellow');
    console.log('');
  });

  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      log(`Warning: ${err.message}`, 'yellow');
    } else {
      throw err;
    }
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.on('entry', () => {
    totalFiles++;
  });

  // Pipe archive data to the file
  archive.pipe(output);

  // Add files and directories
  for (const item of INCLUDE_FILES) {
    const itemPath = path.join(PROJECT_ROOT, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // Add directory recursively
      archive.directory(itemPath, item);
      console.log(`   Adding directory: ${item}/`);
    } else {
      // Add file
      archive.file(itemPath, { name: item });
      console.log(`   Adding file: ${item}`);
    }
  }

  // Finalize the archive
  await archive.finalize();
}

// Run the packager
createPackage().catch((err) => {
  logError(`Packaging failed: ${err.message}`);
  process.exit(1);
});
