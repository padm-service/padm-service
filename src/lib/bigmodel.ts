// import { ChatZhipuAI } from "@langchain/community/chat_models/zhipuai";
import { ZhipuAIEmbeddings } from "@langchain/community/embeddings/zhipuai";
import { HumanMessage } from "@langchain/core/messages";

import env from "@/env";

import { ChatZhipuAI } from "./zhipu/zhipuai";

// export function glmQuery(model: string, temperature: number, message: string) {
//   const glm = new ChatZhipuAI({
//     model, // Available models:
//     temperature,
//     zhipuAIApiKey: env.OPENAI_KEY,
//     // In Node.js defaults to process.env.ZHIPUAI_API_KEY
//   });
//   const messages = [new HumanMessage(message)];
//   // message.
// }
const glm4 = new ChatZhipuAI({
  model: "glm-4-flash", // Available models:
  temperature: 1,
  zhipuAIApiKey: env.OPENAI_KEY, // In Node.js defaults to process.env.ZHIPUAI_API_KEY
});

const modelWithTools = glm4?.bindTools([
  {
    type: "function",
    function: {
      name: "get_flight_number",
      description: "根据始发地、目的地和日期，查询对应日期的航班号",
      parameters: {
        type: "object",
        properties: {
          departure: {
            description: "出发地",
            type: "string",
          },
          destination: {
            description: "目的地",
            type: "string",
          },
          date: {
            description: "日期",
            type: "string",
          },
        },
        required: ["departure", "destination", "date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_ticket_price",
      description: "查询某航班在某日的票价",
      parameters: {
        type: "object",
        properties: {
          flight_number: {
            description: "航班号",
            type: "string",
          },
          date: {
            description: "日期",
            type: "string",
          },
        },
        required: ["flight_number", "date"],
      },
    },
  },
],
);
const messages = [new HumanMessage("帮我查询从2024年1月20日，从北京出发前往上海的航班")];

const res = await modelWithTools.invoke(messages);
console.log(res);

// const embedding = new ZhipuAIEmbeddings({
//   apiKey: "fc66133495332152202227a45dab2168.fSa7eZ7pWah7v8Fj",
// });
// const res = await embedding.embedQuery(
//   "What would be a good company name a company that makes colorful socks?",
// );
// console.log({ res });
