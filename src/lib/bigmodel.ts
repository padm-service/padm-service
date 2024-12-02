import { ChatZhipuAI } from "@langchain/community/chat_models/zhipuai";
import { ZhipuAIEmbeddings } from "@langchain/community/embeddings/zhipuai";
import { HumanMessage } from "@langchain/core/messages";

import env from "@/env";
// import { HumanMessage } from "@langchain/core/messages";
// Use glm-4
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

const embedding = new ZhipuAIEmbeddings({
  apiKey: "fc66133495332152202227a45dab2168.fSa7eZ7pWah7v8Fj",
});
const res = await embedding.embedQuery(
  "What would be a good company name a company that makes colorful socks?",
);
console.log({ res });
