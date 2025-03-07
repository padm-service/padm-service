import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { sUser, uUser } from "@/db/schema";
import { notFoundSchema, errorSchema } from "@/lib/constants";
const tags = ["User"];


export const patch = createRoute({
  path: "/user",
  method: "put",
  summary: "update an user",
  description: "update an user.",
  request: {
    body: jsonContentRequired(z.object({
      updates: uUser,
      oldPass: z.string().optional()
    })
      ,
      "The service updates",
    ),
  },
  tags: tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      sUser,
      "The service updated",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      errorSchema,
      "The validation error(s)",
    ),
  },
});

export const get = createRoute({
  path: "/user",
  method: "get",
  summary: "Get the authenticated user",
  description: "Get the authenticated user.",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      sUser,
      "The user info.",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: {
      description: "The user no longer exists",
    }
  },
});
export type GetRoute = typeof get;
export type PatchRoute = typeof patch;