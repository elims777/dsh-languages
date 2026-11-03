# Upstream issue draft: shell menus are limited to English and Chinese

The Desktop shell (`lib/main.js` in `app.asar`) owns the native menus: the
Windows context menu in the chat, the application menu, the tray menu, the
welcome window and the update dialogs. Its copy lives in two dictionaries,

```js
const en = { cut: "Cut", copy: "Copy", paste: "Paste", selectAll: "Select All", … };
const zh = { cut: "剪切", copy: "复制", … };
```

and `resolveDesktopLocale()` maps everything that is not `zh*` to `en`:

```js
function resolveDesktopLocale(locale) {
  return locale.toLowerCase().startsWith("zh")
    ? { id: "zh-CN", messages: zh }
    : { id: "en", messages: en };
}
```

As a result, a user who selects any other language in the Web UI still gets an
English native context menu (Undo/Redo/Cut/Copy/Paste/Select All), English
application/tray menus and English update dialogs. The Web half of DSH supports
arbitrary locales through `ctx.locale`, and third-party plugins can register
languages, but the Electron shell cannot consume them.

## Request

Please let the Desktop shell consume the same locale catalog as the Web UI, at
least for the context and application menus. Two workable shapes:

1. **Read dictionaries from the profile.** The shell looks up an optional
   `<DSH_HOME>/profiles/<profile>/locales/<id>.json` (same flat
   `key → string` shape as the Web dictionaries) and uses it when the resolved
   language is not `en`/`zh`.
2. **Accept extra dictionaries from enabled plugins.** A plugin package can
   ship `desktop/locale/<id>.json` next to its `dsh.client` bundle; the shell
   merges the dictionaries of enabled plugins for the active language.

Either way the fallback stays English, and `app.getPreferredSystemLanguages()`
keeps deciding the initial language.

## Reproduction

1. Set the DSH UI language to anything other than English or Chinese (for
   example with a third-party language pack).
2. Right-click inside the chat input or over selected text.
3. The context menu shows `Undo / Redo / Cut / Copy / Paste / Select All` in
   English.
