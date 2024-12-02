import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { iNode, iService, sNode, sService, uNode, uService } from "@/db/schema";
import { notFoundSchema } from "@/lib/constants";

const serviceTags = ["service"];
const nodeTags = ["node"];
export const list = createRoute({
  path: "/services",
  method: "get",
  summary: "List service",
  description: "List all service.",
  tags: serviceTags,
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
  tags: serviceTags,
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
    params: z.object({
      id: z.string(),
    }),
  },
  tags: serviceTags,
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
      createErrorSchema(IdUUIDParamsSchema),
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
    params: z.object({
      id: z.string(),
    }),
    body: jsonContentRequired(
      uService,
      "The service updates",
    ),
  },
  tags: serviceTags,
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
        .or(createErrorSchema(IdUUIDParamsSchema)),
      "The validation error(s)",
    ),
  },
});

export const get = createRoute({
  path: "/services/{id}",
  method: "get",
  summary: "get a service",
  description: "get a service.",
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  tags: serviceTags,
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
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid id error",
    ),
  },
});

export const nodeList = createRoute({
  path: "/services/{id}/nodes",
  method: "get",
  summary: "List nodes",
  description: "List all node.",
  tags: nodeTags,
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(sNode),
      "The list of node.",
    ),
  },
});

export const nodeCreate = createRoute({
  path: "/services/{id}/nodes",
  method: "post",
  summary: "Create an node",
  description: "Create an node.",
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: jsonContentRequired(
      iNode,
      "create node",
    ),
  },
  tags: nodeTags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      sNode,
      "The  node object",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(iNode),
      "The validation error(s)",
    ),
  },
});
export const nodeRemove = createRoute({
  path: "/services/{serviceId}/nodes/{nodeId}",
  method: "delete",
  summary: "delete a node",
  description: "delete a node.",
  request: {
    params: z.object({
      serviceId: z.string({ description: "service ID" }),
      nodeId: z.string({ description: "node ID." }),
    }),
  },
  tags: nodeTags,
  responses: {
    [HttpStatusCodes.OK]:
    {
      description: "node deleted",
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Node not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "The validation error(s)",
    ),
  },
});
export const nodePatch = createRoute({
  path: "/services/{serviceId}/nodes/{nodeId}",
  method: "put",
  summary: "update a node",
  description: "update a node.",
  request: {
    params: z.object({
      serviceId: z.string({ description: "service ID" }),
      nodeId: z.string({ description: "node ID." }),
    }),
    body: jsonContentRequired(
      uNode,
      "The node updates",
    ),
  },
  tags: nodeTags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      sNode,
      "The node updated",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Node not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(uNode)
        .or(createErrorSchema(IdUUIDParamsSchema)),
      "The validation error(s)",
    ),
  },
});
export const nodeGet = createRoute({
  path: "/services/{serviceId}/nodes/{nodeId}",
  method: "get",
  summary: "get a node",
  description: "get a node.",
  request: {
    params: z.object({
      serviceId: z.string({ description: "service ID" }),
      nodeId: z.string({ description: "node ID." }),
    }),
  },
  tags: nodeTags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      sNode,
      "The requested node",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Node not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid id error",
    ),
  },
});

export const getSchema = createRoute({
  method: "get",
  path: "/services/{id}/schema",
  summary: "Get a service schema",
  description: "Get a service schema you have ownership or verfied access to.",
  serviceTags,
  request: {
    params: z.object({
      id: z.string({ description: "service Id" }),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({}, { description: "OpenAPI v3.0.3 object." }),
      "The OpenAPI v3.0.0 schema object.",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid id error",
    ),
  },
});
export const getReadme = createRoute({
  method: "get",
  path: "/services/{id}/readme",
  summary: "Get a service readme",
  description: "Get a service readme you have ownership or verfied access to.",
  serviceTags,
  request: {
    params: z.object({
      id: z.string({ description: "service Id" }),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      description: "The service readme in Markdown format.",
      content: {
        "text/plain": {
          schema: z.string({ description: "Service README in plain text." }),
        },
      },
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid id error",
    ),
  },
});
export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type RemoveRoute = typeof remove;
export type PatchRoute = typeof patch;
export type GetRoute = typeof get;
export type NodeListRoute = typeof nodeList;
export type NodeCreateRoute = typeof nodeCreate;
export type NodeRemoveRoute = typeof nodeRemove;
export type NodePatchRoute = typeof nodePatch;
export type NodeGetRoute = typeof nodeGet;
export type GetSchemaRoute = typeof getSchema;
export type GetReadmeRoute = typeof getReadme;
