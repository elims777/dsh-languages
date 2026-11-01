#!/usr/bin/env node
/**
 * Loads the built client bundle the way the DSH module loader does
 * (`window.__ModuleLoader__.load(...)` → `factory(require)`) and activates it
 * against a fake cordis context. A broken bundle fails here, not in the browser.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'lib', 'client.js'), 'utf8');

let captured;
const sandbox = { window: { __ModuleLoader__: { load: (def) => { captured = def; } } } };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'lib/client.js' });

const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exit(1);
};

if (!captured) fail('bundle did not call window.__ModuleLoader__.load');
if (captured.id !== 'dsh-locale-ru') fail(`unexpected module id ${captured.id}`);
const moduleExports = captured.factory(() => {
  fail('the language pack must not require other modules');
});

const languages = [];
const dictionaries = new Map();
const ctx = {
  effect(fn) {
    return fn();
  },
  locale: {
    addLanguage(input) {
      languages.push(input);
      return () => {};
    },
    register(ns, locale, dict) {
      if (dictionaries.has(`${ns}:${locale}`)) fail(`duplicate registration for ${ns}:${locale}`);
      dictionaries.set(`${ns}:${locale}`, dict);
      return () => {};
    },
  },
};

moduleExports.apply(ctx);

if (!moduleExports.inject?.includes('locale')) fail('inject must declare the locale service');
if (languages.length !== 1 || languages[0].id !== 'ru') fail(`expected exactly one ru language, got ${JSON.stringify(languages)}`);
if (languages[0].fallback !== 'en') fail('ru must fall back to en');
if (dictionaries.size !== fs.readdirSync(path.join(root, 'en')).length) fail('not every namespace registered a dictionary');

for (const [key, dict] of dictionaries) {
  if (!key.endsWith(':ru')) fail(`dictionary registered under ${key}`);
  if (Object.keys(dict).length === 0) fail(`${key} is empty`);
}

const strings = [...dictionaries.values()].reduce((n, dict) => n + Object.keys(dict).length, 0);
console.log(`OK: ${languages.map((l) => `${l.id}/${l.label}/${l.fallback}`).join(', ')}, ${dictionaries.size} namespaces, ${strings} strings`);
