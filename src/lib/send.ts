import type { Partitions } from "@/db/schema";
import env from "@/env";
import amqp from 'amqplib';

const QUEUE_NAME = "vector";
export async function send(partitions: Partitions[]) {
  let connection: amqp.Connection | null = null;
  let channel: amqp.Channel | null = null;
  try {
    connection = await amqp.connect(env.MQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    for (const partition of partitions) {
      const sent = channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(partition)), {
        persistent: true, // 消息持久化
      });
      if (sent) {
        console.log(`生产者：消息已发送 - ${partition}`);
      } else {
        console.error("生产者：消息发送失败");
      }
    }

  } catch (err) {
    console.error("生产者：发生错误 -", err);
  } finally {
    if (channel) await channel.close();
    if (connection) await connection.close();
  }
}


// export async function send(datas: any) {
//   console.log(datas);

//   console.log("开始发送消息");
//   let connection;
//   let queue;
//   connection = new Amqp.Connection(env.MQ_URL);
//   console.log("连接建立成功");
//   await connection.completeConfiguration();
//   console.log("连接配置完成");
//   queue = connection.declareQueue("QueueName", { durable: true });
//   console.log("队列声明成功");
//   const tasks = new Amqp.Message(JSON.stringify({ id: datas[0].id }), {
//     deliveryMode: 2, // 确保消息持久化
//   });

//   await queue.send(tasks);
//   console.log("消息发送成功");
// }

