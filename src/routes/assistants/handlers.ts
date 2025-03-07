import type { MessageContent, MessageContentComplex, MessageFieldWithRole, MessageType } from "@langchain/core/messages";
import type { ToolDefinition } from "node_modules/@langchain/core/dist/language_models/base";
import { asc, eq } from "drizzle-orm";
import { streamSSE } from "hono/streaming";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import type { AppRouteHandler } from "@/lib/types";
import type { Imag } from "@/lib/types";
import { ChatZhipu, ZhipuAIEmbedding } from "@/lib/llm-config";
import { MilvusClients } from "@/lib/vector-config";
import db from "@/db";
import { Assistant, Chat, Msg, Services } from "@/db/schema";
// import { toolCall } from "@/lib/bigmodel";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/lib/constants";

import type { ChatCreateRoute, ChatGetRoute, ChatListRoute, ChatQueryRoute, ChatRemoveRoute, CreateRoute, GetRoute, ListRoute, MsgCreateRoute, PatchRoute, RemoveRoute } from "./routes";

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
  const { assistantId } = c.req.valid("param");
  const [chat] = await db.insert(Chat).values({
    ...init,
    userId,
    assistantId
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
export const chatList: AppRouteHandler<ChatListRoute> = async (c) => {
  const { assistantId } = c.req.valid("param");
  const chats = await db.query.Chat.findMany({
    where(fields, operators) {
      return operators.eq(fields.assistantId, assistantId);
    },
  })
  return c.json(chats);
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
export const msgCreate: AppRouteHandler<MsgCreateRoute> = async (c) => {
  const auth = c.get("auth");
  const { assistantId, chatId } = c.req.valid("param");;
  const init = c.req.valid("json");
  const userId = auth.user.id;
  const [msg] = await db.insert(Msg).values({
    ...init,
    userId,
    assistantId,
    chatId
  }).returning();
  return c.json(msg, HttpStatusCodes.OK);
};
// @ts-ignore
export const chatQuery: AppRouteHandler<ChatQueryRoute> = async (c) => {
  const init = c.req.valid("json");
  const auth = c.get("auth");
  const userId = auth.user.id;
  const { assistantId, chatId } = c.req.valid("param");
  const { service, knowledge, llm, retrieval } = init;
  ChatZhipu.model = llm.model;
  ChatZhipu.temperature = llm.temperature;
  ChatZhipu.topP = llm.top_p;
  const messagesdb = init.messages as MessageFieldWithRole[];
  const commonMes = { userId, assistantId, chatId };
  await db.insert(Msg).values({
    ...commonMes,
    content: messagesdb[messagesdb.length - 1].content,
    role: "user",
  })
  const messages = normalize_messages(init.messages as MessageFieldWithRole[]);
  if (
    llm.systemPrompt &&
    messages.length > 0 &&
    messages[0].role !== "system"
  ) {
    messages.unshift({
      role: "system",
      content: llm.systemPrompt,
    });
  }

  let tools: Array<ToolDefinition> | undefined | any;
  if (!retrieval) {
    const services = await db.transaction(async (tx) => {
      const services: any = [];
      service.forEach(async (serviceId) => {
        const singleService = await tx.query.Service.findFirst({
          where(fields, operators) {
            return operators.eq(fields.id, serviceId);
          },
        });
        services.push(singleService);
      })
      return services;
    });
    tools = [];
    for (const service of services) {
      for (const tool of service.tools) {
        tools.push(tool);
      }
    }
    const glmWithTools = ChatZhipu?.bindTools(tools);
    return streamSSE(c, async (stream) => {
      var tools: any = [];
      const res = await glmWithTools.stream(messages);
      for await (const chunk of res) {
        if (chunk?.tool_calls && chunk?.tool_calls?.length > 0) {
          tools.push(...chunk.tool_calls);
        }
      }
      if (tools) {
        for (const tool of tools) {
          const { name, arguments: args } = tool.function;
          var [service, endpoint] = name?.split("::") ?? [];
          const url = `${new URL(c.req.url).origin}/services/${service}/fetch${endpoint}`;
          console.log(url);
          const headers = new Headers(c.req.raw.headers);
          headers.delete('Content-Length');
          const req = new Request(url, {
            method: "POST",
            headers,
            body: args,
          });
          const body = await fetch(req).then(res => res.text());
          messages.push({
            tool_call_id: tool?.id ?? "",
            role: "tool",
            content: body,
          });
        }
        const res = await glmWithTools.stream(messages);
        let fullContent = '';
        for await (const chunk of res) {
          fullContent += chunk.content;
          if (chunk.response_metadata.finished === "stop") {
            await db.insert(Msg).values({
              ...commonMes,
              content: [{ type: 'text', text: fullContent }],
              role: "assistant",
            })
            return;
          }
          await stream.writeSSE({
            event: "message",
            data: JSON.stringify(chunk.content),
          });
        }
      }
    })
  };

  if (retrieval && knowledge) {
    // const knowledgeRes = await rag(messages[0].content as string, "collectionID", ["partitionIDs"], "prompt", "model") as any;
    const queryVector = await ZhipuAIEmbedding.embedQuery(messages[messages.length - 1].content as string);
    await MilvusClients.loadCollection({ collection_name: knowledge.collection });
    const res = await MilvusClients.search({
      collection_name: knowledge.collection,
      // partition_names: knowledge.partition,
      data: queryVector,
      limit: 3,
    });
    await MilvusClients.releaseCollection({ collection_name: knowledge.collection });
    let context = "";
    const images: Imag[] = [];
    for (const r of res.results) {
      if (r.image !== "") {
        images.push({
          image_text: r.langchain_text,
          image_url: r.image,
        });
      }
      else {
        context += r.langchain_text;
      }
    }

    const PROMPT_TEMPLATE = `
            使用<context>内的信息对<question>标记中包含的问题提供一个简明的答案。
            如果你不知道答案，就说你不知道，不要试图编造答案。
            <context>
            ${context}
            </context>
    
            <question>
            ${messages[messages.length - 1].content}
            </question>`;
    messages[messages.length - 1].content = PROMPT_TEMPLATE;
    return streamSSE(c, async (stream) => {
      const res = await ChatZhipu.stream(messages);
      let fullContent = '';
      for await (const chunk of res) {
        fullContent += chunk.content;
        if (chunk.response_metadata.finished === "stop") {
          await db.insert(Msg).values({
            ...commonMes,
            content: [{ type: 'text', text: fullContent }],
            role: "assistant",
          })
          return;
        }
        await stream.writeSSE({
          event: "message",
          data: JSON.stringify(chunk.content),
        });
        if (images) {
          await stream.writeSSE({
            event: "img",
            data: JSON.stringify(images),
          });
        }
      }
    })

  }
}
function normalize(cs: MessageContentComplex[]): string {
  let text = "";
  for (const c of cs) {
    switch (c.type) {
      case "text":
        text += c.text;
        break;
      case "file":
        text += `
图片链接：${c.file.url}
图片类型：${c.file.type}
图片大小：${c.file.size} 字节`;
        break;
    }
  }
  return text;
}

function normalize_messages(msgs: MessageFieldWithRole[]): MessageFieldWithRole[] {
  return msgs.map(({ role, content }) => ({
    role,
    content: normalize(content as MessageContentComplex[])
  }));
}