import { createRouter } from "@/lib/create-app";

import * as handlers from "./handlers";
import * as routes from "./routes";

const router = createRouter()
  .openapi(routes.create, handlers.create)
  .openapi(routes.get, handlers.get)
  .openapi(routes.list, handlers.list)
  .openapi(routes.patch, handlers.patch)
  .openapi(routes.remove, handlers.remove)
  .openapi(routes.nodeCreate, handlers.nodeCreate)
  .openapi(routes.nodeGet, handlers.nodeGet)
  .openapi(routes.nodeList, handlers.nodeList)
  .openapi(routes.nodePatch, handlers.nodePatch)
  .openapi(routes.nodeRemove, handlers.nodeRemove)
  .openapi(routes.getSchema, handlers.getSchema)
  .openapi(routes.getReadme, handlers.getReadme)
  .all("/:id/fetch/*", async (c) => {
    await handlers.allService(c);
  });
export default router;
