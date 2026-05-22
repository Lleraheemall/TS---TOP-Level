# Type-Safe API Client Generator

Типобезпечний API client на TypeScript: endpoint'и, HTTP-методи, `params` / `query` / `body` і тип відповіді виводяться зі схеми на етапі компіляції.

## Структура

```txt
src/
  api-schema.ts   — приклад ApiSchema
  types.ts        — type-level утиліти (ExtractRouteParams, RequestConfig, …)
  url-utils.ts    — buildUrl, buildQuery
  api-client.ts   — ApiClient / createApiClient
  demo.ts         — демонстрація runtime
  type-tests.ts   — перевірки типів (@ts-expect-error)
```

## Команди

```bash
npm install
npm run build
npm run demo
```

`npm run build` компілює проєкт у strict mode, включно з `type-tests.ts`.

## Основні типи

- `ExtractRouteParams<"/users/:id/posts/:postId">` → `{ id: string; postId: string }`
- `RequestConfig<Schema, Path, Method>` — config лише з потрібними полями
- `ResponseOf<Schema, Path, Method>` — тип response
- `MethodsOf<Schema, Path>` — дозволені методи для path
- `PathsWithMethod<Schema, Method>` — path'и з певним методом

## Максимальний бал (додаткове ускладнення)

| Вимога | Статус | Де в коді |
|--------|--------|-----------|
| **1. URL builder** `buildUrl("/users/:id/posts/:postId", { id, postId })` → `/users/1/posts/10` | ✅ | `src/url-utils.ts`, використовується в `api-client.ts`, demo |
| **2. Query builder** `buildQuery({ page, limit, search })` → `?page=1&limit=10&search=angular` | ✅ | `src/url-utils.ts`, demo |
| **3. Middleware** `beforeRequest` / `afterResponse` / `onError`, типізовані | ✅ | `src/types.ts` (`Middleware`, `RequestContext`), `src/api-client.ts` |
| **4. Runtime validation** перевірка config перед запитом | ✅ | `ApiClient.validateRuntimeConfig`, `apiSchemaRuntime`, `ApiValidationError` |

Після `npm run demo` у терміналі з’являться блоки **URL & query builders**, **Runtime validation** (очікувані `ApiValidationError`) та логи **onError** middleware.

Що перевіряє runtime validation:

- обов’язкові `params` / `body` за схемою;
- заборона зайвих `query` / `body`;
- невідомі ключі в `params`;
- обов’язкові поля body (`name`, `email` для `POST /users`).

---

## Скріншоти для здачі (що саме показати)

За умовами завдання потрібні **три скріншоти**. Кожен доводить окрему вимогу: проєкт збирається, runtime працює, типи ловлять помилки.

### 1. Успішна компіляція `tsc`

**Що доводить:** у strict mode весь код (включно з `type-tests.ts`) компілюється без помилок.

**Як отримати стан для скріну:**

```bash
npm install
npm run build
```

`npm run build` запускає `tsc`. На скріні має бути видно:

- виконана команда `npm run build`;
- **немає** рядків `error TS...`;
- збірка завершилась успішно (порожній вивід після `> tsc` або лише службові рядки npm).

У репозиторії вже є `type-tests.ts` з `// @ts-expect-error`: поки ці директиви на місці, `tsc` проходить — саме це й показує цей скрін.

---

### 2. Успішний запуск demo

**Що доводить:** `ApiClient` працює в runtime — запити зі схеми, middleware, `buildUrl` / `buildQuery`, mock-відповіді.

**Як отримати стан для скріну:**

```bash
npm run demo
```

На скріні має бути видно:

- команда `npm run demo`;
- логи middleware (`→ GET /users?...`, `← ...`);
- фінальний блок **Demo results** з даними (`users`, `user`, `createdUser`, `patched`, `removed`);
- відсутність падіння процесу (немає stack trace / exit code 1).

Це відповідає прикладам з `src/demo.ts`: GET `/users` з query, GET `/users/:id` з params, POST, PATCH, DELETE.

---

### 3. Помилки типізації (перевірки з `@ts-expect-error`)

**Що доводить:** неправильні виклики **не проходять** перевірку типів — path, method, `params`, `query`, `body` жорстко прив’язані до схеми.

У `src/type-tests.ts` навмисно записані **невалідні** приклади. Над кожним стоїть `// @ts-expect-error`, щоб `tsc` ігнорував очікувану помилку і збірка проходила (скрін №1).

**Як отримати стан для скріну:** тимчасово приберіть кілька `// @ts-expect-error` і знову запустіть `npm run build`. TypeScript покаже реальні помилки — їх і знімайте.

Приклади з цього проєкту (блок `Invalid calls` у `type-tests.ts`):

| Без `@ts-expect-error` видно помилку | Чому |
|--------------------------------------|------|
| `client.request("/unknown", "GET", {})` | невідомий path |
| `client.request("/users", "DELETE", {})` | DELETE не описаний для `/users` |
| `RequestConfig` без `params` для `GET /users/:id` | обов’язкові params |
| `params: { userId: "123" }` замість `id` | невірний ключ param |
| `POST /users` без `body` | body обов’язковий |
| `GET /users` з `body` | body заборонений |
| `GET /users/:id` з `query` | query заборонений |

На скріні мають бути **конкретні `error TS...`** у терміналі або у панелі Problems у редакторі на цих рядках.

Після зйомки **поверніть** усі `// @ts-expect-error` і переконайтесь, що `npm run build` знову проходить без помилок — у GitHub здається саме така версія.

---

### Разом із скріншотами

- посилання на **GitHub-репозиторій**;
- цей **README** з описом;
- проєкт запускається командами з розділу «Команди» вище.

Скріни можна покласти в `screenshots/` і вказати посилання в README, наприклад: `screenshots/01-tsc-ok.png`, `02-demo-ok.png`, `03-type-errors.png`.
