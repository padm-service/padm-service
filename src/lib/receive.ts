import * as Amqp from "amqp-ts";
import { vector } from "./vector";
import { Partitions } from "@/db/schema";
import db from '@/db';
import { Partition } from '@/db/schema';
import { eq } from "drizzle-orm";
export const Sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}
var connection = new Amqp.Connection("amqp://localhost");
var queue = connection.declareQueue("QueueName");
queue.prefetch(1);

await queue.activateConsumer(async (message) => {
    const tasks: Partitions = JSON.parse(message.getContent());
    vector(tasks.url, tasks.collectionId, tasks.id);
    await db.update(Partition)
        .set({
            state: 'done'
        })
        .where(eq(Partition.id, tasks.id))
        .returning();
    message.ack(true);
});


