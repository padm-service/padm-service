import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { iBill, sBill } from "@/db/schema";
const tags = ["bill"];

export const get = createRoute({
  path: "/bill/user/{userId}",
  method: "get",
  summary: "获取用户的所有账单",
  description: "List all bills.",
  request: {
    params:z.object({
          userId: z.string(),
    }),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(sBill),
      "The list of bills.",
    ),
  },
});

export type GetRoute = typeof get;