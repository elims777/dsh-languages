#!/usr/bin/env node
/**
 * Refreshes `en/` from an installed DeepSeek Harness build.
 *
 * The application ships no translation files: English and Chinese UI copy is
 * compiled into each `@deepseek-ai/dsh-client-*` bundle and registered at
 * runtime through `ctx.locale.register(ns, { zh, en })`. This tool walks the
 * AppImage/asar archive, parses those `en` dictionaries and writes them to
 * `en/<namespace>.json`, which the build then validates translations against.
 *
 * Usage: node tools/extract.mjs "<path to resources/app.asar>"
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ASAR_MAGIC_HEADER = 8; // uint32 (4) + uint32 header-string size (4)

function openAsar(asarPath) {
  const fd = fs.openSync(asarPath, 'r');
  const prefix = Buffer.alloc(16);
  fs.readSync(fd, prefix, 0, 16, 0);
  const headerSize = prefix.readUInt32LE(12);
  const header = Buffer.alloc(headerSize);
  fs.readSync(fd, header, 0, headerSize, 16);
  const index = JSON.parse(header.toString('utf8'));
  const dataOffset = 16 + headerSize;

  const read = (node) => {
    if (node.unpacked) return fs.readFileSync(path.join(`${asarPath}.unpacked`, node.path));
    const buffer = Buffer.alloc(node.size);
    fs.readSync(fd, buffer, 0, node.size, dataOffset + Number(node.offset));
    return buffer;
  };
  return { index, read, close: () => fs.closeSync(fd) };
}

function walk(node, prefix, visit) {
  if (!node.files) return;
  for (const [name, child] of Object.entries(node.files)) {
    const rel = `${prefix}/${name}`;
    if (child.files) walk(child, rel, visit);
    else if (typeof child.offset !== 'undefined') visit(rel, { ...child, path: rel.replace(/^\//, '') });
  }
}

// ── a small scanner for the generated bundles ───────────────────────────────

const skipString = (s, i) => {
  const quote = s[i];
  i += 1;
  while (i < s.length) {
    if (s[i] === '\\') i += 2;
    else if (s[i] === quote) return i + 1;
    else i += 1;
  }
  return i;
};

const skipComment = (s, i) => {
  if (s[i] === '/' && s[i + 1] === '/') {
    const end = s.indexOf('\n', i);
    return end === -1 ? s.length : end + 1;
  }
  if (s[i] === '/' && s[i + 1] === '*') {
    const end = s.indexOf('*/', i + 2);
    return end === -1 ? s.length : end + 2;
  }
  return i;
};

const matchBrace = (s, start) => {
  let depth = 0;
  let i = start;
  while (i < s.length) {
    const c = s[i];
    if (c === '"' || c === "'" || c === '`') {
      i = skipString(s, i);
      continue;
    }
    if (c === '/' && (s[i + 1] === '/' || s[i + 1] === '*')) {
      i = skipComment(s, i);
      continue;
    }
    if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
    i += 1;
  }
  return -1;
};

const unescapeString = (raw) =>
  raw.replace(/\\(u[0-9a-fA-F]{4}|n|t|r|"|'|\\|\n)/g, (_match, group) => {
    switch (group[0]) {
      case 'n':
        return '\n';
      case 't':
        return '\t';
      case 'r':
        return '\r';
      case 'u':
        return String.fromCharCode(parseInt(group.slice(1), 16));
      case '\n':
        return '';
      default:
        return group;
    }
  });

const parseEntries = (inner) => {
  const entries = {};
  const spreads = [];
  let i = 0;
  while (i < inner.length) {
    while (i < inner.length && /[\s,]/.test(inner[i])) i += 1;
    if (i >= inner.length) break;
    if (inner.startsWith('...', i)) {
      const spread = /^\.\.\.([A-Za-z_$][\w$]*)/.exec(inner.slice(i));
      if (!spread) break;
      spreads.push(spread[1]);
      i += spread[0].length;
      continue;
    }
    let key;
    if (inner[i] === '"' || inner[i] === "'") {
      const quote = inner[i];
      let j = i + 1;
      while (j < inner.length && inner[j] !== quote) {
        if (inner[j] === '\\') j += 1;
        j += 1;
      }
      key = unescapeString(inner.slice(i + 1, j));
      i = j + 1;
    } else {
      const identifier = /^[A-Za-z_$][\w$]*/.exec(inner.slice(i));
      if (!identifier) break;
      key = identifier[0];
      i += key.length;
    }
    while (i < inner.length && /\s/.test(inner[i])) i += 1;
    if (inner[i] !== ':') return null;
    i += 1;
    while (i < inner.length && /\s/.test(inner[i])) i += 1;
    let value = null;
    if (inner[i] === '"' || inner[i] === "'") {
      const quote = inner[i];
      let j = i + 1;
      while (j < inner.length && inner[j] !== quote) {
        if (inner[j] === '\\') j += 1;
        j += 1;
      }
      value = unescapeString(inner.slice(i + 1, j));
      i = j + 1;
    } else if (inner[i] === '`') {
      const end = skipString(inner, i);
      value = inner.slice(i + 1, end - 1);
      i = end;
    } else {
      let depth = 0;
      while (i < inner.length) {
        const c = inner[i];
        if (c === '"' || c === "'" || c === '`') {
          i = skipString(inner, i);
          continue;
        }
        if (c === '(' || c === '[' || c === '{') depth += 1;
        if (c === ')' || c === ']' || c === '}') depth -= 1;
        if (c === ',' && depth === 0) break;
        i += 1;
      }
    }
    if (value !== null) entries[key] = value;
  }
  return { entries, spreads };
};

function extractFromBundle(source) {
  const dicts = new Map();
  for (const match of source.matchAll(/const ([A-Za-z_$][\w$]*) = \{/g)) {
    const brace = match.index + match[0].length - 1;
    const end = matchBrace(source, brace);
    if (end === -1) continue;
    const parsed = parseEntries(source.slice(brace + 1, end));
    if (parsed && Object.keys(parsed.entries).length) dicts.set(match[1], parsed);
  }
  const resolve = (name, seen = new Set()) => {
    if (!name || seen.has(name)) return null;
    seen.add(name);
    const dict = dicts.get(name);
    if (!dict) return null;
    let merged = {};
    for (const spread of dict.spreads) {
      const base = resolve(spread, seen);
      if (base) merged = { ...merged, ...base };
    }
    return { ...merged, ...dict.entries };
  };

  const constants = new Map();
  for (const match of source.matchAll(/const ([A-Za-z_$][\w$]*) = "([^"]*)";/g)) constants.set(match[1], match[2]);

  const result = {};
  for (const match of source.matchAll(/locale\.register\(/g)) {
    const open = match.index + match[0].length - 1;
    let depth = 0;
    let end = -1;
    for (let i = open; i < source.length; i += 1) {
      const c = source[i];
      if (c === '"' || c === "'" || c === '`') {
        i = skipString(source, i) - 1;
        continue;
      }
      if (c === '(') depth += 1;
      else if (c === ')') {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) continue;
    const args = source.slice(open + 1, end);
    const head = /^\s*("([^"]*)"|'([^']*)'|([A-Za-z_$][\w$]*))\s*,\s*\{/.exec(args);
    if (!head) continue;
    const ns = head[2] ?? head[3] ?? constants.get(head[4]) ?? head[4];
    const objectStart = open + 1 + head[0].length - 1;
    const objectEnd = matchBrace(source, objectStart);
    if (objectEnd === -1) continue;
    const inner = source.slice(objectStart + 1, objectEnd);
    let english = null;
    const inline = /(^|[\s,])en\s*:\s*\{/.exec(inner);
    if (inline) {
      const start = inline.index + inline[0].length - 1;
      const finish = matchBrace(inner, start);
      english = parseEntries(inner.slice(start + 1, finish))?.entries ?? null;
    } else {
      const names = {};
      for (const name of inner.matchAll(/([A-Za-z_$][\w$]*)\s*(?::\s*([A-Za-z_$][\w$]*))?\s*(?=,|$)/g)) {
        names[name[1]] = name[2] ?? name[1];
      }
      if (names.en) english = resolve(names.en);
    }
    if (english) result[ns] = { ...(result[ns] ?? {}), ...english };
  }
  return result;
}

// ── main ────────────────────────────────────────────────────────────────────

const asarPath = process.argv[2];
if (!asarPath) {
  console.error('usage: node tools/extract.mjs "<path to resources/app.asar>"');
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const enDir = path.join(root, 'locales', 'en');
const asar = openAsar(asarPath);
const bundles = [];
walk(asar.index, '', (rel, node) => {
  if (/^\/dsh\/node_modules\/@deepseek-ai\/[^/]+\/lib\/client\.js$/.test(rel)) bundles.push(node);
});

if (!bundles.length) {
  console.error('no @deepseek-ai client bundles found in the archive');
  process.exit(1);
}

const namespaces = {};
for (const node of bundles) {
  const source = asar.read(node).toString('utf8');
  Object.assign(namespaces, extractFromBundle(source));
}
asar.close();

fs.rmSync(enDir, { recursive: true, force: true });
fs.mkdirSync(enDir, { recursive: true });
let total = 0;
for (const [ns, entries] of Object.entries(namespaces)) {
  fs.writeFileSync(path.join(enDir, `${ns}.json`), `${JSON.stringify(entries, null, 2)}\n`);
  total += Object.keys(entries).length;
}
console.log(`extracted ${Object.keys(namespaces).length} namespaces, ${total} strings from ${bundles.length} bundles`);
