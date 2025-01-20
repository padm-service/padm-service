import type { ToolDefinition } from "@langchain/core/language_models/base";
import type { MessageFieldWithRole } from "@langchain/core/messages";
import type { ToolCall } from "node_modules/@langchain/core/dist/messages/tool";

import env from "@/env";
import { ChatZhipuAI } from "@langchain/community/chat_models/zhipuai";
// import { ChatZhipuAI } from "./zhipu/zhipuai.cjs";

export async function toolCall(model: string, temperature: number, message: MessageFieldWithRole[], tools: Array<ToolDefinition>) {
  const glm = new ChatZhipuAI({
    model,
    temperature,
    zhipuAIApiKey: env.OPENAI_KEY,
  });

  // const glmWithTools = glm.bindTools(tools);

  const res = await glm.invoke(message);
  console.log(res);

  const toolCalls: Array<ToolCall> | undefined = res?.tool_calls;

  if (toolCalls) {
    for (const tool of toolCalls) {
      const { name, args } = tool;
      const arg = JSON.stringify(args);
      const [service, endpoint] = name?.split("::") ?? [];

      const url = `https://api.platform.archivemodel.cn/services/${service}/fetch/${endpoint}`;
      const req = new Request(url, {
        method: "POST",
        headers: {
          "x-api-key": "sk-ag6ui8h6haj71ouhis7c-d6f2c04e6ef24893f4b7fecec2b5ee6ac917df90",
        },
        body: arg,
      });

      const body = await fetch(req).then(res => res.text());
      message.push({
        tool_call_id: tool?.id ?? "",
        role: "tool",
        content: body,
      });
    }
    return (await glm.invoke(message)).content as string;
  }
  return res.content as string;
}

// const messages = [{ role: "user", content: [{ type: "text", text: "你叫什么名字？" }] }];

// const result = await toolCall("glm-4-flash", 1, messages, [
//   {
//     function: {
//       description: "获取当前时间",
//       name: "service:9hqeyufx38v3bxotb0nq::sys-time",
//       parameters: {
//         properties: {
//           timezone: {
//             description: "时区",
//             example: "Asia/Shanghai",
//             type: "string",
//           },
//         },
//         type: "object",
//       },
//     },
//     type: "function",
//   },
// ]);
// console.log(result);
