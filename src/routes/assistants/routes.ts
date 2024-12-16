import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { iAssistant, iChat, iMsg, sAssistant, sChat, sMsg, uAssistant, uChat } from "@/db/schema";
import { notFoundSchema } from "@/lib/constants";
import { QueryInit, QueryMessage } from "@/lib/types";

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
    params: z.object({
      id: z.string(),
    }),
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
    params: z.object({
      id: z.string({ description: "assistant id" }),
    }),
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
    params: z.object({
      id: z.string({ description: "assistant id" }),
    }),
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
      assistantId: z.string({ description: "assistant id" }),
      chatId: z.string({ description: "chat id" }),
    }),
  },
  tags: chatTags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(sMsg),
      "The msg object",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdUUIDParamsSchema),
      "The validation error(s)",
    ),
  },
});

export const chatCreate = createRoute({
  path: "/assistants/{assistantId}/chats",
  method: "post",
  summary: "Create a chat",
  description: "Create a chat.",
  request: {
    params: z.object({
      assistantId: z.string({ description: "assistant id" }),
    }),
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
      assistantId: z.string({ description: "assistant id" }),
      chatId: z.string({ description: "chat id" }),
    }),
  },
  tags: chatTags,
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
export const chatList = createRoute({
  path: "/assistants/{id}/chats",
  method: "get",
  summary: "List chat",
  description: "List all assistant.",
  request: {
    params: z.object({
      id: z.string({ description: "assistant id" }),
    }),
  },
  tags: chatTags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(sAssistant),
      "The list of assistant.",
    ),
  },
});

export const chatQuery = createRoute({
  path: "/assistants/{assistantId}/chats/query",
  method: "post",
  summary: "Generate a chat",
  description: "Generate outputs with optional services or knowledge.",
  request: {
    params: z.object({
      assistantId: z.string({ description: "assistant id" }),
    }),
    body: jsonContentRequired(
      QueryInit,
      "query json param",
    ),
  },
  tags: chatTags,
  responses: {
    [HttpStatusCodes.OK]:
    {
      description: "chat Generate",
      content: {
        // "application/json": {
        //   schema: QueryMessage,
        // },
        "text/event-stream": {
          schema: QueryMessage,
        },
      },
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
export type ChatListRoute = typeof chatList;
export type ChatRemoveRoute = typeof chatRemove;
export type ChatGetRoute = typeof chatGet;
export type ChatQueryRoute = typeof chatQuery;
