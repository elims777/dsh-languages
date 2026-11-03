# dsh-locales

Переводы интерфейса [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
(DSH) силами сообщества: один плагин-пакет, много языков. Добавляет в приложение
выбранные языки и переводит чат, настройки, плагины, планировщик, боковые панели,
диалоги и системные сообщения.

- **2 886 строк** на язык, 63 namespace;
- штатный механизм DSH (`ctx.locale.addLanguage` + `ctx.locale.register`), без
  патчей `app.asar` и без пересборки приложения;
- непереведённые ключи автоматически берутся из английского (fallback `en`);
- ноль зависимостей: чистый JavaScript, собранный бандл едет в пакете.

> Неофициальный проект, не связан с DeepSeek.

## Языки

| Язык | Код | Статус |
|---|---|---|
| Русский | `ru` | ✅ готов, 100 % |
| Español | `es` | ✅ готов (черновик сообщества) |
| Português (Brasil) | `pt-BR` | ✅ готов (черновик сообщества) |
| Deutsch | `de` | ✅ готов (черновик сообщества) |
| Français | `fr` | ✅ готов (черновик сообщества) |
| Italiano | `it` | ✅ готов (черновик сообщества) |
| Polski | `pl` | ✅ готов (черновик сообщества) |
| Türkçe | `tr` | ✅ готов (черновик сообщества) |
| 日本語 | `ja` | ✅ готов (черновик сообщества) |
| 한국어 | `ko` | 🚧 в планах |
| 繁體中文 | `zh-TW` | 🚧 в планах |
| Bahasa Indonesia | `id` | 🚧 в планах |
| Tiếng Việt | `vi` | 🚧 в планах |
| हिन्दी | `hi` | 🚧 в планах |

Готовые языки попадают в сборку, остальные появились в каталоге как заявка:
язык с переведённым каталогом `locales/<код>/` включается автоматически.
Арабский (`ar`) не включён: интерфейс DSH не поддерживает RTL-раскладку.

## Установка

### 1. Через интерфейс

1. **Plugins** (боковая панель) → **Install**.
2. Укажите spec: `dsh-locales` (npm) или `github:<ник>/dsh-locales` (GitHub).
3. Включите бандл и обновите страницу (Ctrl+R).
4. **Settings → General → Language** → выберите язык.

### 2. Через CLI

```bash
dsh plugin add dsh-locales
# или из git:
dsh plugin add github:<ник>/dsh-locales
```

Перезапустите приложение и выберите язык в настройках.

### 3. Вручную (офлайн)

Скачайте `dsh-locales-<версия>.zip` из релизов, распакуйте и запустите:

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1
```

Скрипт скопирует пакет в `%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-locales`
и добавит его в `dsh.profile.bundles`. Перезапустите DSH.
Профиль задаётся через `-Profile <имя>`, домашний каталог — через `-DshHome <путь>`.

## Как это работает

В DSH нет отдельных файлов переводов: английские и китайские строки скомпилированы
в клиентские бандлы `@deepseek-ai/dsh-client-*` и регистрируются при активации
(`ctx.locale.register(ns, { zh, en })`). Плагины могут добавлять свои языки:

```js
ctx.locale.addLanguage({ id: 'de', label: 'Deutsch', fallback: 'en' });
ctx.locale.register('settings', 'de', { trigger: 'Einstellungen' });
```

Пакет делает именно это:

| Файл | Роль |
|---|---|
| `cordis.patch.yml` | bundle-патч: вставляет строку `locales` в композицию |
| `lib/index.js` | Node-половина (заглушка, чтобы строка Loader'а была валидной) |
| `lib/client.js` | browser-половина: регистрирует все языки и словари |
| `locales/en/*.json` | английские словари, извлечённые из приложения (эталон ключей) |
| `locales/<код>/*.json` | переводы, по файлу на namespace |
| `locales.json` | каталог языков: код + подпись |
| `locale/*.json` | метаданные пакета для списка плагинов |

## Как добавить свой язык

```bash
node tools/new-locale.mjs de "Deutsch"   # создаст locales/de/ и запись в locales.json
# переведите значения в locales/de/*.json (ключи и {плейсхолдеры} не трогать)
npm run check                            # проверит полноту и пересоберёт lib/client.js
```

Дальше — коммит `locales.json`, `locales/de/` и `lib/client.js` и PR. Подробные
правила, глоссарий и требования к качеству — в [CONTRIBUTING.md](CONTRIBUTING.md).
Язык можно сопровождать самостоятельно: в PR укажите себя как maintainer языка.

Если язык не хочется отдавать в общий пакет — выпустите **свой плагин-язык**:
достаточно пакета с `dsh.client`, который делает `addLanguage` и `register` для
своего кода (этот репозиторий можно использовать как шаблон). DSH подхватит оба
плагина одновременно.

## Разработка

Нужен Node.js 22+ и установленный DSH (для извлечения английских строк).

```bash
npm run build       # собрать lib/client.js из locales/ и locales.json
npm run verify      # выполнить бандл в vm с фейковым ctx
npm run check       # build + verify
npm run new-locale  # см. выше
```

Обновление строк после новой версии DSH:

```bash
node tools/extract.mjs "<путь к>\resources\app.asar"   # обновит locales/en/*.json
npm run build
```

Новые ключи появятся в `locales/en/<namespace>.json`; переведите их в каждом
языке (сборка падает, если ключ пропущен или разошлись `{плейсхолдеры}`).

## Если что-то не так

- **Языка нет в списке** — бандл не смонтировался: проверьте, что `dsh-locales`
  есть в `dsh.profile.bundles`, и перезапустите приложение (Ctrl+R недостаточно,
  граф композиции собирается при старте).
- **Часть строк осталась английской** — это новые ключи из свежей версии DSH:
  `node tools/extract.mjs …`, допереведите, `npm run build`.
- **«Вход выполнен», но «Данные аккаунта пока недоступны»** — не локализация:
  панель берёт имя/почту из запроса к `platform.deepseek.com`, и он не проходит
  (протух токен или запрос режет сеть/WAF). Помогает повторный вход или другая сеть.
- **Пустой экран после установки** — уберите `dsh-locales` из
  `dsh.profile.bundles`, перезапустите и пришлите issue с версией DSH.

## Ограничения

- Динамические метаданные (`LocalizedText`: названия пакетов и плагинов,
  поставляемые хостом) остаются английскими — они лежат в манифестах внутри
  `app.asar`, а не в бандлах интерфейса;
- компактные единицы (`{count} min`, `{value} tok/s`) и имена продуктов
  (Cursor, VS Code, PDF) не переводятся намеренно;
- в DSH нет ICU-плюрализации: строки с `{count}` сформулированы нейтрально;
- переводы делает сообщество (в том числе машинно с вычиткой): приветствуются PR
  от носителей.

## English

`dsh-locales` is a community language pack for the DeepSeek Harness web UI.
It registers every translated language through the public `ctx.locale` API, so no
`app.asar` patching is needed. Russian is complete; other languages are listed in
`locales.json` and can be added with `node tools/new-locale.mjs <id> "<label>"`.
Install with `dsh plugin add dsh-locales`, pick a language in
Settings → General → Language. Build: `npm run check`.

## Лицензия

[MIT](LICENSE).
