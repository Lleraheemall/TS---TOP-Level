import { ApiValidationError, createApiClient } from "./api-client.js";
import { apiSchemaRuntime, type ApiSchema } from "./api-schema.js";
import type {
  ExtractRouteParams,
  MethodsOf,
  PathsWithMethod,
  ResponseOf,
} from "./types.js";
import { buildQuery, buildUrl } from "./url-utils.js";

async function runValidationDemo(client: ReturnType<typeof createApiClient<ApiSchema>>): Promise<void> {
  console.log("\n--- Runtime validation (bonus) ---");

  const cases: Array<{ label: string; run: () => Promise<unknown> }> = [
    {
      label: "POST /users without body",
      run: () => client.request("/users", "POST", {} as { body: { name: string; email: string } }),
    },
    {
      label: "GET /users/:id without params",
      run: () => client.request("/users/:id", "GET", {} as { params: { id: string } }),
    },
    {
      label: "GET /users/:id with forbidden query",
      run: () =>
        client.request("/users/:id", "GET", {
          params: { id: "1" },
          query: { page: 1 },
        } as { params: { id: string } }),
    },
  ];

  for (const { label, run } of cases) {
    try {
      await run();
      console.log(`✗ ${label}: expected ApiValidationError`);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        console.log(`✓ ${label}: ${error.message}`);
      } else {
        throw error;
      }
    }
  }
}

async function main(): Promise<void> {
  const client = createApiClient<ApiSchema>(apiSchemaRuntime);

  client.use({
    beforeRequest: (ctx) => {
      console.log(`→ ${ctx.method} ${ctx.url}`);
    },
    afterResponse: (ctx, response) => {
      console.log(`← ${ctx.method} ${ctx.url}`, response);
      return response;
    },
    onError: (ctx, error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`✗ ${ctx.method} ${ctx.path}: ${message}`);
    },
  });

  console.log("--- URL & query builders (bonus) ---");
  console.log(
    "buildUrl:",
    buildUrl("/users/:id/posts/:postId", { id: "1", postId: "10" }),
  );
  console.log(
    "buildQuery:",
    buildQuery({ page: 1, limit: 10, search: "angular" }),
  );

  const users = await client.request("/users", "GET", {
    query: { page: 1, limit: 10 },
  });

  const user = await client.request("/users/:id", "GET", {
    params: { id: "123" },
  });

  const createdUser = await client.request("/users", "POST", {
    body: { name: "John", email: "john@example.com" },
  });

  const patched = await client.request("/users/:id", "PATCH", {
    params: { id: "123" },
    body: { name: "John Updated" },
  });

  const removed = await client.request("/users/:id", "DELETE", {
    params: { id: "123" },
  });

  await runValidationDemo(client);

  console.log("\n--- Type-level utilities (compile-time only) ---");
  type _RouteParams = ExtractRouteParams<"/users/:id/posts/:postId">;
  type _UserResponse = ResponseOf<ApiSchema, "/users/:id", "GET">;
  type _UserMethods = MethodsOf<ApiSchema, "/users">;
  type _PostPaths = PathsWithMethod<ApiSchema, "POST">;

  const _methodsCheck: _UserMethods = "GET";
  const _pathsCheck: _PostPaths = "/users";

  console.log("\nDemo results:");
  console.log({ users, user, createdUser, patched, removed });
  void _methodsCheck;
  void _pathsCheck;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
