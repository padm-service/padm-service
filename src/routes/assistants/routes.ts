import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { iAssistant, iChat, sAssistant, sChat, uAssistant, uChat } from "@/db/schema";
import { notFoundSchema } from "@/lib/constants";

const assTags = ["assistant"];
const chatTags = ["chat"];

export const list = createRoute({
  path: "/assistants",
  method: "get",
  summary: "List assistant",
  description: "List all assistant.",
  tags: assTags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(sAssistant),
      "The list of assistant.",
    ),
  },
});

export const create = createRoute({
  path: "/assistants",
  method: "post",
  summary: "Create an assistant",
  description: "Create an assistant.",
  request: {
    body: jsonContentRequired(
      iAssistant,
      "create assistant",
    ),
  },
  tags: assTags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      sAssistant,
      "The assistant object",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(iAssistant),
      "The validation error(s)",
    ),
  },
});
export const remove = createRoute({
  path: "/assistants/{id}",
  method: "delete",
  summary: "delete an assistant",
  description: "delete an assistant.",
  request: {
    params: IdUUIDParamsSchema,
  },
  tags: assTags,
  responses: {
    [HttpStatusCodes.OK]:
    {
      description: "assistant deleted",
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Assistant not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "The validation error(s)",
    ),
  },
});
export const patch = createRoute({
  path: "/assistants/{id}",
  method: "put",
  summary: "update an assistant",
  description: "update an assistant.",
  request: {
    params: IdUUIDParamsSchema,
    body: jsonContentRequired(
      uAssistant,
      "The assistant updates",
    ),
  },
  tags: assTags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      sAssistant,
      "The assistant updated",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Assistant not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(uAssistant)
        .or(createErrorSchema(IdUUIDParamsSchema)),
      "The validation error(s)",
    ),
  },
});
export const get = createRoute({
  path: "/assistants/{id}",
  method: "get",
  request: {
    params: IdUUIDParamsSchema,
  },
  tags: assTags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      sAssistant,
      "The requested assistant",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Assistant not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "Invalid id error",
    ),
  },
});

export const chatGet = createRoute({
  path: "/assistants/{assistantId}/chats/{chatId}",
  method: "get",
  summary: "Get a chat",
  description: "Get a chat.",
  request: {
    params: z.object({
      assistantId: z.string(),
      chatId: z.string(),
    }),
  },
  tags: chatTags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      sChat,
      "The chat object",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(iAssistant),
      "The validation error(s)",
    ),
  },
});

export const chatCreate = createRoute({
  path: "/assistants/{id}/chats",
  method: "post",
  summary: "Create a chat",
  description: "Create a chat.",
  request: {
    body: jsonContentRequired(
      iChat,
      "create assistant",
    ),
  },
  tags: chatTags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      sChat,
      "The assistant object",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(iChat),
      "The validation error(s)",
    ),
  },
});
export const chatRemove = createRoute({
  path: "/assistants/{assistantId}/chats/{chatId}",
  method: "delete",
  summary: "delete a chat",
  description: "delete a chat.",
  request: {
    params: z.object({
      assistantId: z.string(),
      chatId: z.string(),
    }),
  },
  tags: assTags,
  responses: {
    [HttpStatusCodes.OK]:
    {
      description: "chat deleted",
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Chat not found",
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
export type PatchRoute = typeof patch;
export type GetRoute = typeof get;
export type ChatCreateRoute = typeof chatCreate;
// export type ChatListRoute = typeof chatList;
export type ChatRemoveRoute = typeof chatRemove;
export type ChatGetRoute = typeof chatGet;
