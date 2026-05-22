export type User = {
  id: number;
  name: string;
  email: string;
};

export type ApiSchema = {
  "/users": {
    GET: {
      query: {
        page?: number;
        limit?: number;
      };
      response: User[];
    };
    POST: {
      body: {
        name: string;
        email: string;
      };
      response: User;
    };
  };
  "/users/:id": {
    GET: {
      params: {
        id: string;
      };
      response: User;
    };
    PATCH: {
      params: {
        id: string;
      };
      body: {
        name?: string;
        email?: string;
      };
      response: User;
    };
    DELETE: {
      params: {
        id: string;
      };
      response: {
        success: boolean;
      };
    };
  };
};

import type { HttpMethod } from "./types.js";

export type RuntimeEndpointMeta = {
  params: boolean;
  query: boolean;
  body: boolean;
  requiredBodyFields?: readonly string[];
};

/** Runtime metadata for validation (mirrors ApiSchema). */
export const apiSchemaRuntime: Record<
  string,
  Partial<Record<HttpMethod, RuntimeEndpointMeta>>
> = {
  "/users": {
    GET: { query: true, body: false, params: false },
    POST: {
      query: false,
      body: true,
      params: false,
      requiredBodyFields: ["name", "email"],
    },
  },
  "/users/:id": {
    GET: { query: false, body: false, params: true },
    PATCH: { query: false, body: true, params: true },
    DELETE: { query: false, body: false, params: true },
  },
};
