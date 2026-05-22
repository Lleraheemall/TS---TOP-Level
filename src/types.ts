/** HTTP methods supported by the API schema. */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Shape of a single method definition on an endpoint. */
export type EndpointMethod = {
  params?: Record<string, string | number>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: Record<string, unknown>;
  response: unknown;
};

/** Minimal schema shape constraint for ApiClient. */
export type ApiSchemaDefinition = Record<string, Record<string, EndpointMethod>>;

/** Flattens intersections for clearer editor tooltips. */
export type Prettify<T> = {
  [K in keyof T]: T[K];
};

/**
 * Extracts route param names from a path template.
 * @example ExtractRouteParams<"/users/:id/posts/:postId"> → { id: string; postId: string }
 */
export type ExtractRouteParams<Path extends string> = Path extends
  `${string}:${infer Param}/${infer Rest}`
  ? Prettify<{ [K in Param]: string } & ExtractRouteParams<`/${Rest}`>>
  : Path extends `${string}:${infer Param}`
    ? { [K in Param]: string }
    : {};

type HasRouteParams<Path extends string> = keyof ExtractRouteParams<Path> extends never
  ? false
  : true;

type EndpointDef<
  TSchema,
  TPath extends keyof TSchema & string,
  TMethod extends keyof TSchema[TPath] & string,
> = TSchema[TPath][TMethod];

/** Response type for a given path + method. */
export type ResponseOf<
  TSchema,
  TPath extends keyof TSchema & string,
  TMethod extends keyof TSchema[TPath] & string,
> = EndpointDef<TSchema, TPath, TMethod> extends { response: infer R }
  ? R
  : never;

/** Allowed HTTP methods for a path. */
export type MethodsOf<
  TSchema,
  TPath extends keyof TSchema & string,
> = keyof TSchema[TPath] & HttpMethod;

/** Paths that support a given HTTP method. */
export type PathsWithMethod<
  TSchema,
  TMethod extends HttpMethod,
> = {
  [P in keyof TSchema & string]: TMethod extends MethodsOf<TSchema, P>
    ? P
    : never;
}[keyof TSchema & string];

type ParamsPart<TPath extends string, Def> = Def extends { params: infer P }
  ? { params: P }
  : HasRouteParams<TPath> extends true
    ? { params: ExtractRouteParams<TPath> }
    : {};

type QueryPart<Def> = Def extends { query: infer Q } ? { query?: Q } : {};

type BodyPart<Def> = Def extends { body: infer B } ? { body: B } : {};

/**
 * Builds request config for an endpoint:
 * - `params` when declared in schema or present in the path template
 * - `query` only when declared
 * - `body` only when declared
 */
export type RequestConfig<
  TSchema,
  TPath extends keyof TSchema & string,
  TMethod extends keyof TSchema[TPath] & string,
> = Prettify<
  ParamsPart<TPath, EndpointDef<TSchema, TPath, TMethod>> &
    QueryPart<EndpointDef<TSchema, TPath, TMethod>> &
    BodyPart<EndpointDef<TSchema, TPath, TMethod>>
>;

/** Runtime config passed to ApiClient.request (may include headers). */
export type RuntimeRequestConfig = {
  params?: Record<string, string | number>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
};

/** Typed request context for a concrete path + method. */
export type RequestContext<
  TSchema,
  TPath extends keyof TSchema & string = keyof TSchema & string,
  TMethod extends keyof TSchema[TPath] & HttpMethod = keyof TSchema[TPath] &
    HttpMethod,
> = {
  path: TPath;
  method: TMethod;
  config: RequestConfig<TSchema, TPath, TMethod>;
  url: string;
};

/**
 * Middleware hooks are generic per request: path, method, config and response
 * are inferred from the schema.
 */
export type Middleware<TSchema extends ApiSchemaDefinition> = {
  beforeRequest?: <
    TPath extends keyof TSchema & string,
    TMethod extends keyof TSchema[TPath] & HttpMethod,
  >(
    ctx: RequestContext<TSchema, TPath, TMethod>,
  ) => void | Promise<void>;
  afterResponse?: <
    TPath extends keyof TSchema & string,
    TMethod extends keyof TSchema[TPath] & HttpMethod,
  >(
    ctx: RequestContext<TSchema, TPath, TMethod>,
    response: ResponseOf<TSchema, TPath, TMethod>,
  ) => ResponseOf<TSchema, TPath, TMethod> | Promise<ResponseOf<TSchema, TPath, TMethod>>;
  onError?: <
    TPath extends keyof TSchema & string,
    TMethod extends keyof TSchema[TPath] & HttpMethod,
  >(
    ctx: RequestContext<TSchema, TPath, TMethod>,
    error: unknown,
  ) => void | Promise<void>;
};
