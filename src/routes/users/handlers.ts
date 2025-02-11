import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import db from "@/db";
import type { GetRoute } from "./routes";

export const get: AppRouteHandler<GetRoute> = async (c) => {
  const auth = c.get("auth");
  const id = auth.user.id;
  const user = await db.query.User.findFirst(
    {
      columns: {
        secret: false,
      },
      where(fields, operators) {
        return operators.eq(fields.id, id);
      },
    },
  );
  if (user)
    return c.json(user);
  else
    return c.json("The user no longer exists", HttpStatusCodes.UNPROCESSABLE_ENTITY);
};
