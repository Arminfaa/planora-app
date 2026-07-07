#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../frontend/src');

const REPLACEMENTS = [
  [/\bml-auto\b/g, 'ms-auto'],
  [/\bmr-auto\b/g, 'me-auto'],
  [/\b-ml-/g, '-ms-'],
  [/\b-mr-/g, '-me-'],
  [/\b-pl-/g, 'ps-'],
  [/\b-pr-/g, 'pe-'],
  [/\bml-/g, 'ms-'],
  [/\bmr-/g, 'me-'],
  [/\btext-left\b/g, 'text-start'],
  [/\btext-right\b/g, 'text-end'],
  [/\bborder-l\b/g, 'border-s'],
  [/\bborder-r\b/g, 'border-e'],
  [/\bborder-l-/g, 'border-s-'],
  [/\bborder-r-/g, 'border-e-'],
  [/\brounded-l\b/g, 'rounded-s'],
  [/\brounded-r\b/g, 'rounded-e'],
  [/\brounded-l-/g, 'rounded-s-'],
  [/\brounded-r-/g, 'rounded-e-'],
  [/\bleft-0\b/g, 'start-0'],
  [/\bright-0\b/g, 'end-0'],
  [/\bleft-1\b/g, 'start-1'],
  [/\bright-1\b/g, 'end-1'],
  [/\bleft-2\b/g, 'start-2'],
  [/\bright-2\b/g, 'end-2'],
  [/\bleft-3\b/g, 'start-3'],
  [/\bright-3\b/g, 'end-3'],
  [/\bleft-4\b/g, 'start-4'],
  [/\bright-4\b/g, 'end-4'],
  [/\b-left-1\b/g, '-start-1'],
  [/\b-right-1\b/g, '-end-1'],
  [/\b-left-2\b/g, '-start-2'],
  [/\b-right-2\b/g, '-end-2'],
  [/\b-left-8\b/g, '-start-8'],
  [/\b-right-8\b/g, '-end-8'],
  [/\bscroll-pl-/g, 'scroll-ps-'],
  [/\bscroll-pr-/g, 'scroll-pe-'],
  [/\bscroll-ml-/g, 'scroll-ms-'],
  [/\bscroll-mr-/g, 'scroll-me-'],
  [/\bmin-\[1400px\]:text-left\b/g, 'min-[1400px]:text-start'],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (/\.(tsx?|css)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

let changedFiles = 0;

for (const file of walk(ROOT)) {
  const original = fs.readFileSync(file, 'utf8');
  let next = original;

  for (const [pattern, replacement] of REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  if (next !== original) {
    fs.writeFileSync(file, next);
    changedFiles += 1;
  }
}

console.log(`Updated ${changedFiles} files with logical Tailwind classes.`);
