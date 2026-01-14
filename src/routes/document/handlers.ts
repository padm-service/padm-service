import { eq } from "drizzle-orm";
import { AppRouteHandler } from '@/lib/types'
import type { ListRoute, CreateRoute, RemoveRoute, PatchRoute, PartitionCreateRoute, PartitionGetRoute, PartitionListRoute, PartitionPatchRoute, PartitionRemoveRoute, PartitionBatchPatchRoute, PartitionBatchRemoveRoute } from './routes'
import db from '@/db';
import { Collection, Partition, Partitions, Partitionse } from '@/db/schema';
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { deleteCollection, deletePartition } from "@/lib/vector";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/lib/constants";
import { createCollection, getPartitionContent } from "@/lib/vector";
import { send } from "@/lib/send";

export const create: AppRouteHandler<CreateRoute> = async (c) => {
    const auth = c.get('auth');
    const init = c.req.valid('json');
    const userId = auth.user.id;
    const collection = await db.transaction(async (tx) => {
        const [collection] = await tx.insert(Collection).values({
            ...init,
            userId,
        }).returning();
        await createCollection(collection.id);
        return collection;
    });
    return c.json(collection, HttpStatusCodes.OK);
}

export const list: AppRouteHandler<ListRoute> = async (c) => {
    const auth = c.get('auth');
    const collections = await db.query.Collection.findMany({
        where(fields, operators) {
            return operators.eq(fields.userId, auth.user.id);
        },
    },
    );
    return c.json(collections);
}

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
    const { id } = c.req.valid("param");
    await db.transaction(async (tx) => {
        const result = await tx.delete(Collection).where(eq
            (Collection.id, id));
        await tx.delete(Partition).where(eq
            (Partition.collectionId, id));
        await deleteCollection(id);
        if (result.rowsAffected === 0) {
            return c.json(
                {
                    message: HttpStatusPhrases.NOT_FOUND,
                },
                HttpStatusCodes.NOT_FOUND,
            );
        }
    })
    return c.body(null, HttpStatusCodes.NO_CONTENT);
}

export const patch: AppRouteHandler<PatchRoute> = async (c) => {
    const { id } = c.req.valid("param");
    const updates = c.req.valid("json");

    if (Object.keys(updates).length === 0) {
        return c.json(
            {
                success: false,
                error: {
                    issues: [
                        {
                            code: ZOD_ERROR_CODES.INVALID_UPDATES,
                            path: [],
                            message: ZOD_ERROR_MESSAGES.NO_UPDATES,
                        },
                    ],
                    name: "ZodError",
                },
            },
            HttpStatusCodes.UNPROCESSABLE_ENTITY,
        );
    }

    const [collection] = await db.update(Collection)
        .set(updates)
        .where(eq(Collection.id, id))
        .returning();

    if (!collection) {
        return c.json(
            {
                message: HttpStatusPhrases.NOT_FOUND,
            },
            HttpStatusCodes.NOT_FOUND,
        );
    }

    return c.json(collection, HttpStatusCodes.OK);
}

export const partitionList: AppRouteHandler<PartitionListRoute> = async (c) => {
    const { id } = c.req.valid("param");
    const partitions = await db.transaction(async (tx) => {
        const result = await tx.query.Partition.findMany({
            where(fields, operators) {
                return operators.eq(fields.collectionId, id);
            },
        });
        return result;
    })
    return c.json(partitions);
}

export const partitionCreate: AppRouteHandler<PartitionCreateRoute> = async (c) => {
    const auth = c.get('auth');
    const { id } = c.req.valid('param')
    const init = c.req.valid('json');
    const userId = auth.user.id;
    const insert: Partitionse[] = [];
    for (const partition of init) {
        insert.push({
            ...partition,
            collectionId: id,
            userId,
        })
    }
    const partition = await db.insert(Partition).values(insert).returning();
    await send(partition);
    return c.json(partition, HttpStatusCodes.OK);
}

export const partitionRemove: AppRouteHandler<PartitionRemoveRoute> = async (c) => {
    const { collectionId, partitionId } = c.req.valid("param");
    await db.transaction(async (tx) => {
        const result = await tx.delete(Partition).where(eq
            (Partition.id, partitionId));
        await deletePartition(collectionId, partitionId);//删除时，同时清楚相关向量库的知识
        if (result.rowsAffected === 0) {
            return c.json(
                {
                    message: HttpStatusPhrases.NOT_FOUND,
                },
                HttpStatusCodes.NOT_FOUND,
            );
        }
    })
    return c.body(null, HttpStatusCodes.NO_CONTENT);
}
export const partitionBatchRemove: AppRouteHandler<PartitionBatchRemoveRoute> = async (c) => {
    const { collectionId } = c.req.valid("param");
    const { ids } = c.req.valid("json");
    await db.transaction(async (tx) => {
        for (const partitionId of ids) {
            const result = await tx.delete(Partition).where(eq
                (Partition.id, partitionId));
            await deletePartition(collectionId, partitionId);
            if (result.rowsAffected === 0) {
                return c.json(
                    {
                        message: HttpStatusPhrases.NOT_FOUND,
                    },
                    HttpStatusCodes.NOT_FOUND,
                );
            }
        }
    })
    return c.body(null, HttpStatusCodes.NO_CONTENT);
}

export const partitionPatch: AppRouteHandler<PartitionPatchRoute> = async (c) => {
    const { partitionId } = c.req.valid("param");
    const updates = c.req.valid("json");
    if (Object.keys(updates).length === 0) {
        return c.json(
            {
                success: false,
                error: {
                    issues: [
                        {
                            code: ZOD_ERROR_CODES.INVALID_UPDATES,
                            path: [],
                            message: ZOD_ERROR_MESSAGES.NO_UPDATES,
                        },
                    ],
                    name: "ZodError",
                },
            },
            HttpStatusCodes.UNPROCESSABLE_ENTITY,
        );
    }
    const [partition] = await db.update(Partition)
        .set(updates)
        .where(eq(Partition.id, partitionId))
        .returning();

    if (!partition) {
        return c.json(
            {
                message: HttpStatusPhrases.NOT_FOUND,
            },
            HttpStatusCodes.NOT_FOUND,
        );
    }

    return c.json(partition, HttpStatusCodes.OK);
}
export const partitionBatchPatch: AppRouteHandler<PartitionBatchPatchRoute> = async (c) => {
    const { ids, updates } = c.req.valid("json");
    console.log(ids, updates);
    // if (Object.keys(ids).length === 0) {
    //     return c.json(
    //         {
    //             success: false,
    //             error: {
    //                 issues: [
    //                     {
    //                         code: ZOD_ERROR_CODES.INVALID_UPDATES,
    //                         path: [],
    //                         message: ZOD_ERROR_MESSAGES.NO_UPDATES,
    //                     },
    //                 ],
    //                 name: "ZodError",
    //             },
    //         },
    //         HttpStatusCodes.UNPROCESSABLE_ENTITY,
    //     );
    // };
    const partitions = await db.transaction(async (tx) => {
        const partitions: Partitions[] = [];
        for (const id of ids) {
            const [partition] = await tx.update(Partition)
                .set(updates)
                .where(eq(Partition.id, id as string))
                .returning();
            partitions.push(partition);
        }
        return partitions;
    });

    if (!partitions) {
        return c.json(
            {
                message: HttpStatusPhrases.NOT_FOUND,
            },
            HttpStatusCodes.NOT_FOUND,
        );
    }

    return c.json(partitions, HttpStatusCodes.OK);
}

export const partitionGet: AppRouteHandler<PartitionGetRoute> = async (c) => {
    const { collectionId, partitionId } = c.req.valid("param");
    const partitions = await getPartitionContent(collectionId, partitionId);
    if (!partitions) {
        return c.json(
            {
                message: HttpStatusPhrases.NOT_FOUND,
            },
            HttpStatusCodes.NOT_FOUND,
        );
    }
    return c.json({ partitionText: partitions }, HttpStatusCodes.OK);
}