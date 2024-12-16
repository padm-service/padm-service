import { Partitions } from "@/db/schema";
import * as Amqp from "amqp-ts";

export async function send(data: Partitions) {
    var connection = new Amqp.Connection("amqp://localhost");
    var queue = connection.declareQueue("QueueName");
    await connection.completeConfiguration().then(() => {
        var tasks = new Amqp.Message(`${JSON.stringify(data)}`);
        queue.send(tasks);
    });
}

const data1 = {
    id: '123',
    name: 'partitionName',
    created_at: new Date(),
    updated_at: new Date(),
    userId: '1234',
    state: 'normal',
    url: '"C:\\Users\\wbl\\Desktop\\test.docx"',
    collectionId: '123452',
    file_size: '130',
    segment: 5,
    file_name: 'test.docx',
}
const data2 = {
    id: '12345676',
    name: 'partitionName',
    created_at: new Date(),
    updated_at: new Date(),
    userId: '1234',
    state: 'normal',
    url: '"C:\\Users\\wbl\\Desktop\\test.docx"',
    collectionId: '123452',
    file_size: '130',
    segment: 5,
    file_name: 'test.docx',
}

send(data1);
send(data2);
