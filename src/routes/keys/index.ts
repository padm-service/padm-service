import { createRouter } from "@/lib/create-app";

import * as handlers from "./handlers";
import * as routes from "./routes";

const router = createRouter()
  .openapi(routes.remove, handlers.remove)
  .openapi(routes.list, handlers.list)
  .openapi(routes.create, handlers.create);
export default router;
