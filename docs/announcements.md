# Готовые посты для сообщества

Плагин: **dsh_languages** — 14 языков интерфейса DeepSeek Harness.
Ссылки: https://github.com/elims777/dsh_languages ·
https://github.com/elims777/dsh_languages/releases/tag/v1.0.1

Установка в одну строку:

```
dsh plugin add github:elims777/dsh_languages
```

---

## GitHub Discussions (уже опубликовано)

- Show Your Plugins: https://github.com/deepseek-ai/deepseek-harness/discussions/12017
- Ideas (нативные меню): https://github.com/deepseek-ai/deepseek-harness/discussions/12018

---

## Telegram / Discord (RU)

**DeepSeek Harness теперь по-русски — и не только**

Сделал плагин `dsh_languages`: 14 языков интерфейса, 63 экрана, 2 886 строк на язык.

- Русский, Español, Português (BR), Deutsch, Français, Italiano, Polski, Türkçe,
  日本語, 한국어, 繁體中文, Bahasa Indonesia, Tiếng Việt, हिन्दी
- Без патчей `app.asar`: язык регистрируется через штатный `ctx.locale`
- Непереведённое аккуратно падает в английский, ничего не ломается
- Установка: `dsh plugin add github:elims777/dsh_languages`
- Или через Plugins → Install → `github:elims777/dsh_languages`
- После установки: Settings → General → Language

Репозиторий: https://github.com/elims777/dsh_languages (MIT, неофициальный)
Переводы — черновики: носители, приходите править, `CONTRIBUTING.md` внутри.

#DeepSeekHarness #DSH #i18n

---

## Reddit / Hacker News / X (EN)

**I translated DeepSeek Harness into 14 languages as a plugin**

`dsh_languages` is a community language pack for the Harness web UI: 63 namespaces,
2,886 strings per language, registered through the public `ctx.locale` API — no
`app.asar` patching, no rebuilds.

Languages: Russian, Spanish, Portuguese (BR), German, French, Italian, Polish,
Turkish, Japanese, Korean, Traditional Chinese, Indonesian, Vietnamese, Hindi.

- Install: `dsh plugin add github:elims777/dsh_languages`
- Repo: https://github.com/elims777/dsh_languages (MIT, unofficial)
- Release: https://github.com/elims777/dsh_languages/releases/tag/v1.0.1
- Partially translated languages fall back to English per key.

Drafts are machine-assisted; native speakers welcome to send PRs (there is a
`node tools/new-locale.mjs <code> "<label>"` scaffold for new languages).

---

## Каталоги плагинов (куда стоит занести)

1. **dsh.so** — форма https://www.dsh.so/submit/ (вставить
   `https://github.com/elims777/dsh_languages`, тип «dsh plugin»).
   Ограничение: их id должен слагифицироваться в `kebab-case`
   (`^[a-z0-9]+(-[a-z0-9]+)*$`), а у нас имя `dsh_languages` — могут попросить
   алиас/переименование; в форме можно указать npm-имя, если появится.
2. **dshai.org** — ничего отправлять не нужно: коллектор берёт репозитории с
   GitHub-топиком `dsh-plugin` (у нас он есть) в течение суток.
3. **dshbase.com / dshplug.com** — каталоги-агрегаторы; обычно тоже тянут по
   топику `dsh-plugin`, при отсутствии — форма «submit» на сайте.

## Что усилит распространение

- скриншот/гиф переключения языка (визуал решает);
- пост в день релиза + повтор через неделю с «что нового»;
- просьба к носителям вычитать конкретный язык (это даёт первые PR);
- упоминание в issue/обсуждениях, где люди жалуются на отсутствие локализации.
