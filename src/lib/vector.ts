//知识库构建与管理，将知识库存入向量数据库，为RAG系统做准备 
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
import pLimit from 'p-limit';
import { exec } from "child_process";
import path from "path";
export function convertDocToDocx(inputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // 检查文件是否存在
    if (!fs.existsSync(inputPath)) {
      return reject(new Error("输入文件不存在"));
    }

    if (!inputPath.endsWith(".doc")) {
      return reject(new Error("输入文件必须是 .doc 格式"));
    }

    const outputDir = path.dirname(inputPath);
    const fileName = path.basename(inputPath, ".doc");
    const outputPath = path.join(outputDir, `${fileName}.docx`);

    // LibreOffice 命令
    //const command = `libreoffice --headless --convert-to docx "${inputPath}" --outdir "${outputDir}"`;
    const command = `soffice --headless --convert-to docx "${inputPath}" --outdir "${outputDir}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(`转换失败: ${stderr || error.message}`));
      }

      // 检查输出文件是否生成
      if (!fs.existsSync(outputPath)) {
        return reject(new Error("转换完成但未找到输出文件"));
      }

      resolve(outputPath);
    });
  });
}
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
  const limit = pLimit(10);
  const datas = await Promise.all(
  docs.map(doc =>
    limit(async () => {
      const embedding = await ZhipuAIEmbedding.embedQuery(doc.pageContent);
      return {
        source: url,
        langchain_text: doc.pageContent,
        langchain_vector: embedding,
        image: "",
      };
    })
  )
);
  // const datas = await Promise.all(docs.map(async (doc) => {
  //   limit(async () => {
  //      const embedding = await ZhipuAIEmbedding.embedQuery(doc.pageContent);
  //      return {
  //       source: url,
  //       langchain_text: doc.pageContent,
  //       langchain_vector: embedding,
  //       image: "",
  //       };
  //     })
   
  // }));
  const fieldsData = datas.filter(item => item !== undefined); // 过滤掉可能的 undefined
  console.log("插入数据条数:", datas.length);
  console.log("示例数据:", datas[0]);
  console.log("222插入数据条数:", fieldsData.length);
  console.log("222示例数据:", fieldsData[0]);
  const res = await MilvusClients.insert({
    collection_name: collectionName,
    partition_name: partitionName,
    fields_data: fieldsData,
  });
  console.log(res);
// export async function toText(loader: BufferLoader | BaseDocumentLoader | TextLoader, collectionName: string, partitionName: string, url: string) {
//   const documents = await loader.load();
//   const docs = await textSplitter.splitDocuments(documents);
//   const datas = await Promise.all(docs.map(async (doc) => {
//     const embedding = await ZhipuAIEmbedding.embedQuery(doc.pageContent);
//     return {
//       source: url,
//       langchain_text: doc.pageContent,
//       langchain_vector: embedding,
//       image: "",
//     };
//   }));
//   const res = await MilvusClients.insert({
//     collection_name: collectionName,
//     partition_name: partitionName,
//     fields_data: datas,
//   });
//   console.log(res);

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
    //调用智谱AI的多模态模型生成图片描述
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
    case 'doc': {
      const result = await convertDocToDocx(filePath);
      console.log('转换后的路径',result)
      const loader = new DocxLoader(result);
      await toText(loader, collectionId, partitionID, url);
      break;
    }
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
