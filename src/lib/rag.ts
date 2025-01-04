import { Milvus } from "@langchain/community/vectorstores/milvus";
import { PromptTemplate } from "@langchain/core/prompts";
import { images } from "mammoth";

import env from "@/env";

import type { Imag } from "./types";

import { ChatZhipu, ZhipuAIEmbedding } from "./llm-config";
import { MilvusClients, MilvusFields, MilvusIndexParams, textSplitter } from "./vector-config";

export async function rag(query: string, collectionID: string, partitionIDs: string[], systemPrompt: string, model: string) {
  const queryVector = await ZhipuAIEmbedding.embedQuery(query);
  await MilvusClients.loadCollection({ collection_name: collectionID });
  const res = await MilvusClients.search({
    collection_name: collectionID,
    partition_names: partitionIDs,
    data: queryVector,
    limit: 3,
  });
  await MilvusClients.releaseCollection({ collection_name: collectionID });
  // const vector = await Milvus.fromExistingCollection(
  //     ZhipuAIEmbedding,
  //     {
  //         collectionName: collectionID,
  //         partitionName: partitionID,
  //         url: env.VECTOR_URL,
  //         username: env.VECTOR_USER,
  //         password: env.VECTOR_PASS,
  //     });

  // const retriever = vector.asRetriever(3);
  // const res = await retriever.invoke(query);

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

  const PROMPT_TEMPLATE = `${systemPrompt}
        使用以下信息对<question>标记中包含的问题提供一个简明的答案。
        如果你不知道答案，就说你不知道，不要试图编造答案。
        <context>
        ${context}
        </context>

        <question>
        ${query}
        </question>`;
  ChatZhipu.model = model;
  const result = await ChatZhipu.invoke(PROMPT_TEMPLATE);
  return {
    message: result.content,
    images,
  };
}

// console.log(await rag("草莓", "knowledge1", ['3112'], "你是一个草莓种植专家，能正确准确地回答问题，但只能回答草莓相关的问题。回答中不要出现”根据文档“以及“以上信息来自文档内容”这些字。", "glm-4-flash"));
