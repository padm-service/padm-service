import { ChatZhipuAI } from "@langchain/community/chat_models/zhipuai";
import { ZhipuAIEmbeddings } from "@langchain/community/embeddings/zhipuai";
import { PromptTemplate } from "@langchain/core/prompts";

import env from "@/env";

export const ZhipuAIEmbedding = new ZhipuAIEmbeddings({
  apiKey: env.OPENAI_KEY,
  modelName: "embedding-2",
});

export const ChatZhipu = new ChatZhipuAI(
  {
    apiKey: env.OPENAI_KEY,
  },
);
