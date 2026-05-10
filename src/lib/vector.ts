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
// export function convertWordToHtml(wordFilePath: string) {
//   return Mammoth.convertToHtml({ 
//     path: wordFilePath 
//   }, {
//     // 关键：不转换图片，只提文本，或者将图片处理逻辑分离
//     ignoreEmptyParagraphs: true
//   });
// };

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

// export async function toText(loader: BufferLoader | BaseDocumentLoader | TextLoader, collectionName: string, partitionName: string, url: string) {
//   const documents = await loader.load();
//   const docs = await textSplitter.splitDocuments(documents);
//   const limit = pLimit(5);
//   const datas = await Promise.all(
//   docs.map(doc =>
//     limit(async () => {
//       const embedding = await ZhipuAIEmbedding.embedQuery(doc.pageContent);
//       return {
//         source: url,
//         langchain_text: doc.pageContent,
//         langchain_vector: embedding,
//         image: "",
//       };
//     })
//   )
// );
//   const fieldsData = datas.filter(item => item !== undefined); // 过滤掉可能的 undefined
//   console.log("插入数据条数:", datas.length);
//   console.log("示例数据:", datas[0]);
//   console.log("222插入数据条数:", fieldsData.length);
//   console.log("222示例数据:", fieldsData[0]);
//   const res = await MilvusClients.insert({
//     collection_name: collectionName,
//     partition_name: partitionName,
//     fields_data: fieldsData,
//   });
//   console.log(res);
// }
// export async function toText(
//   loader: BufferLoader | BaseDocumentLoader | TextLoader, 
//   collectionName: string, 
//   partitionName: string, 
//   url: string
// ) {
//   const documents = await loader.load();
//   const docs = await textSplitter.splitDocuments(documents);
//   const limit = pLimit(2); // 降低并发数，减少内存占用
//   let successCount = 0;
  
//   const tasks = docs.map((doc, index) =>
//     limit(async () => {
//       try {
//         const embedding = await ZhipuAIEmbedding.embedQuery(doc.pageContent);
        
//         // 每条数据单独插入，不累积
//         await MilvusClients.insert({
//           collection_name: collectionName,
//           partition_name: partitionName,
//           fields_data: [{
//             source: url,
//             langchain_text: doc.pageContent,
//             langchain_vector: embedding,
//             image: "",
//           }],
//         });
        
//         successCount++;
//         // console.log(`插入成功: ${successCount}/${docs.length}`);
//       } catch (error) {
//         console.error(`第 ${index + 1} 条插入失败:`, error);
//       }
//     })
//   );
  
//   await Promise.all(tasks);
//   console.log(`全部处理完成，成功插入 ${successCount} 条`);
// }
export async function toText(
  loader: BufferLoader | BaseDocumentLoader | TextLoader, 
  collectionName: string, 
  partitionName: string, 
  url: string
) {
  const documents = await loader.load();
  const docs = await textSplitter.splitDocuments(documents);
  
  // 1. 关键优化：不要直接 map，而是分批处理（Batching）
  const batchSize = 5; 
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (doc) => {
      try {
        const embedding = await ZhipuAIEmbedding.embedQuery(doc.pageContent);
        
        await MilvusClients.insert({
          collection_name: collectionName,
          partition_name: partitionName,
          fields_data: [{
            source: url,
            langchain_text: doc.pageContent,
            langchain_vector: embedding,
            image: "",
          }],
        });
      } catch (error) {
        console.error(`插入失败:`, error);
      }
    }));

    // 2. 强制释放当前批次的引用协助 GC
    // @ts-ignore
    batch.length = 0;
  }
  
  // 3. 这里的 documents 可能非常大，处理完后手动置空
  // @ts-ignore
  documents.length = 0;
  console.log(`处理完成`);
}
// async function imageToSQL(collectionName: string, partitionName: string, imageUrls: string[], model: string = 'glm-4v-flash', url: string) {
//   if (model) {
//     ChatZhipu.model = model;
//   }
//   imageUrls.forEach(async (imageUrl) => {
//     const messages = [{ role: "user", content: [{ type: "image_url", image_url: { url: imageUrl } }, { type: "text", text: "请描述这张图片" }] }];
//     //调用智谱AI的多模态模型生成图片描述
//     const res = await ChatZhipu.invoke(messages);
//     const vector = await ZhipuAIEmbedding.embedQuery(res.content as string);
//     const data = {
//       source: url,
//       langchain_text: res.content,
//       langchain_vector: vector,
//       image: imageUrl,
//     };
//     await MilvusClients.insert({
//       collection_name: collectionName,
//       partition_name: partitionName,
//       fields_data: [data],
//     });
//   });
// }
async function imageToSQL(collectionName: string, partitionName: string, imageUrls: string[], model: string = 'glm-4v-flash', url: string) {
  if (model) {
    ChatZhipu.model = model;
  }
  
  // 添加并发控制，限制同时处理 2 个图片
  const limit = pLimit(2);
  
  const tasks = imageUrls.map(imageUrl =>
    limit(async () => {
      try {
        const messages = [{ 
          role: "user", 
          content: [{ type: "image_url", image_url: { url: imageUrl } }, { type: "text", text: "请描述这张图片" }] 
        }];
        
        // 调用智谱AI的多模态模型生成图片描述
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
        
        console.log(`图片处理成功: ${imageUrl.substring(0, 50)}...`);
      } catch (error: any) {
        console.error(`图片处理失败，来源文件: ${url}`, error.message);
      }
    })
  );
  
  await Promise.all(tasks);
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
    // case "docx": {
    //   const loader = new DocxLoader(filePath);
    //   await toText(loader, collectionId, partitionID, url);
    //   try {
    //     const html = await convertWordToHtml(filePath);
    //     imageUrls = extractImageUrls(html);
    //     if (imageUrls) {
    //       console.log('文本处理完成，等待 5 秒后开始处理图片...');
    //       await new Promise(resolve => setTimeout(resolve, 5000));
    //       await imageToSQL(collectionId, partitionID, imageUrls, model, url);
    //     }
    //   }
    //   catch (error) {
    //     console.log(error);
    //   }
    //   break;
    // };
    //内存溢出问题
    // case "docx": {
    //     const loader = new DocxLoader(filePath);
    //     await toText(loader, collectionId, partitionID, url);
    //     loader;
    //     if (global.gc) {
    //         global.gc();
    //         await new Promise(resolve => setTimeout(resolve, 2000));
    //     }
    //     try {
    //         const html = await convertWordToHtml(filePath);
    //         imageUrls = extractImageUrls(html);  
    //         if (imageUrls) {
    //             console.log(`文本处理完成，发现 ${imageUrls.length} 张图片，2秒后开始处理...`);
    //             await new Promise(resolve => setTimeout(resolve, 5000));
    //             await imageToSQL(collectionId, partitionID, imageUrls, model, url);
    //         }
    //     } catch (error) {
    //             console.log('图片处理出错:', error);
    //       }
    //    break;
    // }
    case "docx": {
    // 1. 先处理文本
    const loader = new DocxLoader(filePath);
    await toText(loader, collectionId, partitionID, url);
    
    // 2. 尝试提取图片
    try {
        // 使用 let 定义，方便后续手动释放
        let htmlContent = await convertWordToHtml(filePath);
        
        imageUrls = extractImageUrls(htmlContent);
        
        // --- 关键优化点：立即释放这个巨大的字符串 ---
        htmlContent = ""; // 赋予空字符串
        // @ts-ignore
        htmlContent = null; 
        
        if (imageUrls && imageUrls.length > 0) {
            console.log(`发现 ${imageUrls.length} 张图片，准备处理...`);
            
            // 在处理图片前，给 GC 一个喘息的机会
            if (global.gc) {
                global.gc();
                console.log('已手动触发垃圾回收');
            }
            
            await imageToSQL(collectionId, partitionID, imageUrls, model, url);
        }
    } catch (error) {
        console.log('图片提取出错:', error);
    }
    break;
}
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
