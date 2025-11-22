#!/usr/bin/env node

/**
 * Simple build script for sequelize-apache-age
 * Copies source files to lib/ directory
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const libDir = path.join(__dirname, '..', 'lib');

/**
 * Recursively copy directory
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${srcPath} -> ${destPath}`);
    }
  }
}

console.log('Building sequelize-apache-age...');
console.log(`Source: ${srcDir}`);
console.log(`Destination: ${libDir}`);

// Clean lib directory
if (fs.existsSync(libDir)) {
  fs.rmSync(libDir, { recursive: true });
  console.log('Cleaned lib directory');
}

// Copy src to lib
copyDir(srcDir, libDir);

console.log('Build complete!');
