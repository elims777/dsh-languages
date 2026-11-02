# dsh-locale-ru

Русская локализация веб-интерфейса [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
(DSH) — плагин-языковой пакет: добавляет в приложение язык **Русский** и переводит
чат, настройки, плагины, планировщик, боковые панели, диалоги и системные сообщения.

- 63 namespace, **2 886 строк**;
- штатный механизм DSH (`ctx.locale.addLanguage` + `ctx.locale.register`), без
  патчей `app.asar`;
- непереведённые ключи автоматически берутся из английского (fallback `en`);
- ноль зависимостей: чистый JavaScript, бандл едет в пакете.

> Неофициальный проект, не связан с DeepSeek.

## Установка

### 1. Через интерфейс (проще всего)

1. Откройте **Plugins** (боковая панель) → **Install**.
2. Укажите spec:
   - из npm: `dsh-locale-ru`
   - из GitHub: `github:<ваш-ник>/dsh-locale-ru`
3. Дождитесь установки, включите бандл и обновите страницу (Ctrl+R).
4. **Settings → General → Language → Русский**.

### 2. Через CLI

```bash
dsh plugin add dsh-locale-ru
# или из git:
dsh plugin add github:<ваш-ник>/dsh-locale-ru
```

Затем перезапустите приложение (или дайте HMR перечитать граф) и выберите
«Русский» в настройках.

### 3. Вручную (офлайн, другой компьютер)

Скачайте `dsh-locale-ru-0.1.0.zip` из релизов (или скопируйте папку пакета),
распакуйте и запустите из неё:

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1
```

Скрипт скопирует пакет в `%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-locale-ru`
и добавит его в `dsh.profile.bundles` профиля. Перезапустите DSH и выберите язык.
Если профиль называется иначе — `-Profile <имя>`, если DSH_HOME другой —
`-DshHome <путь>`.

Для установки через интерфейс (Plugins → Install) подойдёт `.tgz` из релизов:
укажите полный путь к файлу `dsh-locale-ru-0.1.0.tgz` — плагин-менеджер поставит
его как локальный пакет.

Язык появится в списке; предпочтение сохраняется в профиле (`locale.preference: ru`).

## Как это работает

В DSH нет отдельных файлов переводов: английские и китайские строки скомпилированы
в клиентские бандлы `@deepseek-ai/dsh-client-*` и регистрируются при активации:
`ctx.locale.register(ns, { zh, en })`. Плагины могут добавлять свои языки:

```js
ctx.locale.addLanguage({ id: 'ru', label: 'Русский', fallback: 'en' });
ctx.locale.register('chat', 'ru', { 'message.stepProcess.read': 'Чтение файлов' });
```

Пакет делает именно это и состоит из двух половин, как любой DSH-плагин:

| Файл | Роль |
|---|---|
| `cordis.patch.yml` | bundle-патч: вставляет строку `locale-ru` в композицию |
| `lib/index.js` | Node-половина (заглушка, чтобы строка Loader'а была валидной) |
| `lib/client.js` | browser-половина: регистрирует язык `ru` и все словари |
| `en/*.json` | английские словари, извлечённые из приложения (эталон ключей) |
| `ru/*.json` | русские переводы, по файлу на namespace |
| `locale/*.json` | метаданные пакета для списка плагинов |

## Разработка

Требуется Node.js 22+ и установленный DSH (для извлечения английских строк).

```bash
npm run build     # собрать lib/client.js из en/ и ru/
npm run verify    # выполнить бандл в vm с фейковым ctx и проверить активацию
npm run check     # build + verify
```

Обновление словарей после новой версии DSH:

```bash
node tools/extract.mjs "<путь к>\resources\app.asar"   # обновит en/*.json
npm run build
```

Новые ключи появятся в `en/<namespace>.json`; переведите их в `ru/<namespace>.json`
(сборка упадёт, если ключ пропущен или разошлись `{плейсхолдеры}`), затем
`npm run build` и закоммитьте `lib/client.js` вместе с переводами.

Правила перевода — в [CONTRIBUTING.md](CONTRIBUTING.md).

## Ограничения

- Динамические метаданные (`LocalizedText`: названия пакетов и плагинов,
  поставляемые хостом) остаются английскими — они лежат в манифестах внутри
  `app.asar`, а не в бандлах интерфейса;
- компактные единицы (`{count} min`, `{value} tok/s`) и имена продуктов
  (Cursor, VS Code, PDF) не переводятся намеренно;
- в DSH нет ICU-плюрализации: строки с `{count}` сформулированы нейтрально
  («Найдено файлов: {count}»);
- перевод рассчитан на DSH 0.2.x; после обновления приложения новые строки
  останутся английскими до `extract` + перевода.

## Если что-то не так

- **Языка нет в списке** — бандл не смонтировался: проверьте, что `dsh-locale-ru`
  есть в `dsh.profile.bundles` профиля, и перезапустите приложение (Ctrl+R
  недостаточно, граф композиции собирается при старте).
- **Часть строк осталась английской** — это новые ключи из свежей версии DSH:
  сделайте `node tools/extract.mjs …`, допереведите и пересоберите.
- **«Вход выполнен», но «Данные аккаунта пока недоступны»** — это не локализация:
  имя/почту панель берёт из запроса к `platform.deepseek.com`, и он не проходит
  (протух токен или запрос блокируется сетью/WAF). Помогает повторный вход
  (Выйти → Войти) или другая сеть.
- **Пустой экран после установки** — уберите `dsh-locale-ru` из
  `dsh.profile.bundles`, перезапустите и пришлите issue с версией DSH.

## Английский / English

`dsh-locale-ru` is a Russian language pack for the DeepSeek Harness web UI,
shipped as an ordinary DSH bundle plugin. Install it from npm
(`dsh-locale-ru`) or GitHub, pick **Русский** in Settings → General → Language.
No `app.asar` patching: the plugin registers the `ru` language and its
dictionaries through the public `ctx.locale` API. Build tooling:
`npm run build` / `npm run verify`; refresh English sources from a DSH
installation with `node tools/extract.mjs "<...>/resources/app.asar"`.

## Лицензия

[MIT](LICENSE).
