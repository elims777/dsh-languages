# Translation brief (for contributors and AI-assisted drafts)

Перевод интерфейса DSH на новый язык. Источник — `locales/en/<namespace>.json`
(плоский объект «ключ → английская строка»). Результат — `locales/<код>/<namespace>.json`
с тем же набором ключей в том же порядке.

## Жёсткие требования

1. Ключи и их порядок — как в источнике; ничего не добавлять и не удалять.
2. `{name}`, `{count}`, `{value}` и любые `{…}` — дословно; порядок слов в
   предложении можно менять по правилам языка.
3. Не переводить: `DeepSeek`, `DSH`, `Harness`, `GitHub`, `MCP`, `JSON`, `API`,
   `HTTP`, `URL`, имена моделей, пути и имена файлов, кодовые идентификаторы,
   сочетания клавиш, названия продуктов (Cursor, VS Code, PDF, Office), единицы
   (`ms`, `s`, `min`, `KB`, `tok/s`), слэш-команды (`/compact`, `goal`).
4. Стиль: кратко, нейтрально, без обращений «вы». Кнопки — глагол действия
   («Сохранить»), заголовки — с заглавной, короткие подписи — без точки.
5. Типографика: сохранять `…`, `—`, `·`, обрамляющие пробелы, регистр первой
   буквы; кавычки — типографские для языка.
6. Плюрализация: ICU-форм нет. Строки с `{count}` формулировать нейтрально
   («Файлов: {count}», «Noch {count}»), избегая согласования с числом.
7. Если строка — технический токен или шаблон (`{y}-{m}-{d}`, `Cron {expression}`),
   оставить как есть.

## Глоссарий

| English | Español | Português (BR) | Deutsch |
|---|---|---|---|
| agent | agente | agente | Agent |
| subagent | subagente | subagente | Subagent |
| session | sesión | sessão | Sitzung |
| workspace | espacio de trabajo | área de trabalho | Arbeitsbereich |
| turn | turno | turno | Runde |
| step | paso | etapa | Schritt |
| tool | herramienta | ferramenta | Werkzeug |
| skill | habilidad | habilidade | Fähigkeit |
| plugin | complemento | plugin | Plugin |
| preset | preajuste | predefinição | Voreinstellung |
| profile | perfil | perfil | Profil |
| permission | permiso | permissão | Berechtigung |
| approval | confirmación | confirmação | Bestätigung |
| sandbox | sandbox | sandbox | Sandbox |
| job (background) | tarea | tarefa | Aufgabe |
| goal | objetivo | meta | Ziel |
| plan | plan | plano | Plan |
| schedule | programación | agendamento | Zeitplan |
| attachment | archivo adjunto | anexo | Anhang |
| deliverable | resultado | resultado | Ergebnis |
| compaction | compactación del contexto | compactação de contexto | Kontextkompression |
| sidebar | panel lateral | barra lateral | Seitenleiste |
| shortcut | atajo de teclado | atalho de teclado | Tastenkürzel |

## Проверка

```bash
npm run check
```

Сборка падает, если ключ пропущен/лишний, разошлись `{плейсхолдеры}` или значение
пустое. Валидный JSON: UTF-8 без BOM, отступ 2 пробела, перевод строки в конце.
