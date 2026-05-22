# Завдання: Type-Safe API Client Generator на TypeScript (Very Hard)

## 📝 Опис

Потрібно реалізувати типобезпечний API client generator на TypeScript.

Ідея: є об’єкт зі схемою API endpoint’ів. На основі цієї схеми TypeScript повинен автоматично виводити:

- які endpoint’и існують
- який HTTP method дозволений
- які `params`, `query`, `body` потрібні
- який тип відповіді повертається
- які поля обов’язкові, а які ні

Основна складність — більша частина перевірок має виконуватись на рівні TypeScript типів, ще до запуску коду.

---

## 🎯 Ціль

- Поглибити розуміння advanced TypeScript
- Навчитись будувати типобезпечні API-абстракції
- Попрацювати з type-level programming
- Використати `infer`, conditional types, mapped types, indexed access types
- Навчитись проєктувати API, яке складно використати неправильно

---

## 🧩 Початкова ідея

Потрібно описати API-схему такого типу:

```ts
type ApiSchema = {
  "/users": {
    GET: {
      query: {
        page?: number
        limit?: number
      }
      response: {
        id: number
        name: string
        email: string
      }[]
    }

    POST: {
      body: {
        name: string
        email: string
      }
      response: {
        id: number
        name: string
        email: string
      }
    }
  }

  "/users/:id": {
    GET: {
      params: {
        id: string
      }
      response: {
        id: number
        name: string
        email: string
      }
    }

    PATCH: {
      params: {
        id: string
      }
      body: {
        name?: string
        email?: string
      }
      response: {
        id: number
        name: string
        email: string
      }
    }

    DELETE: {
      params: {
        id: string
      }
      response: {
        success: boolean
      }
    }
  }
}
```

---

## ⚙️ Що потрібно зробити

### 1. Описати базові типи

Створити типи для:

- HTTP методів
- API endpoint’ів
- параметрів маршруту
- query параметрів
- body
- response

---

### 2. Створити generic `ApiClient`

Реалізувати клас або функцію:

```ts
class ApiClient<TSchema> {
  request(...)
}
```

або

```ts
createApiClient<TSchema>()
```

---

### 3. Реалізувати метод `request`

Метод повинен приймати:

- path
- method
- config

Приклад очікуваного використання:

```ts
const client = createApiClient<ApiSchema>()

const users = await client.request("/users", "GET", {
  query: {
    page: 1,
    limit: 10
  }
})

const user = await client.request("/users/:id", "GET", {
  params: {
    id: "123"
  }
})

const createdUser = await client.request("/users", "POST", {
  body: {
    name: "John",
    email: "john@example.com"
  }
})
```

---

## 🧠 TypeScript-вимоги

### 1. Path має бути строго типізований

Має працювати:

```ts
client.request("/users", "GET", {})
client.request("/users/:id", "GET", { params: { id: "1" } })
```

Має НЕ компілюватись:

```ts
client.request("/unknown", "GET", {})
```

---

### 2. Method має залежати від path

Має працювати:

```ts
client.request("/users", "GET", {})
client.request("/users", "POST", { body: { name: "Ann", email: "ann@mail.com" } })
```

Має НЕ компілюватись:

```ts
client.request("/users", "DELETE", {})
```

---

### 3. Config має залежати від endpoint’а

Якщо endpoint має `params`, їх потрібно передати.

Має працювати:

```ts
client.request("/users/:id", "GET", {
  params: {
    id: "123"
  }
})
```

Має НЕ компілюватись:

```ts
client.request("/users/:id", "GET", {})
```

---

### 4. Body має бути потрібним тільки там, де він описаний

Має працювати:

```ts
client.request("/users", "POST", {
  body: {
    name: "John",
    email: "john@example.com"
  }
})
```

Має НЕ компілюватись:

```ts
client.request("/users", "POST", {})
```

Має НЕ компілюватись:

```ts
client.request("/users", "GET", {
  body: {
    name: "John"
  }
})
```

---

### 5. Query має бути дозволеним тільки там, де він описаний

Має працювати:

```ts
client.request("/users", "GET", {
  query: {
    page: 1
  }
})
```

Має НЕ компілюватись:

```ts
client.request("/users/:id", "GET", {
  query: {
    page: 1
  }
})
```

---

### 6. Response має автоматично виводитись

TypeScript повинен сам розуміти тип відповіді:

```ts
const users = await client.request("/users", "GET", {
  query: {
    page: 1
  }
})

// users має бути типом:
// {
//   id: number
//   name: string
//   email: string
// }[]
```

---

## 🔥 Advanced частина

### 1. Реалізувати тип `ExtractRouteParams`

Створити тип, який автоматично витягує параметри з route string.

Наприклад:

```ts
type Params = ExtractRouteParams<"/users/:id/posts/:postId">
```

Очікуваний результат:

```ts
{
  id: string
  postId: string
}
```

---

### 2. Перевіряти відповідність path і params

Якщо path містить `:id`, config повинен містити `params.id`.

Має НЕ компілюватись:

```ts
client.request("/users/:id", "GET", {
  params: {
    userId: "123"
  }
})
```

---

### 3. Реалізувати тип `RequestConfig`

Створити тип, який автоматично збирає config залежно від endpoint’а:

- якщо є `params` — додати `params`
- якщо є `query` — додати `query`
- якщо є `body` — додати `body`
- якщо нічого немає — config може бути порожнім об’єктом

---

### 4. Реалізувати тип `ResponseOf`

Створити тип, який повертає response для конкретного path + method.

```ts
type UserResponse = ResponseOf<ApiSchema, "/users/:id", "GET">
```

---

### 5. Реалізувати тип `MethodsOf`

Створити тип, який повертає доступні методи для конкретного path.

```ts
type UserMethods = MethodsOf<ApiSchema, "/users">
```

Очікувано:

```ts
"GET" | "POST"
```

---

### 6. Реалізувати тип `PathsWithMethod`

Створити тип, який повертає тільки ті path, які підтримують конкретний method.

```ts
type PostPaths = PathsWithMethod<ApiSchema, "POST">
```

Очікувано:

```ts
"/users"
```

---

## 🧪 Type Tests

Потрібно додати файл з type tests.

Можна використати:

```ts
// @ts-expect-error
```

Приклад:

```ts
// має бути OK
client.request("/users", "GET", {
  query: {
    page: 1
  }
})

// @ts-expect-error DELETE не існує для /users
client.request("/users", "DELETE", {})

// @ts-expect-error body не дозволений для GET /users
client.request("/users", "GET", {
  body: {
    name: "John"
  }
})
```

---

## 📌 Умови

- Заборонено використовувати `any`
- Заборонено використовувати `as unknown as`
- Дозволено використовувати `unknown`, якщо це обґрунтовано
- Обов’язково використати:
  - generics
  - generic constraints
  - `keyof`
  - indexed access types
  - mapped types
  - conditional types
  - `infer`
  - template literal types
  - utility types
- Рішення має компілюватись у strict mode
- `tsconfig.json` повинен містити:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

---

## 🧱 Структура проєкту

Рекомендована структура:

```txt
src/
  api-schema.ts
  api-client.ts
  types.ts
  demo.ts
  type-tests.ts
```

---

## 📤 Результат

Після виконання:

- Реалізовано типобезпечний API client
- Endpoint’и, methods, config і response строго типізовані
- Неправильні виклики ловляться TypeScript на етапі компіляції
- Є демонстрація коректного використання
- Є type tests з `@ts-expect-error`
- Код виглядає як основа для реальної internal library

---

## 📸 Умови здачі

- Посилання на GitHub репозиторій
- Окремий TypeScript-проєкт
- Додати скріншоти:
  - успішного запуску demo
  - успішної компіляції `tsc`
  - помилок типізації через `@ts-expect-error`
- Додати короткий опис у `README.md`
- Проєкт повинен запускатись командами:

```bash
npm install
npm run build
npm run demo
```

---

## ⭐ Додаткове ускладнення

Цей блок необов’язковий, але дає можливість отримати максимальний бал.

### 1. URL builder

Реалізувати метод, який замінює route params у URL:

```ts
buildUrl("/users/:id/posts/:postId", {
  id: "1",
  postId: "10"
})
```

Результат:

```txt
/users/1/posts/10
```

---

### 2. Query string builder

Реалізувати побудову query string:

```ts
buildQuery({
  page: 1,
  limit: 10,
  search: "angular"
})
```

Результат:

```txt
?page=1&limit=10&search=angular
```

---

### 3. Middleware

Додати middleware-механізм:

- before request
- after response
- on error

Middleware також мають бути типізовані.

---

### 4. Runtime validation

Додати базову runtime-перевірку config перед виконанням запиту.

---

## 📚 Корисні матеріали

- TypeScript Generics:  
  https://www.typescriptlang.org/docs/handbook/2/generics.html

- Conditional Types:  
  https://www.typescriptlang.org/docs/handbook/2/conditional-types.html

- Mapped Types:  
  https://www.typescriptlang.org/docs/handbook/2/mapped-types.html

- Template Literal Types:  
  https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html

- Indexed Access Types:  
  https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html

- keyof Types:  
  https://www.typescriptlang.org/docs/handbook/2/keyof-types.html

- TypeScript Utility Types:  
  https://www.typescriptlang.org/docs/handbook/utility-types.html

- ts-expect-error:  
  https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html
