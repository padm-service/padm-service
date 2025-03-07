import { createRouter } from "@/lib/create-app";

import * as handlers from "./handlers";
import * as routes from "./routes";

const router = createRouter()
    .openapi(routes.create, handlers.create)
    .openapi(routes.list, handlers.list)
    .openapi(routes.patch, handlers.patch)
    .openapi(routes.remove, handlers.remove)
    .openapi(routes.partitionList, handlers.partitionList)
    .openapi(routes.partitionCreate, handlers.partitionCreate)
    .openapi(routes.partitionRemove, handlers.partitionRemove)
    .openapi(routes.partitionPatch, handlers.partitionPatch)
    .openapi(routes.partitionGet, handlers.partitionGet)
    .openapi(routes.partitionBatchPatch, handlers.partitionBatchPatch)
    .openapi(routes.partitionBatchRemove, handlers.partitionBatchRemove);
export default router;