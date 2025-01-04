import * as Amqp from "amqp-ts";

import type { Partitions } from "@/db/schema";

import env from "@/env";

export async function send(data: Partitions) {
  const connection = new Amqp.Connection(env.MQ_URL);
  const queue = connection.declareQueue("QueueName");
  queue.prefetch(1);
  await connection.completeConfiguration().then(() => {
    const tasks = new Amqp.Message(`${JSON.stringify(data)}`);
    queue.send(tasks);
  });
}

const data1 = {
  id: "123",
  name: "partitionName",
  created_at: new Date(),
  updated_at: new Date(),
  userId: "1234",
  state: "normal",
  url: "\"C:\\Users\\wbl\\Desktop\\test.docx\"",
  collectionId: "123452",
  file_size: "130",
  segment: 5,
  file_name: "test.docx",
};
const data2 = {
  id: "12345676",
  name: "partitionName",
  created_at: new Date(),
  updated_at: new Date(),
  userId: "1234",
  state: "normal",
  url: "\"C:\\Users\\wbl\\Desktop\\test.docx\"",
  collectionId: "123452",
  file_size: "130",
  segment: 5,
  file_name: "test.docx",
};

send(data1);
send(data2);
