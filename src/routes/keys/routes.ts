import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema,IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { iKey, sKey } from "@/db/schema";
import { notFoundSchema } from "@/lib/constants";

const tags = ["key"];

export const list = createRoute({
  path: "/key/list",
  method: "get",
  summary: "List keys",
  description: "List all keys.",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(sKey),
      "The list of keys.",
    ),
  },
});

export const create = createRoute({
  path: "/key",
  method: "post",
  summary: "Create a key",
  description: "Create a Key.",
  request: {
    body: jsonContentRequired(
      iKey,
      "create key",
    ),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.string(),
      "The Key object",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(iKey),
      "The validation error(s)",
    ),
  },
});
export const remove = createRoute({
  path: "/key/{id}",
  method: "delete",
  summary: "Revoke a key",
  description: "Revoke a key.",
  request: {
    params: IdUUIDParamsSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]:
    {
      description: "Key deleted",
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Key not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "The validation error(s)",
    ),
  },
});
export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type RemoveRoute = typeof remove;
