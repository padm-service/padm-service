import * as Amqp from "amqp-ts";
import { eq } from "drizzle-orm";

import type { Partitions } from "@/db/schema";

import db from "@/db";
import { Partition } from "@/db/schema";
import env from "@/env";

import { vector } from "./vector";

export function Sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
const connection = new Amqp.Connection(env.MQ_URL);
const queue = connection.declareQueue("QueueName");
queue.prefetch(1);

await queue.activateConsumer(async (message) => {
  const tasks: Partitions = JSON.parse(message.getContent());
  vector(tasks.url, tasks.collectionId, tasks.id);
  await db.update(Partition)
    .set({
      state: "done",
    })
    .where(eq(Partition.id, tasks.id))
    .returning();
  message.ack(true);
});
