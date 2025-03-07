import type { ToolDefinition } from "@langchain/core/language_models/base";
import type { MessageFieldWithRole } from "@langchain/core/messages";
import type { ToolCall } from "node_modules/@langchain/core/dist/messages/tool";
import { ChatZhipu } from "./llm-config";

export async function toolCall(model: string, temperature: number, message: MessageFieldWithRole[], tools: Array<ToolDefinition>) {

  ChatZhipu.model = model;
  ChatZhipu.temperature = temperature;
  const glmWithTools = ChatZhipu?.bindTools(tools);
  var toolCalls: any = [];
  const res = await glmWithTools.stream(message);
  for await (const chunk of res) {
    console.log(chunk.content);
    if (chunk?.tool_calls && chunk?.tool_calls?.length > 0) {
      toolCalls = chunk.tool_calls;
    }
  }
  // const toolCalls: Array<ToolCall> | undefined = tool as Array<ToolCall> | undefined;
  console.log(toolCalls);

  if (toolCalls) {
    for (const tool of toolCalls) {
      const { name, arguments: args } = tool.function;
      const arg = JSON.stringify(arguments);
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

    return (await glmWithTools.invoke(message)).content as string;
  }
  return "";
}

const messages = [{ role: "user", content: "现在几点了" }];

const result = await toolCall("glm-4-flash", 0, messages, [
  {
    function: {
      description: "获取当前时间",
      name: "service:9hqeyufx38v3bxotb0nq::sys-time",
      parameters: {
        properties: {
          timezone: {
            description: "时区",
            example: "Asia/Shanghai",
            type: "string",
          },
        },
        type: "object",
      },
    },
    type: "function",
  },
  {
    type: "function",
    function: {
      name: "get_flight_number",
      description: "根据始发地、目的地和日期，查询对应日期的航班号",
      parameters: {
        "type": "object",
        properties: {
          "departure": {
            "description": "出发地",
            "type": "string"
          },
          destination: {
            "description": "目的地",
            "type": "string"
          },
          date: {
            "description": "日期",
            "type": "string",
          }
        },
        required: ["departure", "destination", "date"]
      },
    }
  },
]);

console.log(result)