import type { MessageContent, MessageContentComplex, MessageFieldWithRole, MessageType } from "@langchain/core/messages";
import type { ToolDefinition } from "node_modules/@langchain/core/dist/language_models/base";
import { asc, eq, or } from "drizzle-orm";
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
      return or(operators.eq(fields.userId, auth.user.id),operators.eq(fields.level,-1));
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
  const auth = c.get("auth");
  const { assistantId } = c.req.valid("param");
  const chats = await db.query.Chat.findMany({
    where(fields, operators) {
      return operators.and(
        operators.eq(fields.assistantId, assistantId),
        operators.eq(fields.userId, auth.user.id)
      )
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
// @ts-ignore
export const chatQuery: AppRouteHandler<ChatQueryRoute> = async (c) => {
  const init = c.req.valid("json");
  console.log("ChatQuery Init:", init);
  const auth = c.get("auth");
  const userId = auth.user.id;
  const { service: service_ids, knowledge, llm, options } = init;
  const retrieval = options?.retrieval ?? false;
  
  // 设置模型参数
  ChatZhipu.model = llm.model;
  ChatZhipu.temperature = llm.temperature;
  ChatZhipu.topP = llm.top_p;
  
  // 处理消息
  // const messagesdb = init.messages as MessageFieldWithRole[];
  const messages = normalize_messages(init.messages as MessageFieldWithRole[]);
  console.log("Normalized messages:", messages,messages.length);
  
  // 添加系统提示
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

  // 非检索模式：加载服务工具
  if (!retrieval && service_ids && service_ids.length > 0) {
    const services = await db.transaction(async (tx) => {
      const results: any = [];
      // 注意：forEach 中的 async 不会等待，改用 for...of
      for (const serviceId of service_ids) {
        const singleService = await tx.query.Service.findFirst({
          where(fields, operators) {
            return operators.eq(fields.id, serviceId);
          },
        });
        if (singleService) {
          results.push(singleService);
        }
      }
      return results;
    });
    
    tools = [];
    for (const service of services) {
      if (service.tools) {
        for (const tool of service.tools) {
          tools.push(tool);
        }
      }
    }
    
    const glmWithTools = ChatZhipu?.bindTools(tools);
    console.log("GLM with Tools:", glmWithTools);
    return streamSSE(c, async (stream) => {
      const collectedTools: any = [];
      let hasToolCall = false;
      let normalContent = '';
      console.log("Starting stream with tools, initial messages:", messages);
      const res = await glmWithTools.stream(messages);
      console.log("res：",res);
      
      // 收集所有 tool_calls
      for await (const chunk of res) {
          if (chunk?.tool_calls?.length) {
            hasToolCall = true;
            collectedTools.push(...chunk.tool_calls);
            continue;
        }
          if (!hasToolCall && chunk?.content) {
            await stream.writeSSE({
              event: "message",
              data: JSON.stringify({ content: chunk.content }),
           });
        } 
      }
      console.log("Collected tools:", collectedTools);
      if (collectedTools.length === 0) {
        return;
      }
      // 执行工具调用
      if (collectedTools.length > 0) {
        for (const tool of collectedTools) {
          const { name, arguments: args } = tool.function;
          const [serviceName, endpoint] = name?.split("::") ?? [];
          const url = `${new URL(c.req.url).origin}/services/${serviceName}/fetch${endpoint}`;
          
          console.log("Tool call URL:", url);
          
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
          console.log("Updated messages after tool call:", messages); 
        }
        
        // 第二次流式调用获取最终回复
        const finalRes = await glmWithTools.stream(messages);
        let fullContent = '';
        
        for await (const chunk of finalRes) {
          fullContent += chunk.content;
          if (chunk.response_metadata?.finished === "stop") {
            break;
          }
          await stream.writeSSE({
            event: "message",
            data: JSON.stringify({ content: chunk.content }),
          });
        }
        console.log("fullcontent:",fullContent);
      }
    });
  }

  // 检索模式：使用知识库
  if (retrieval && knowledge) {
    const queryContent = messages[messages.length - 1].content as string;
    console.log("提问:", queryContent);
    const queryVector = await ZhipuAIEmbedding.embedQuery(queryContent);
    
    await MilvusClients.loadCollection({ collection_name: knowledge.collection });
    const res = await MilvusClients.search({
      collection_name: knowledge.collection,
      data: queryVector,
      limit: 3,
    });
    console.log("Milvus search results:", res);
    await MilvusClients.releaseCollection({ collection_name: knowledge.collection });
    
    let context = "";
    const images: Imag[] = [];
    
    for (const r of res.results) {
      if (r.image && r.image !== "") {
        images.push({
          image_text: r.langchain_text,
          image_url: r.image,
        });
      } else {
        context += r.langchain_text + "\n";
      }
    }
    console.log("构建的上下文:", context);

    const PROMPT_TEMPLATE = `
使用<context>内的信息对<question>标记中包含的问题提供一个简明的答案。
如果你不知道答案，就说你不知道，不要试图编造答案。
<context>
${context}
</context>

<question>
${queryContent}
</question>`;

    messages[messages.length - 1].content = PROMPT_TEMPLATE;
    console.log("最终发送给模型的消息:", messages);
    
    return streamSSE(c, async (stream) => {
      console.log("流式",stream);
      const res = await ChatZhipu.stream(messages);
      console.log("流式里面的res：",res);
      let fullContent = ''; 
      
      for await (const chunk of res) {
        fullContent += chunk.content;
        if (chunk.response_metadata?.finished === "stop") {
          break;
        }
        await stream.writeSSE({
          event: "message",
          data: JSON.stringify({ content: chunk.content }),
        });
      }
      console.log("fullcontent:",fullContent);
      // 如果有图片，在流结束后发送
      if (images.length > 0) {
        await stream.writeSSE({
          event: "img",
          data: JSON.stringify(images),
        });
      }
    });
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