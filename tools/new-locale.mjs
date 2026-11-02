#!/usr/bin/env node
/**
 * Scaffolds a new language.
 *
 * Usage: node tools/new-locale.mjs <bcp47-id> "<Native label>"
 * Example: node tools/new-locale.mjs de "Deutsch"
 *
 * Copies the English dictionaries into `locales/<id>/` (so the build keeps
 * working while the translation is in progress), registers the language in
 * `locales.json` and prints the next steps.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [id, label] = process.argv.slice(2);

const fail = (message) => {
  console.error(`error: ${message}`);
  process.exit(1);
};

if (!id || !label) fail('usage: node tools/new-locale.mjs <bcp47-id> "<Native label>"');
if (!/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(id)) fail(`"${id}" is not a BCP 47 style tag (e.g. de, pt-BR, zh-TW)`);
if (id === 'en') fail('en is the source language and is built into DSH');

const catalogPath = path.join(root, 'locales.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const languages = catalog.languages ?? [];
if (languages.some((language) => language.id.toLowerCase() === id.toLowerCase())) fail(`language "${id}" is already in locales.json`);

const sourceDir = path.join(root, 'locales', 'en');
const targetDir = path.join(root, 'locales', id);
if (fs.existsSync(targetDir)) fail(`locales/${id} already exists`);

fs.mkdirSync(targetDir, { recursive: true });
let strings = 0;
for (const file of fs.readdirSync(sourceDir).filter((name) => name.endsWith('.json'))) {
  const english = JSON.parse(fs.readFileSync(path.join(sourceDir, file), 'utf8'));
  strings += Object.keys(english).length;
  fs.writeFileSync(path.join(targetDir, file), `${JSON.stringify(english, null, 2)}\n`);
}

languages.push({ id, label });
catalog.languages = languages;
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

console.log(`scaffolded locales/${id} with ${strings} strings across ${languages.length} languages`);
console.log('');
console.log('Next:');
console.log(`  1. translate every JSON value in locales/${id}/ (keys and {placeholders} must stay)`);
console.log('  2. npm run check   # validates completeness and placeholders, rebuilds lib/client.js');
console.log('  3. commit locales.json, locales/' + id + '/ and lib/client.js');
