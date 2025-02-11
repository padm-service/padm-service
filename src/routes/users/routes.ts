import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { sUser } from "@/db/schema";

const tags = ["User"];

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
