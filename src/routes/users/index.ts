import { createRouter } from "@/lib/create-app";

import * as routes from "./routes";
import * as handlers from "./handlers";

const router = createRouter()
  .openapi(routes.get, handlers.get);
export default router;
