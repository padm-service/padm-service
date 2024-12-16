import { ZhipuAIEmbeddings } from "@langchain/community/embeddings/zhipuai";
import Mammoth from 'mammoth'
import { load } from 'cheerio'
import { BufferLoader } from "langchain/document_loaders/fs/buffer";
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'
import { MilvusClients, MilvusFields, MilvusIndexParams, textSplitter } from './vector-config'
import { ZhipuAIEmbedding, ChatZhipu } from './llm-config'


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

export async function textToSQL(loader: BufferLoader, collectionName: string, partitionName: string) {
    const documents = await loader.load();
    const docs = await textSplitter.splitDocuments(documents);
    docs.forEach(async doc => {
        doc.metadata['image'] = ""
        const embedding = await ZhipuAIEmbedding.embedQuery(doc.pageContent)
        const data = {
            source: doc.metadata.source,
            langchain_text: doc.pageContent,
            langchain_vector: embedding,
            image: '',
        }
        await MilvusClients.insert({
            collection_name: collectionName,
            partition_name: partitionName,
            fields_data: [data],
        })
    });
}

function imageToSQL(collectionName: string, partitionName: string, imageUrls: string[], model: string) {
    ChatZhipu.model = model;
    imageUrls.forEach(async imageUrl => {
        const messages = [{ role: 'user', content: [{ type: "image_url", image_url: { url: imageUrl } }, { type: 'text', text: '请描述这张图片' }] }]
        const res = await ChatZhipu.invoke(messages)
        const vector = await ZhipuAIEmbedding.embedQuery(res.content as string)
        const data = {
            source: './dada',
            langchain_text: res.content,
            langchain_vector: vector,
            image: imageUrl
        }
        const result = await MilvusClients.insert({
            collection_name: collectionName,
            partition_name: partitionName,
            fields_data: [data],
        })

    });
}

export async function createOneCollection(collectionId: string) {
    await MilvusClients.createCollection({
        collection_name: collectionId,
        fields: MilvusFields,
        index_params: MilvusIndexParams,
    })
    MilvusClients.releaseCollection({ collection_name: collectionId });
}

export async function renameCollection(oldCollectionId: string, newCollecdtionId: string) {
    await MilvusClients.renameCollection({ collection_name: oldCollectionId, new_collection_name: newCollecdtionId });
}

export async function getPartition(collectionId: string) {
    await MilvusClients.loadCollection({ collection_name: collectionId });
    const result = await MilvusClients.listPartitions(
        { collection_name: collectionId }
    )
    await MilvusClients.releaseCollection({ collection_name: collectionId });
    return result;
}

export async function getPartitionContent(collectionId: string, partitionId: string) {
    await MilvusClients.loadCollection({ collection_name: collectionId });
    MilvusClients.search
    const result = await MilvusClients.query({
        collection_name: collectionId,
        filter: 'langchain_text like ""',
        partition_names: [partitionId],
        output_fields: ['langchain_text'],
    })

    await MilvusClients.releaseCollection({ collection_name: collectionId });
    return result.data;
}

export async function vector(filePath: string, collectionId: string, model: string, partitionID: string) {
    await MilvusClients.loadCollection({ collection_name: collectionId });
    MilvusClients.createPartition({
        collection_name: collectionId,
        partition_name: partitionID
    })
    const pathSplit = filePath.split(".")
    const length = pathSplit.length
    const suffix = pathSplit[length - 1]
    let imageUrls: string[] = []
    switch (suffix) {
        case 'docx': {
            const loader = new DocxLoader(filePath);
            textToSQL(loader, collectionId, partitionID);
            try {
                const html = await convertWordToHtml(filePath);
                imageUrls = extractImageUrls(html);
                if (imageUrls) { imageToSQL(collectionId, partitionID, imageUrls, model) }
            } catch (error) {
                console.log(error);
            }
            break;
        }
        case 'pdf': {
            //pdf逻辑
            break;
        }
        default: break;
    }
    await MilvusClients.releaseCollection({ collection_name: collectionId });
}

export async function deleteCollection(collectionID: string) {
    const res = await MilvusClients.dropCollection({ collection_name: collectionID });
}

export async function deletePartition(collectionId: string, partitionID: string) {
    const res = await MilvusClients.dropPartition({ collection_name: collectionId, partition_name: partitionID });
}

// renameCollection("knowledge1", "knowledge2");
// await createOneCollection('knowledge1')
// const qr = await getPartitionContent('knowledge2', '_default')
// vector("C:\\Users\\wbl\\Desktop\\test.docx", 'knowledge1', 'glm-4v-flash', '1')
// deleteCollection('knowledge1')
// console.log(await getPartitionContent('knowledge2', '1'));
