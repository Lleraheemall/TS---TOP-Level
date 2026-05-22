import { buildQuery, buildUrl } from "./url-utils.js";
import type { RuntimeEndpointMeta } from "./api-schema.js";
import type {
  ApiSchemaDefinition,
  HttpMethod,
  Middleware,
  RequestConfig,
  RequestContext,
  ResponseOf,
  RuntimeRequestConfig,
} from "./types.js";

type RuntimeSchema = Record<
  string,
  Partial<Record<HttpMethod, RuntimeEndpointMeta>>
>;

export class ApiValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiValidationError";
  }
}

export class ApiClient<TSchema extends ApiSchemaDefinition = ApiSchemaDefinition> {
  private readonly middlewares: Middleware<TSchema>[] = [];

  constructor(private readonly runtimeSchema?: RuntimeSchema) {}

  use(middleware: Middleware<TSchema>): this {
    this.middlewares.push(middleware);
    return this;
  }

  async request<
    TPath extends keyof TSchema & string,
    TMethod extends keyof TSchema[TPath] & HttpMethod,
  >(
    path: TPath,
    method: TMethod,
    config: RequestConfig<TSchema, TPath, TMethod>,
  ): Promise<ResponseOf<TSchema, TPath, TMethod>> {
    const runtimeConfig = config as RuntimeRequestConfig;
    const ctx = {
      path,
      method,
      config,
      url: "",
    } as RequestContext<TSchema, TPath, TMethod>;

    try {
      this.validateRuntimeConfig(path, method, runtimeConfig);

      ctx.url =
        buildUrl(
          path,
          runtimeConfig.params as Parameters<typeof buildUrl<typeof path>>[1],
        ) + (runtimeConfig.query ? buildQuery(runtimeConfig.query) : "");

      for (const mw of this.middlewares) {
        await mw.beforeRequest?.(ctx);
      }

      const response = await this.executeRequest(
        ctx.url,
        method,
        runtimeConfig,
      ) as ResponseOf<TSchema, TPath, TMethod>;

      let finalResponse: ResponseOf<TSchema, TPath, TMethod> = response;
      for (const mw of this.middlewares) {
        const next = await mw.afterResponse?.(ctx, finalResponse);
        if (next !== undefined) {
          finalResponse = next;
        }
      }

      return finalResponse;
    } catch (error) {
      for (const mw of this.middlewares) {
        await mw.onError?.(ctx, error);
      }
      throw error;
    }
  }

  private validateRuntimeConfig<
    TPath extends keyof TSchema & string,
    TMethod extends keyof TSchema[TPath] & HttpMethod,
  >(
    path: TPath,
    method: TMethod,
    config: RuntimeRequestConfig,
  ): void {
    const def = this.runtimeSchema?.[path]?.[method as HttpMethod];

    if (!def) {
      return;
    }

    const templateKeys = [...path.matchAll(/:([A-Za-z0-9_]+)/g)]
      .map((match) => match[1])
      .filter((key): key is string => key !== undefined);

    if (def.params && !config.params) {
      throw new ApiValidationError(
        `Missing required params for ${String(method)} ${path}`,
      );
    }

    if (templateKeys.length > 0 && !config.params) {
      throw new ApiValidationError(
        `Missing required params for ${String(method)} ${path}`,
      );
    }

    if (config.params) {
      for (const key of templateKeys) {
        if (!(key in config.params)) {
          throw new ApiValidationError(
            `Missing URL param "${key}" for ${String(method)} ${path}`,
          );
        }
      }

      for (const key of Object.keys(config.params)) {
        if (!templateKeys.includes(key)) {
          throw new ApiValidationError(
            `Unknown param "${key}" for ${String(method)} ${path}`,
          );
        }
      }
    }

    if (!def.query && config.query !== undefined) {
      const hasQueryValues = Object.values(config.query).some(
        (value) => value !== undefined,
      );
      if (hasQueryValues) {
        throw new ApiValidationError(
          `Query is not allowed for ${String(method)} ${path}`,
        );
      }
    }

    if (def.body && !config.body) {
      throw new ApiValidationError(
        `Missing required body for ${String(method)} ${path}`,
      );
    }

    if (!def.body && config.body !== undefined) {
      throw new ApiValidationError(
        `Body is not allowed for ${String(method)} ${path}`,
      );
    }

    if (def.body && config.body && def.requiredBodyFields) {
      for (const field of def.requiredBodyFields) {
        if (!(field in config.body)) {
          throw new ApiValidationError(
            `Missing required body field "${field}" for ${String(method)} ${path}`,
          );
        }
      }
    }
  }

  private async executeRequest(
    url: string,
    method: HttpMethod,
    config: RuntimeRequestConfig,
  ): Promise<unknown> {
    const pathname = url.split("?")[0] ?? url;

    if (pathname === "/users" && method === "GET") {
      return [
        { id: 1, name: "Ann", email: "ann@mail.com" },
        { id: 2, name: "Bob", email: "bob@mail.com" },
      ];
    }

    if (pathname.startsWith("/users/") && method === "GET") {
      return { id: 123, name: "John", email: "john@example.com" };
    }

    if (pathname === "/users" && method === "POST") {
      return { id: 3, name: "John", email: "john@example.com" };
    }

    if (pathname.startsWith("/users/") && method === "PATCH") {
      return { id: 123, name: "John Updated", email: "john@example.com" };
    }

    if (pathname.startsWith("/users/") && method === "DELETE") {
      return { success: true };
    }

    return null;
  }
}

export function createApiClient<TSchema extends ApiSchemaDefinition>(
  runtimeSchema?: RuntimeSchema,
): ApiClient<TSchema> {
  return new ApiClient<TSchema>(runtimeSchema);
}
