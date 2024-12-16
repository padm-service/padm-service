import { ChatZhipuAI } from "@langchain/community/chat_models/zhipuai";
import { ZhipuAIEmbeddings } from "@langchain/community/embeddings/zhipuai";
import env from "@/env";
import { PromptTemplate } from "@langchain/core/prompts";

export const ZhipuAIEmbedding = new ZhipuAIEmbeddings({
    apiKey: env.OPENAI_KEY,
    modelName: "embedding-2",
})

export const ChatZhipu = new ChatZhipuAI(
    {
        apiKey: env.OPENAI_KEY,
    }
)
