import { DataType, IndexType, MetricType, MilvusClient } from "@zilliz/milvus2-sdk-node";

const address = `localhost:19530`;
const username = `username`;
const password = `password`;

const client = new MilvusClient({
  address,
  username,
  password,
});

const schema = [
  {
    name: "embedding",
    data_type: DataType.FloatVector,
    dim: 3,
  },
  {
    name: "pk",
    data_type: DataType.Int64,
    is_primary_key: true,
  },
  {
    name: "varchar_field2",
    data_type: DataType.VarChar,
    max_length: 200,
  },
  {
    name: "varchar_field1",
    data_type: DataType.VarChar,
    max_length: 100,
  },
];

const indexParams = [{
  index_name: "varchar_index",
  field_name: "varchar_field1",
  index_type: IndexType.AUTOINDEX,
}];

indexParams.push({
  index_name: "embedding_index",
  field_name: "embedding",
  index_type: IndexType.AUTOINDEX,
});

client.createCollection({
  collection_name: "my_varchar_collection",
  schema,
  index_params: indexParams,
});

const data = [
  {
    varchar_field1: "Product A",
    varchar_field2: "High quality product",
    pk: 1,
    embedding: [0.1, 0.2, 0.3],
  },
  {
    varchar_field1: "Product B",
    varchar_field2: "Affordable price",
    pk: 2,
    embedding: [0.4, 0.5, 0.6],
  },
  {
    varchar_field1: "Product C",
    varchar_field2: "Best seller",
    pk: 3,
    embedding: [0.7, 0.8, 0.9],
  },
];
client.insert({
  collection_name: "my_sparse_collection",
  data,
});
