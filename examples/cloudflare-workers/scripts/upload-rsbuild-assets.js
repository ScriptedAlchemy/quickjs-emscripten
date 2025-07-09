#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const RSBUILD_DIST_PATH = '../rsbuild-project/dist';
const KV_NAMESPACE = 'MODULE_FEDERATION_ASSETS';

// MIME type mapping
const MIME_TYPES = {
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.html': 'text/html',
  '.css': 'text/css',
  '.map': 'application/json',
  '.txt': 'text/plain',
  '.zip': 'application/zip',
  '.ts': 'application/typescript'
};

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function uploadFile(filePath, kvKey, mimeType) {
  try {
    console.log(`Uploading ${kvKey}...`);
    
    // Create metadata for the file
    const metadata = JSON.stringify({
      contentType: mimeType,
      uploadedAt: new Date().toISOString(),
      size: fs.statSync(filePath).size
    });
    
    // Upload to KV with wrangler
    const command = `npx wrangler kv:key put "${kvKey}" --path="${filePath}" --binding=${KV_NAMESPACE} --metadata='${metadata}'`;
    execSync(command, { stdio: 'inherit' });
    
    console.log(`✅ Uploaded: ${kvKey}`);
  } catch (error) {
    console.error(`❌ Failed to upload ${kvKey}:`, error.message);
  }
}

function walkDirectory(dir, baseDir = dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...walkDirectory(fullPath, baseDir));
    } else {
      // Convert file path to KV key (relative to base directory)
      const relativePath = path.relative(baseDir, fullPath);
      const kvKey = relativePath.replace(/\\/g, '/'); // Use forward slashes
      files.push({ filePath: fullPath, kvKey, size: stat.size });
    }
  }
  
  return files;
}

async function main() {
  console.log('🚀 Starting Rsbuild assets upload to Cloudflare Workers KV...\n');
  
  const distPath = path.resolve(__dirname, RSBUILD_DIST_PATH);
  
  if (!fs.existsSync(distPath)) {
    console.error(`❌ Rsbuild dist directory not found: ${distPath}`);
    console.log('💡 Please run "npm run build" in the rsbuild-project directory first.');
    process.exit(1);
  }
  
  console.log(`📂 Scanning directory: ${distPath}`);
  const files = walkDirectory(distPath);
  
  if (files.length === 0) {
    console.log('⚠️  No files found to upload.');
    return;
  }
  
  console.log(`📦 Found ${files.length} files to upload:\n`);
  
  // Show files that will be uploaded
  files.forEach(({ kvKey, size }) => {
    const sizeKB = (size / 1024).toFixed(2);
    console.log(`  📄 ${kvKey} (${sizeKB} KB)`);
  });
  
  console.log('\n⬆️  Starting upload...\n');
  
  // Upload each file
  for (const { filePath, kvKey } of files) {
    const mimeType = getMimeType(filePath);
    uploadFile(filePath, kvKey, mimeType);
  }
  
  console.log('\n✨ Upload complete! Assets are now available in Cloudflare Workers KV.');
  console.log('\n📝 Access files in your worker with:');
  console.log('   const asset = await env.MODULE_FEDERATION_ASSETS.get("remoteEntry.js");');
  console.log('\n🔗 Main entry point: remoteEntry.js');
  
  // List key files
  const keyFiles = files.filter(f => 
    f.kvKey === 'remoteEntry.js' || 
    f.kvKey.includes('HelloWorld') ||
    f.kvKey.endsWith('.d.ts')
  );
  
  if (keyFiles.length > 0) {
    console.log('\n🎯 Key Module Federation files:');
    keyFiles.forEach(({ kvKey }) => {
      console.log(`   - ${kvKey}`);
    });
  }
}

// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}