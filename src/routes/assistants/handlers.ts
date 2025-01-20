import type { MessageContentComplex, MessageFieldWithRole, MessageType } from "@langchain/core/messages";
import type { ToolDefinition } from "node_modules/@langchain/core/dist/language_models/base";

import { asc, eq } from "drizzle-orm";
import { SSEStreamingApi, streamSSE } from "hono/streaming";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/lib/types";

import db from "@/db";
import { Assistant, Chat, Msg } from "@/db/schema";
import { toolCall } from "@/lib/bigmodel";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/lib/constants";
import { rag } from "@/lib/rag";

import type { ChatCreateRoute, ChatGetRoute, ChatQueryRoute, ChatRemoveRoute, CreateRoute, GetRoute, ListRoute, PatchRoute, RemoveRoute } from "./routes";

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const auth = c.get("auth");
  const init = c.req.valid("json");
  const userId = auth.user.id;
  const [assistant] = await db.insert(Assistant).values({
    ...init,
    userId,
  }).returning();
  return c.json(assistant, HttpStatusCodes.OK);
};
export const get: AppRouteHandler<GetRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const assistant = await db.query.Assistant.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  });
  if (!assistant) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }
  return c.json(assistant, HttpStatusCodes.OK);
};

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const auth = c.get("auth");
  const assistants = await db.query.Assistant.findMany({
    where(fields, operators) {
      return operators.eq(fields.userId, auth.user.id);
    },
  },
  );
  return c.json(assistants);
};

export const patch: AppRouteHandler<PatchRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const updates = c.req.valid("json");

  if (Object.keys(updates).length === 0) {
    return c.json(
      {
        success: false,
        error: {
          issues: [
            {
              code: ZOD_ERROR_CODES.INVALID_UPDATES,
              path: [],
              message: ZOD_ERROR_MESSAGES.NO_UPDATES,
            },
          ],
          name: "ZodError",
        },
      },
      HttpStatusCodes.UNPROCESSABLE_ENTITY,
    );
  }

  const [assistant] = await db.update(Assistant)
    .set(updates)
    .where(eq(Assistant.id, id))
    .returning();

  if (!assistant) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(assistant, HttpStatusCodes.OK);
};
export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const { id } = c.req.valid("param");
  await db.transaction(async (tx) => {
    const result = await db.delete(Assistant).where(
      eq(Assistant.id, id),
    );
    await tx.delete(Chat).where(
      eq(Chat.assistantId, id),
    );
    await tx.delete(Msg).where(
      eq(Msg.assistantId, id),
    );
    if (result.rowsAffected === 0) {
      return c.json(
        {
          message: HttpStatusPhrases.NOT_FOUND,
        },
        HttpStatusCodes.NOT_FOUND,
      );
    }
  });
  return c.body(null, HttpStatusCodes.NO_CONTENT);
};

export const chatCreate: AppRouteHandler<ChatCreateRoute> = async (c) => {
  const auth = c.get("auth");
  const init = c.req.valid("json");
  const userId = auth.user.id;
  const [chat] = await db.insert(Chat).values({
    ...init,
    userId,
  }).returning();
  return c.json(chat, HttpStatusCodes.OK);
};

export const chatGet: AppRouteHandler<ChatGetRoute> = async (c) => {
  const { chatId } = c.req.valid("param");
  const msg = await db.query.Msg.findMany({
    where(fields, operators) {
      return operators.eq(fields.chatId, chatId);
    },
    orderBy: [asc(Msg.created_at)],
  });
  return c.json(msg, HttpStatusCodes.OK);
};

export const chatRemove: AppRouteHandler<ChatRemoveRoute> = async (c) => {
  const { chatId } = c.req.valid("param");

  await db.transaction(async (tx) => {
    const result1 = await tx.delete(Chat).where(
      eq(Chat.id, chatId),
    );
    const result2 = await tx.delete(Msg).where(
      eq(Msg.chatId, chatId),
    );
    if (result1.rowsAffected === 0 && result2.rowsAffected === 0) {
      return c.json(
        {
          message: HttpStatusPhrases.NOT_FOUND,
        },
        HttpStatusCodes.NOT_FOUND,
      );
    }
  });
  return c.body(null, HttpStatusCodes.NO_CONTENT);
};

// @ts-ignore
export const chatQuery: AppRouteHandler<ChatQueryRoute> = async (c) => {
  const init = c.req.valid("json");
  const { service, knowledge, llm, retrieval } = init;
  const messages = init.messages as MessageFieldWithRole[];
  let tools: Array<ToolDefinition> | undefined | any;
  const systemContent = {
    role: "system",
    content: "",
  };
  let image = [];
  if (!retrieval) {
    const services = await db.transaction(async (tx) => {
      const services = [];
      for (const serviceId in service) {
        const singleService = await tx.query.Service.findFirst({
          where(fields, operators) {
            return operators.eq(fields.id, serviceId);
          },
        });
        services.push(singleService);
      }
      return services;
    });
    tools = [];
    services.forEach((service) => {
      (service?.tools as ToolDefinition[]).forEach((tool) => {
        tools?.push(tool);
      });
    });

    if (llm.system_prompt
      && messages.length > 0
      && messages[0].role !== "system") {
      messages.unshift({
        role: "system",
        content: llm.system_prompt,
      });
    }
    systemContent.content = await toolCall("glm-4-air", 1, messages, tools);
  }

  if (retrieval && knowledge) {
    const knowledgeRes = await rag(messages[0].content as string, "collectionID", ["partitionIDs"], "prompt", "model") as any;
    systemContent.content = knowledgeRes.message;
    image = knowledgeRes.images;
  }

  // const messages = normalize_messages(init.messages);
  return streamSSE(c, async (stream) => {
    await stream.writeSSE({
      event: "message",
      data: JSON.stringify(systemContent),
    });
  });
};
