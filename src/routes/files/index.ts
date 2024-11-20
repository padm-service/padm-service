import { createRouter } from "@/lib/create-app";

import * as handlers from "./handlers";
import * as routes from "./routes";

const router = createRouter()
  .openapi(routes.preSignedUrl, handlers.pre_signed_url)
  .openapi(routes.create, handlers.create)
  .openapi(routes.remove, handlers.remove);
export default router;
