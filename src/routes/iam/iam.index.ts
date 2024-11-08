import { createRouter } from "@/lib/create-app";

import * as handlers from "./iam.handlers";
import * as routes from "./iam.routes";

const router = createRouter()
  .openapi(routes.register, handlers.register)
  .openapi(routes.login, handlers.login);
export default router;
