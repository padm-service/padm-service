//RabbitMQ的消息队列消费者
import { eq } from "drizzle-orm";
import type { Partitions } from "@/db/schema";
import db from "@/db";
import { Partition } from "@/db/schema";
import env from "@/env";
import { vector } from "./vector";
import amqp from 'amqplib';

const QUEUE_NAME = "vector";
const MQ_URL = env.MQ_URL;
export async function consume() {
  let connection: amqp.Connection | null = null;
  let channel: amqp.Channel | null = null;
  try {
    connection = await amqp.connect(MQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    channel.prefetch(1);
    await channel.consume(QUEUE_NAME, async (message) => {
      if (message) {
        try {
          const partition: Partitions = JSON.parse(message.content.toString());
          await vector(partition.url, partition.collectionId, partition.id, partition.name);
          await db.update(Partition)
            .set({
              state: "done",
            })
            .where(eq(Partition.id, partition.id));
          channel?.ack(message);
        } catch (err) {
          console.error("消费者：消息处理失败 -", err);
          channel?.nack(message, false, true);
        }
      }
    });
  } catch (err) {
    console.error("消费者：发生错误 -", err);
    setTimeout(consume, 5000); // 5秒后重试
  }
}

