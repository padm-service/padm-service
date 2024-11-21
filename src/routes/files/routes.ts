import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { File, iFile, sFile, uFile } from "@/db/schema";
import { notFoundSchema } from "@/lib/constants";

const tags = ["file"];

export const preSignedUrl = createRoute({
  path: "/files/pre-signed-url",
  method: "post",
  summary: "Create a pre-signed URL",
  description: "Create a pre-signed URL",
  tags,
  request: {
    body: jsonContentRequired(
      iFile,
      "create pre-signed-file",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      uFile,
      "The  file object-key and url",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(iFile),
      "The validation error(s)",
    ),
  },
});

export const create = createRoute({
  method: "post",
  path: "/files",
  summary: "Create a file",
  description: "Create a file",
  tags,
  request: {
    body: jsonContentRequired(
      iFile,
      "The file info",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      sFile,
      "The file url and state",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(uFile),
      "The validation error(s)",
    ),
  },
});

export const remove = createRoute({
  method: "delete",
  path: "/files/{id}",
  summary: "Delete a file",
  description: "Delete a file",
  tags,
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]:
    {
      description: "file deleted",
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "File not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "The validation error(s)",
    ),
  },
});

export type PreSignedUrl = typeof preSignedUrl;
export type CreateRoute = typeof create;
export type RemoveRoute = typeof remove;
