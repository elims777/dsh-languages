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

const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exit(1);
};

let captured;
const sandbox = { window: { __ModuleLoader__: { load: (def) => { captured = def; } } } };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'lib/client.js' });

if (!captured) fail('bundle did not call window.__ModuleLoader__.load');
if (captured.id !== 'dsh-languages') fail(`unexpected module id ${captured.id}`);
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
      if (languages.some((language) => language.id === input.id)) fail(`duplicate language ${input.id}`);
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

const catalog = JSON.parse(fs.readFileSync(path.join(root, 'locales.json'), 'utf8')).languages;
const english = new Set(
  fs.readdirSync(path.join(root, 'locales', 'en')).filter((name) => name.endsWith('.json')).map((name) => name.replace(/\.json$/, '')),
);
const expected = catalog.filter((language) => fs.existsSync(path.join(root, 'locales', language.id)));
if (languages.length !== expected.length) fail(`expected ${expected.length} languages, got ${languages.length}`);
for (const language of expected) {
  const registered = languages.find((entry) => entry.id === language.id);
  if (!registered) fail(`language ${language.id} was not registered`);
  if (registered.label !== language.label) fail(`language ${language.id} label mismatch`);
  if (registered.fallback !== 'en') fail(`language ${language.id} must fall back to en`);
}

if (dictionaries.size === 0) fail('no dictionaries registered');
for (const [key, dict] of dictionaries) {
  const [ns, locale] = key.split(':');
  if (!english.has(ns)) fail(`dictionary ${key} names a namespace that does not exist`);
  if (!catalog.some((language) => language.id === locale)) fail(`dictionary ${key} names an unknown language`);
  if (Object.keys(dict).length === 0) fail(`${key} is empty`);
}

const strings = [...dictionaries.values()].reduce((n, dict) => n + Object.keys(dict).length, 0);
console.log(
  `OK: ${languages.map((language) => `${language.id}/${language.label}`).join(', ')}, ` +
    `${dictionaries.size} dictionaries, ${strings} strings`,
);
