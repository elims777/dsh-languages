# Issue draft: list dsh-languages in the official plugin catalog

**Title:** Plugin proposal: `dsh-languages` — 14 community translations for the web UI

**Body:**

Hi! I maintain `dsh-languages`, a community language pack for the web UI, and I'd
like to ask how it can be listed in the official plugin catalog that ships with
Desktop/Web, or in the default market index.

## What it is

- **Repo:** https://github.com/elims777/dsh-languages
- **Package:** `dsh-languages` (MIT, no runtime dependencies)
- **What it does:** registers 14 languages through the public `ctx.locale` API and
  ships a dictionary for every namespace of every `@deepseek-ai/dsh-client-*`
  package: Русский, Español, Português (Brasil), Deutsch, Français, Italiano,
  Polski, Türkçe, 日本語, 한국어, 繁體中文, Bahasa Indonesia, Tiếng Việt, हिन्दी.

It is an ordinary DSH bundle plugin:

| File | Role |
|---|---|
| `cordis.patch.yml` | inserts one row, `locales`, into the web composition |
| `lib/index.js` | Node half: a no-op so the Loader row is valid |
| `lib/client.js` | browser half: `addLanguage()` + `register(ns, lang, dict)` per namespace |
| `locales/<code>/*.json` | translations, 63 namespaces, 2 886 strings per language |
| `locales/en/*.json` | English dictionaries extracted from the client bundles (key source of truth) |
| `locale/*.json` | package metadata for the plugin list |

Every dictionary falls back to English, so a partially translated language
degrades gracefully. The build validates key sets, `{placeholders}` and empty
values, and a `verify` step activates the bundle in a fake cordis context;
CI checks that the committed bundle matches the sources.

## Why it may fit the catalog

- no patching of `app.asar`, no native code, no build step for users;
- one row, disabled/uninstalled like any other bundle;
- ~1.3 MB packed, ~3 MB unpacked bundle;
- works with DSH 0.2.x (`engines.dsh: >=0.2.1-rc.5`);
- translations are community-maintained (currently reviewed drafts, natives
  welcome), with `CONTRIBUTING.md` and a `new-locale` scaffold.

## What I'd like to know

1. Is there a submission process for community plugins to the official catalog
   or the default market index, or is the catalog curated per release?
2. If listing is possible: which entry do you need — npm package, git source
   pinned to a commit, or a market index (`format: 1`)?
3. If the catalog is curated only by the team, is there a checklist (security,
   licensing, compatibility, maintenance) I can satisfy and re-submit against?

The package already installs today with
`dsh plugin add github:elims777/dsh-languages`, and the repo ships a market
index at `market/index.json` for Discover.

Thanks!

---

## Optional second issue (separate concern)

**Title:** Desktop shell menus are limited to English and Chinese

The Electron shell (`lib/main.js`) ships only `en` and `zh` dictionaries and
`resolveDesktopLocale()` maps everything else to English, so the native context
menu (Undo/Cut/Copy/Paste/Select All), the application/tray menus and the update
dialogs stay English even when the Web UI is in another language. It would help
to let the shell read locale dictionaries from the profile (for example
`$DSH_HOME/profiles/<profile>/locales/<id>.json`) or from enabled plugins; see
the full write-up in the `dsh-languages` repo: `docs/upstream-shell-menu.md`.
