import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdParamsSchema } from "stoker/openapi/schemas";

import { insertUser } from "@/db/schema";
import { confilctSchema, errorSchema } from "@/lib/constants";
import { zToken } from "@/lib/types";

const tags = ["iam"];

export const register = createRoute({
  path: "/iam/register",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(
      insertUser,
      "create account",
    ),
  },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: {
      description: "register success",
    },
    [HttpStatusCodes.CONFLICT]: jsonContent(
      confilctSchema,
      "email confilct",
    ),
  },
});

export const login = createRoute({
  path: "/iam/login",
  method: "post",
  request: {
    body: jsonContentRequired(
      insertUser,
      "account check",
    ),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zToken,
      "login success",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      errorSchema,
      "secret error or No user",
    ),
  },
});
export type RegisterRoute = typeof register;
export type LoginRoute = typeof login;
