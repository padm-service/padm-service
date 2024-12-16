import { MilvusClient } from "@zilliz/milvus2-sdk-node";
import { DataType, IndexType, MetricType } from "@zilliz/milvus2-sdk-node";
import env from "@/env";
import { CharacterTextSplitter } from '@langchain/textsplitters'

export const MilvusClients = new MilvusClient({
    address: env.VECTOR_URL,
    username: env.VECTOR_USER,
    password: env.VECTOR_PASS,
})

export const MilvusFields = [
    {
        name: 'source',
        data_type: DataType.VarChar,
        max_length: 100,
    },
    {
        name: 'langchain_primaryid',
        data_type: DataType.Int64,
        is_primary_key: true,
        autoID: true,
    },
    {
        name: 'langchain_text',
        data_type: DataType.VarChar,
        max_length: 2364,
    },
    {
        name: 'langchain_vector',
        data_type: DataType.FloatVector,
        dim: 1024,
    },
    {
        name: 'image',
        data_type: DataType.VarChar,
        max_length: 65535,
    },
]

export const MilvusIndexParams = [{
    index_name: '_default_idx_103',
    field_name: 'langchain_vector',
    index_type: IndexType.HNSW,
    metric_type: MetricType.L2,
    params: {
        M: 8,
        efConstruction: 64,
    }
}]

export const textSplitter = new CharacterTextSplitter({ chunkSize: 400, chunkOverlap: 100 });