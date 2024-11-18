import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdParamsSchema } from "stoker/openapi/schemas";

import { iService, sService, uService } from "@/db/schema";
import { notFoundSchema } from "@/lib/constants";

const tags = ["service"];

export const list = createRoute({
  path: "/services/list",
  method: "get",
  summary: "List service",
  description: "List all service.",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(sService),
      "The list of service.",
    ),
  },
});

export const create = createRoute({
  path: "/services",
  method: "post",
  summary: "Create an service",
  description: "Create an service.",
  request: {
    body: jsonContentRequired(
      iService,
      "create service",
    ),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      sService,
      "The  service object",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(iService),
      "The validation error(s)",
    ),
  },
});
export const remove = createRoute({
  path: "/services/{id}",
  method: "delete",
  summary: "delete a service",
  description: "delete a service.",
  request: {
    params: IdParamsSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]:
    {
      description: "service deleted",
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdParamsSchema),
      "The validation error(s)",
    ),
  },
});
export const patch = createRoute({
  path: "/services/{id}",
  method: "put",
  summary: "update an service",
  description: "update an service.",
  request: {
    params: IdParamsSchema,
    body: jsonContentRequired(
      uService,
      "The service updates",
    ),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      sService,
      "The service updated",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(uService)
        .or(createErrorSchema(IdParamsSchema)),
      "The validation error(s)",
    ),
  },
});
export const get = createRoute({
  path: "/services/{id}",
  method: "get",
  request: {
    params: IdParamsSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      sService,
      "The requested service",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdParamsSchema),
      "Invalid id error",
    ),
  },
});
export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type RemoveRoute = typeof remove;
export type PatchRoute = typeof patch;
export type GetRoute = typeof get;
