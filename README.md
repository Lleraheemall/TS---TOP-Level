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

## додаткове ускладнення

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

