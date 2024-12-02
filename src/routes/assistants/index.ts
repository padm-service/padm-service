import { createRouter } from "@/lib/create-app";

import * as handlers from "./handlers";
import * as routes from "./routes";

const router = createRouter()
  .openapi(routes.create, handlers.create)
  .openapi(routes.get, handlers.get)
  .openapi(routes.list, handlers.list)
  .openapi(routes.patch, handlers.patch)
  .openapi(routes.remove, handlers.remove)
  .openapi(routes.chatCreate, handlers.chatCreate)
  .openapi(routes.chatGet, handlers.chatGet)
  .openapi(routes.chatRemove, handlers.chatRemove);
  // .openapi(routes.chatQuery, handlers.chatQuery);
export default router;
