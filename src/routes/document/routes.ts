import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdUUIDParamsSchema } from "stoker/openapi/schemas";

import { Collection, iCollection, sCollection, uCollection, Partition, iPartition, sPartition, uPartition } from "@/db/schema";
import { notFoundSchema } from "@/lib/constants";

const collectionTags = ['collection']
const partitionTags = ['partition']

export const create = createRoute({
    path: '/collections/{id}',
    method: 'post',
    summary: "add a collection",
    description: "add a collection",
    tags: collectionTags,
    request: {
        params: z.object({
            id: z.string()
        }),
        body: jsonContentRequired(
            iCollection,
            "create a Collection"
        )
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            iCollection,
            "return Collection object"
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(iCollection),
            "The validation error(s)",
        ),
    }
})

export const list = createRoute({
    path: "/collections",
    method: "get",
    summary: "List collection",
    description: "List all collection.",
    tags: collectionTags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.array(sCollection),
            "The list of collection.",
        ),
    },
});

export const remove = createRoute({
    path: "/collections/{id}",
    method: "delete",
    summary: "delete an collection",
    description: "delete an collection.",
    request: {
        params: z.object({
            id: z.string(),
        }),
    },
    tags: collectionTags,
    responses: {
        [HttpStatusCodes.OK]:
        {
            description: "collection deleted",
        },
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            notFoundSchema,
            "Collection not found",
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(IdUUIDParamsSchema),
            "The validation error(s)",
        ),
    },
});

export const patch = createRoute({
    path: "/collections/{id}",
    method: "put",
    summary: "update an collection",
    description: "update an collection.",
    request: {
        params: z.object({
            id: z.string({ description: "collection id" }),
        }),
        body: jsonContentRequired(
            uCollection,
            "The collection updates",
        ),
    },
    tags: collectionTags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            sCollection,
            "The collection updated",
        ),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            notFoundSchema,
            "Collection not found",
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(uCollection)
                .or(createErrorSchema(IdUUIDParamsSchema)),
            "The validation error(s)",
        ),
    },
});

export const partitionCreate = createRoute({
    path: '/collections/{id}',
    method: 'post',
    summary: "add a partition",
    description: "add a partition",
    tags: partitionTags,
    request: {
        params: z.object({
            id: z.string()
        }),
        body: jsonContentRequired(
            iPartition,
            "create a Partition"
        )
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            iPartition,
            "return Partition object"
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(iPartition),
            "The validation error(s)",
        ),
    }
})

export const partitionList = createRoute({
    path: "/collections/{id}/partitions",
    method: "get",
    summary: "List partition",
    description: "List all partition.",
    tags: partitionTags,
    request: {
        params: z.object({
            id: z.string({ description: 'collection Id' })
        })
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.array(sPartition),
            "The list of collection.",
        ),
    },
});

export const partitionRemove = createRoute({
    path: "/collections/{collectionsId}/partitions/{partitionId}",
    method: "delete",
    summary: "delete an partition",
    description: "delete an partition.",
    request: {
        params: z.object({
            collectionId: z.string({ description: 'collection Id' }),
            partitionId: z.string({ description: 'partition Id' }),
        }),
    },
    tags: partitionTags,
    responses: {
        [HttpStatusCodes.OK]:
        {
            description: "partition deleted",
        },
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            notFoundSchema,
            "Partition not found",
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(IdUUIDParamsSchema),
            "The validation error(s)",
        ),
    },
});

export const partitionPatch = createRoute({
    path: "/collections/{collectionId}/partitions/{partitionId}",
    method: "put",
    summary: "update an partition",
    description: "update an partition.",
    request: {
        params: z.object({
            collectionId: z.string({ description: 'collection Id' }),
            partitionId: z.string({ description: 'partition Id' }),
        }),
        body: jsonContentRequired(
            uPartition,
            "The partition updates",
        ),
    },
    tags: partitionTags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            sPartition,
            "The partition updated",
        ),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            notFoundSchema,
            "Partition not found",
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(uCollection)
                .or(createErrorSchema(IdUUIDParamsSchema)),
            "The validation error(s)",
        ),
    },
});

export const partitionGet = createRoute({
    path: "/collections/{collectionId}/partitions/{partitionId}",
    method: "get",
    summary: "get a partition clip text",
    description: "get a partition clip text.",
    request: {
        params: z.object({
            collectionId: z.string({ description: 'collection Id' }),
            partitionId: z.string({ description: 'partition Id' }),
        }),
    },
    tags: partitionTags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.object({ partitionText: z.any() }),
            "The requested partition",
        ),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            notFoundSchema,
            "Partition not found",
        ),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
            createErrorSchema(IdUUIDParamsSchema),
            "Invalid id error",
        ),
    },
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type RemoveRoute = typeof remove;
export type PatchRoute = typeof patch;
export type PartitionListRoute = typeof partitionList;
export type PartitionCreateRoute = typeof partitionCreate;
export type PartitionRemoveRoute = typeof partitionRemove;
export type PartitionPatchRoute = typeof partitionPatch;
export type PartitionGetRoute = typeof partitionGet;