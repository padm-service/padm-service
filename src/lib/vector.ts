import type { BufferLoader } from "langchain/document_loaders/fs/buffer";
import * as fs from 'fs';
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { load } from "cheerio";
import Mammoth from "mammoth";
import { download, deleteFile } from "./download";
import { ChatZhipu, ZhipuAIEmbedding } from "./llm-config";
import { MilvusClients, MilvusFields, MilvusIndexParams, textSplitter } from "./vector-config";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
// import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { BaseDocumentLoader } from "@langchain/core/document_loaders/base";
export function convertWordToHtml(wordFilePath: string) {
  return new Promise((resolve, reject) => {
    Mammoth
      .convertToHtml({ path: wordFilePath })
      .then((result) => {
        resolve(result.value);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export function extractImageUrls(html: any) {
  const $ = load(html);
  const imageUrls = [] as string[];
  $("img").each((i, img) => {
    const src = $(img).attr("src");
    if (src) {
      imageUrls.push(src);
    }
  });
  return imageUrls;
};

export async function toText(loader: BufferLoader | BaseDocumentLoader | TextLoader, collectionName: string, partitionName: string, url: string) {
  const documents = await loader.load();
  const docs = await textSplitter.splitDocuments(documents);
  const datas = await Promise.all(docs.map(async (doc) => {
    const embedding = await ZhipuAIEmbedding.embedQuery(doc.pageContent);
    return {
      source: url,
      langchain_text: doc.pageContent,
      langchain_vector: embedding,
      image: "",
    };
  }));
  const res = await MilvusClients.insert({
    collection_name: collectionName,
    partition_name: partitionName,
    fields_data: datas,
  });
  console.log(res);

  // for (const doc of docs) {
  //   doc.metadata.image = "";
  //   const embedding = await ZhipuAIEmbedding.embedQuery(doc.pageContent);
  //   const res = await MilvusClients.insert({
  //     collection_name: collectionName,
  //     partition_name: partitionName,
  //     fields_data: [{
  //       source: url,
  //       langchain_text: doc.pageContent,
  //       langchain_vector: embedding,
  //       image: "",
  //     }],
  //   });
  //   console.log(res);
  // }
}

async function imageToSQL(collectionName: string, partitionName: string, imageUrls: string[], model: string = 'glm-4v-flash', url: string) {
  if (model) {
    ChatZhipu.model = model;
  }
  imageUrls.forEach(async (imageUrl) => {
    const messages = [{ role: "user", content: [{ type: "image_url", image_url: { url: imageUrl } }, { type: "text", text: "请描述这张图片" }] }];
    const res = await ChatZhipu.invoke(messages);
    const vector = await ZhipuAIEmbedding.embedQuery(res.content as string);
    const data = {
      source: url,
      langchain_text: res.content,
      langchain_vector: vector,
      image: imageUrl,
    };
    await MilvusClients.insert({
      collection_name: collectionName,
      partition_name: partitionName,
      fields_data: [data],
    });
  });
}

export async function createCollection(collectionId: string) {
  await MilvusClients.createCollection({
    collection_name: collectionId,
    fields: MilvusFields,
    index_params: MilvusIndexParams,
  });
  MilvusClients.releaseCollection({ collection_name: collectionId });
}

export async function renameCollection(oldCollectionId: string, newCollecdtionId: string) {
  await MilvusClients.renameCollection({ collection_name: oldCollectionId, new_collection_name: newCollecdtionId });
}

export async function getPartition(collectionId: string) {
  await MilvusClients.loadCollection({ collection_name: collectionId });
  const result = await MilvusClients.listPartitions(
    { collection_name: collectionId },
  );
  await MilvusClients.releaseCollection({ collection_name: collectionId });
  return result;
}

export async function getPartitionContent(collectionId: string, partitionId: string) {
  await MilvusClients.loadCollection({ collection_name: collectionId });
  MilvusClients.search;
  const result = await MilvusClients.query({
    collection_name: collectionId,
    filter: "langchain_text like \"\"",
    partition_names: [partitionId],
    output_fields: ["langchain_text"],
  });
  await MilvusClients.releaseCollection({ collection_name: collectionId });
  return result.data;
}

export async function vector(url: string, collectionId: string, partitionID: string, fileName: string, model?: string | undefined) {
  await MilvusClients.loadCollection({ collection_name: collectionId });
  await MilvusClients.createPartition({
    collection_name: collectionId,
    partition_name: partitionID,
  });
  const filePath = await download(url, fileName);
  console.log(filePath);

  const pathSplit = filePath.split(".");
  const suffix = pathSplit.pop();
  let imageUrls: string[] = [];
  switch (suffix) {
    case 'doc':
    case "docx": {
      const loader = new DocxLoader(filePath);
      await toText(loader, collectionId, partitionID, url);
      try {
        const html = await convertWordToHtml(filePath);
        imageUrls = extractImageUrls(html);
        if (imageUrls) {
          await imageToSQL(collectionId, partitionID, imageUrls, model, url);
        }
      }
      catch (error) {
        console.log(error);
      }
      break;
    };
    case "pdf": {
      const loader = new PDFLoader(filePath);
      await toText(loader, collectionId, partitionID, url);
      break;
    };
    case 'txt': {
      const loader = new TextLoader(filePath);
      await toText(loader, collectionId, partitionID, url);
      break;
    };
    case 'csv': {
      const loader = new CSVLoader(filePath);
      await toText(loader, collectionId, partitionID, url);
      break;
    };
    // case 'ppt': {
    //   const loader = new PPTXLoader("path/to/bitcoin.pptx");
    //   await toText(loader, collectionId, partitionID, url);
    //   break;
    // };
    default: break;
  }
  await deleteFile(filePath);
  await MilvusClients.releaseCollection({ collection_name: collectionId });
}

export async function deleteCollection(collectionID: string) {
  await MilvusClients.dropCollection({ collection_name: collectionID });
}

export async function deletePartition(collectionId: string, partitionID: string) {
  await MilvusClients.dropPartition({ collection_name: collectionId, partition_name: partitionID });
}

// renameCollection("knowledge1", "knowledge2");
// await createOneCollection('knowledge1')
// const qr = await getPartitionContent('kxjoaanx68fggokwn6inuprr', 'kimx3y5y0lga90ws31ngwi5y')
// console.log(qr);

// vector("C:\\Users\\wbl\\Desktop\\草莓种植知识汇总版.docx", 'kxjoaanx68fggokwn6inuprr', 'oxjujx4c9wbgtf1df3jhcvol', "草莓种植知识汇总版.docx")
// deleteCollection('knowledge1')
// const res = await getPartitionContent('xazjuzxg57rjze95o3hq9q0y', 'dyvlcs7hgvbce3fimb2fx67f')
// console.log(res);
