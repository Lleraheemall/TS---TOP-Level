import { createApiClient } from "./api-client.js";
import { apiSchemaRuntime, type ApiSchema } from "./api-schema.js";
import type {
  ExtractRouteParams,
  MethodsOf,
  PathsWithMethod,
  ResponseOf,
} from "./types.js";

const client = createApiClient<ApiSchema>(apiSchemaRuntime);

// --- Valid calls ---

const users = client.request("/users", "GET", {
  query: { page: 1 },
});

void users;

client.request("/users", "GET", {});

client.request("/users/:id", "GET", {
  params: { id: "123" },
});

client.request("/users", "POST", {
  body: { name: "John", email: "john@example.com" },
});

// --- ExtractRouteParams ---

type RouteParams = ExtractRouteParams<"/users/:id/posts/:postId">;
const _routeParams: RouteParams = { id: "1", postId: "10" };
void _routeParams;

// --- ResponseOf / MethodsOf / PathsWithMethod ---

type UserResponse = ResponseOf<ApiSchema, "/users/:id", "GET">;
const _userResponse: UserResponse = { id: 1, name: "A", email: "a@b.c" };
void _userResponse;

type UserMethods = MethodsOf<ApiSchema, "/users">;
const _getMethod: UserMethods = "GET";
void _getMethod;

type PostPaths = PathsWithMethod<ApiSchema, "POST">;
const _postPath: PostPaths = "/users";
void _postPath;

// --- Invalid calls (@ts-expect-error) ---

// @ts-expect-error unknown path
client.request("/unknown", "GET", {});

// @ts-expect-error DELETE is not defined for /users
client.request("/users", "DELETE", {});

// @ts-expect-error missing required params
const _missingParams: import("./types.js").RequestConfig<
  ApiSchema,
  "/users/:id",
  "GET"
> = {};

const _wrongParam: import("./types.js").RequestConfig<
  ApiSchema,
  "/users/:id",
  "GET"
> = {
  params: {
    // @ts-expect-error wrong param key
    userId: "123",
  },
};

// @ts-expect-error body is required for POST /users
const _missingBody: import("./types.js").RequestConfig<
  ApiSchema,
  "/users",
  "POST"
> = {};

const _extraBody: import("./types.js").RequestConfig<ApiSchema, "/users", "GET"> =
  {
    // @ts-expect-error body is not allowed for GET /users
    body: {
      name: "John",
    },
  };

const _extraQuery: import("./types.js").RequestConfig<
  ApiSchema,
  "/users/:id",
  "GET"
> = {
  // @ts-expect-error query is not allowed for GET /users/:id
  query: {
    page: 1,
  },
};

void _missingParams;
void _wrongParam;
void _missingBody;
void _extraBody;
void _extraQuery;

// @ts-expect-error missing params on request()
client.request("/users/:id", "GET", {});

// @ts-expect-error body required on request()
client.request("/users", "POST", {});
